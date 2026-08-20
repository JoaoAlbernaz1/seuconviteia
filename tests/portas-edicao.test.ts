// As tres portas do servidor do convite fechado. Botao escondido nao e bloqueio:
// o que fecha o convite publicado sao as ACTIONS, e so o banco de verdade prova
// o que elas gravaram (`edicaoAte`, `subdomain`, `draftVersion`). Por isso o
// teste fica atras da mesma env var dos outros que precisam de banco:
//
//   PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:...@127.0.0.1:5433/seuconviteia \
//     npx vitest run tests/portas-edicao.test.ts
//
// A terceira porta (abrir o editor) e um `redirect` de server component e esta
// provada no navegador, em `e2e/editor-foundation.spec.ts`.
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import { legacyEventToDocument } from "@/lib/event-editor/legacy";
import { CORTESIA_MINUTOS } from "@/lib/edicao";
import { calcularExpiracao } from "@/lib/dates";
import { eventoPublico } from "@/lib/event";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;

const MARCA = "portas-edicao-teste";

/** As actions leem a sessao do Auth.js; aqui ela e fixada na conta do teste. */
const sessionMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: sessionMock, signIn: vi.fn(), signOut: vi.fn() }));
// `revalidatePath` so existe dentro de um request do Next; aqui o que importa e
// o que ficou gravado no banco.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// As acoes do painel (`adicionarConvidado` e companhia) nao devolvem erro: elas
// REDIRECIONAM. O mock deixa o destino visivel (o `redirect` de verdade so lanca
// um digest opaco).
const redirectMock = vi.hoisted(() =>
  vi.fn((url: string): never => {
    throw new Error(`REDIRECT:${url}`);
  }),
);
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

const { salvarDocumentoConvite, publicarDocumentoConvite } = await import(
  "@/app/(dashboard)/painel/criar/acoes"
);
const { adicionarConvidado } = await import("@/app/(dashboard)/painel/acoes");

const FECHADO = "Este convite está publicado. Libere a edição para mexer no site.";

/** Conta + convite com rascunho valido, do jeito que o editor grava. */
async function convite(db: PrismaClient, dados: Partial<Prisma.EventUncheckedCreateInput> = {}) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const prof = await db.professional.create({
    data: { name: "Dono", email: `${MARCA}-${sufixo}@exemplo.test`, passwordHash: "x" },
  });
  const event = await db.event.create({
    data: {
      professionalId: prof.id,
      type: "QUINZE_ANOS",
      subdomain: `${MARCA}-${sufixo}`,
      title: "Festa de teste",
      eventDate: new Date("2030-01-01T00:00:00Z"),
      expiresAt: new Date("2030-02-01T00:00:00Z"),
      ...dados,
    },
  });
  // O documento canonico sai do proprio evento (mesmo caminho do editor ao abrir
  // um convite legado), entao ele passa no Zod da action sem fixture inventada.
  const document = legacyEventToDocument({ ...event, gifts: [], photos: [] });
  const comRascunho = await db.event.update({
    where: { id: event.id },
    data: { draftData: document as unknown as Prisma.InputJsonValue, draftVersion: 1 },
  });
  sessionMock.mockResolvedValue({ user: { id: prof.id, email: prof.email } });
  return { prof, event: comRascunho, document };
}

beforeEach(() => {
  sessionMock.mockReset();
});

describe("portas do editor no convite fechado", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.event.deleteMany({ where: { subdomain: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
    await prisma.$disconnect();
  });

  it.skipIf(!enabled)("publicado com a janela vencida nao salva nem republica", async () => {
    const db = prisma!;
    const { event, document } = await convite(db, {
      status: "PUBLISHED",
      edicaoAte: new Date(Date.now() - 60_000), // venceu ha um minuto
    });

    const salvo = await salvarDocumentoConvite({ id: event.id, expectedVersion: 1, document });
    expect(salvo).toEqual({ ok: false, kind: "fechado", error: FECHADO });

    const publicado = await publicarDocumentoConvite({ id: event.id, expectedDraftVersion: 1 });
    expect(publicado).toEqual({ ok: false, kind: "fechado", error: FECHADO });

    // Recusar sem gravar: a versao do rascunho nao pode ter andado.
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.draftVersion).toBe(1);
  });

  it.skipIf(!enabled)("a PRIMEIRA publicacao abre a cortesia de 1h", async () => {
    const db = prisma!;
    const { event } = await convite(db, { status: "DRAFT" });

    const r = await publicarDocumentoConvite({ id: event.id, expectedDraftVersion: 1 });
    expect(r.ok).toBe(true);

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.status).toBe("PUBLISHED");
    // Tolerancia em SEGUNDOS: com margem de minutos, uma cortesia de 59 min
    // passaria batido.
    const segundos = (depois.edicaoAte!.getTime() - Date.now()) / 1_000;
    expect(segundos).toBeGreaterThan(CORTESIA_MINUTOS * 60 - 10);
    expect(segundos).toBeLessThanOrEqual(CORTESIA_MINUTOS * 60);
  });

  it.skipIf(!enabled)("republicar na janela paga nao mexe no prazo nem no endereco", async () => {
    const db = prisma!;
    const { event, document } = await convite(db, { status: "PUBLISHED", publishedVersion: 1 });
    // Janela paga em curso (48h) — e um documento pedindo OUTRO endereco.
    const janela = new Date(Date.now() + 48 * 3_600_000);
    await db.event.update({ where: { id: event.id }, data: { edicaoAte: janela } });

    const salvo = await salvarDocumentoConvite({
      id: event.id,
      expectedVersion: 1,
      document: { ...document, basic: { ...document.basic, slug: `${MARCA}-outro-endereco` } },
    });
    expect(salvo.ok).toBe(true);

    const r = await publicarDocumentoConvite({ id: event.id, expectedDraftVersion: 2 });
    expect(r.ok).toBe(true);

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    // O link ja foi mandado no WhatsApp: republicar nao troca o subdominio...
    expect(depois.subdomain).toBe(event.subdomain);
    // ...e nao encurta nem estica a janela vigente.
    expect(depois.edicaoAte!.getTime()).toBe(janela.getTime());
  });

  // A DUPLA que define a linha do produto: o convite fechado congela o SITE e
  // deixa livre o que e movimento da festa.
  //
  // A metade de cima chamava `atualizarDetalhes` — a tela "Detalhes" do painel
  // antigo, que gravava direto no que o convidado ve (inclusive `expiresAt`).
  // Aquelas seis telas morreram na Task 11: hoje a UNICA porta do site e a
  // action do editor, e e ela que precisa recusar.
  it.skipIf(!enabled)("o convite fechado nao muda o site, mas a lista de convidados anda", async () => {
    const db = prisma!;
    const { event, document } = await convite(db, {
      status: "PUBLISHED",
      publishedAt: new Date("2026-01-01T00:00:00Z"),
      edicaoAte: new Date(Date.now() - 60_000),
    });

    const salvo = await salvarDocumentoConvite({
      id: event.id,
      expectedVersion: 1,
      document: { ...document, basic: { ...document.basic, name: "Nome trocado por fora" } },
    });
    expect(salvo).toEqual({ ok: false, kind: "fechado", error: FECHADO });

    const site = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(site.title).toBe(event.title);
    expect(site.expiresAt.getTime()).toBe(event.expiresAt.getTime());

    // O mesmo convite fechado: convidado entra na lista sem passe nenhum.
    const convidado = new FormData();
    convidado.set("eventId", event.id);
    convidado.set("name", "Tia Nilza");
    await adicionarConvidado(convidado);
    expect(await db.guest.count({ where: { eventId: event.id } })).toBe(1);
  });

  // O AUTOSAVE nao pode derrubar o site que esta no ar. A promessa esta escrita
  // na tela do dono ("o site atual continua no ar ate voce publicar as
  // alteracoes") e `expiresAt` e o que `eventoPublico` le para responder ou nao:
  // gravar a data do rascunho na linha fazia o convite sumir para os convidados
  // no meio da edicao PAGA, e sem volta (dali em diante toda porta recusava por
  // "festa passou").
  it.skipIf(!enabled)("o autosave do publicado NAO mexe na data do site; publicar mexe", async () => {
    const db = prisma!;
    const { event, document } = await convite(db, {
      status: "PUBLISHED",
      publishedVersion: 1,
      publishedAt: new Date("2026-01-01T00:00:00Z"),
      edicaoAte: new Date(Date.now() + 48 * 3_600_000), // janela paga, correndo
    });

    // O erro classico: o ano digitado errado, que joga a festa para o passado.
    const comAnoErrado = { ...document, schedule: { ...document.schedule, date: "2020-05-10" } };
    const salvo = await salvarDocumentoConvite({ id: event.id, expectedVersion: 1, document: comAnoErrado });
    expect(salvo.ok).toBe(true);

    const durante = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(durante.expiresAt.getTime()).toBe(event.expiresAt.getTime());
    expect(durante.eventDate.getTime()).toBe(event.eventDate.getTime());
    // O site continua no ar, e o proprio editor continua salvando/publicando.
    expect(eventoPublico(durante, new Date()).ok).toBe(true);

    // O conserto sobe pela porta de sempre: corrigir a data e PUBLICAR.
    const corrigido = { ...document, schedule: { ...document.schedule, date: "2031-05-10", time: "21:00" } };
    const resalvo = await salvarDocumentoConvite({ id: event.id, expectedVersion: 2, document: corrigido });
    expect(resalvo.ok).toBe(true);

    const r = await publicarDocumentoConvite({ id: event.id, expectedDraftVersion: 3 });
    expect(r.ok).toBe(true);

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    const esperada = new Date("2031-05-10T21:00:00-03:00");
    expect(depois.eventDate.getTime()).toBe(esperada.getTime());
    expect(depois.expiresAt.getTime()).toBe(calcularExpiracao(esperada).getTime());
  });

  // E a outra ponta da mesma regra: com a data so na linha ANTIGA, publicar
  // ainda precisa reprovar o rascunho cuja data ja passou.
  it.skipIf(!enabled)("publicar reprova a data vencida que veio no RASCUNHO", async () => {
    const db = prisma!;
    const { event, document } = await convite(db, {
      status: "PUBLISHED",
      publishedVersion: 1,
      publishedAt: new Date("2026-01-01T00:00:00Z"),
      edicaoAte: new Date(Date.now() + 48 * 3_600_000),
    });

    const vencido = { ...document, schedule: { ...document.schedule, date: "2020-05-10" } };
    expect((await salvarDocumentoConvite({ id: event.id, expectedVersion: 1, document: vencido })).ok).toBe(true);

    const r = await publicarDocumentoConvite({ id: event.id, expectedDraftVersion: 2 });
    expect(r).toEqual({
      ok: false,
      kind: "validation",
      error: "Com essa data o convite já estaria encerrado. Escolha uma data futura.",
    });
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.expiresAt.getTime()).toBe(event.expiresAt.getTime());
  });

  it.skipIf(!enabled)("rascunho com data vencida SALVA, mas nao publica", async () => {
    const db = prisma!;
    const { event, document } = await convite(db, {
      status: "DRAFT",
      eventDate: new Date("2020-01-01T00:00:00Z"),
      expiresAt: new Date("2020-02-01T00:00:00Z"),
    });

    // O rascunho e onde se conserta o ano digitado errado: salvar tem que passar.
    const salvo = await salvarDocumentoConvite({ id: event.id, expectedVersion: 1, document });
    expect(salvo.ok).toBe(true);

    // Publicar e outra pergunta: o site nasceria fora do ar.
    const r = await publicarDocumentoConvite({ id: event.id, expectedDraftVersion: 2 });
    expect(r).toEqual({
      ok: false,
      kind: "validation",
      error: "Com essa data o convite já estaria encerrado. Escolha uma data futura.",
    });
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.status).toBe("DRAFT");
  });
});

// ----------------------------------------------------------------------------
// Moderacao de recado (Task 12) — a porta que NAO existe e a que precisa provar
// ----------------------------------------------------------------------------
//
// As acoes de recado sao o oposto das tres de cima: elas NAO podem exigir janela
// de edicao (tirar ofensa do ar nao se compra). O que as segura e so o `eventId`
// dentro do `where` — uma clausula que qualquer refactor apaga sem quebrar nada
// visivel na tela. Estes dois casos sao o que morde nesse dia: com a clausula
// fora, o recado do A some pelas maos do B e os testes ficam verdes.
const { esconderRecado, excluirRecado } = await import("@/app/(dashboard)/painel/acoes");

describe("moderacao de recado: um tenant nao alcanca o mural do outro", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.event.deleteMany({ where: { subdomain: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
  });

  /** Dois donos, dois convites, e um recado no mural do primeiro. */
  async function doisMurais(db: PrismaClient) {
    const a = await convite(db, { status: "PUBLISHED" });
    const b = await convite(db, { status: "PUBLISHED" }); // deixa a sessao em B
    const recado = await db.recado.create({
      data: { eventId: a.event.id, name: "Convidada do A", message: "Recado do mural do A" },
    });
    return { a, b, recado };
  }

  it.skipIf(!enabled)("B nao APAGA recado do A passando o proprio eventId", async () => {
    const db = prisma!;
    const { a, b, recado } = await doisMurais(db);

    // O ataque: id de recado alheio + um eventId que E do atacante. `eventoDoDono`
    // sozinho aprova (o evento e mesmo do B) — quem recusa e o `eventId` do where.
    await excluirRecado(recado.id, b.event.id);

    const vivo = await db.recado.findUnique({ where: { id: recado.id } });
    expect(vivo).not.toBeNull();
    expect(vivo?.eventId).toBe(a.event.id);
  });

  it.skipIf(!enabled)("B nao ESCONDE recado do A passando o proprio eventId", async () => {
    const db = prisma!;
    const { recado } = await doisMurais(db);

    // Controle: com o eventId do A a porta ja fecha antes (`eventoDoDono` nao
    // acha o evento e a acao redireciona) — este caso nao depende do `where`.
    await expect(esconderRecado(recado.id, recado.eventId)).rejects.toThrow(/REDIRECT/);
    expect((await db.recado.findUniqueOrThrow({ where: { id: recado.id } })).approved).toBe(true);

    // O caso que importa: eventId PROPRIO do B. Aqui `eventoDoDono` aprova, e a
    // unica coisa entre o B e o mural do A e o `eventId` do `where`.
    const meu = await db.event.findFirstOrThrow({
      where: { subdomain: { startsWith: MARCA }, id: { not: recado.eventId } },
      orderBy: { createdAt: "desc" },
    });
    await esconderRecado(recado.id, meu.id);
    expect((await db.recado.findUniqueOrThrow({ where: { id: recado.id } })).approved).toBe(true);
  });

  it.skipIf(!enabled)("o DONO esconde e apaga o proprio recado", async () => {
    const db = prisma!;
    const { event } = await convite(db, { status: "PUBLISHED" }); // sessao = dono
    const recado = await db.recado.create({
      data: { eventId: event.id, name: "Vovo", message: "Parabens!" },
    });

    await esconderRecado(recado.id, event.id);
    expect((await db.recado.findUniqueOrThrow({ where: { id: recado.id } })).approved).toBe(false);

    await excluirRecado(recado.id, event.id);
    expect(await db.recado.findUnique({ where: { id: recado.id } })).toBeNull();
  });
});
