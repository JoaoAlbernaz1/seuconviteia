// A COTA DE CONVITES do plano, provada no banco de verdade.
//
// A cota tinha UMA porta (criar) e isso nao bastava: convite com data vencida
// nao ocupa vaga, e o campo de data aceita dia no passado. O caminho que o
// Basico tinha para ficar com DOIS convites no ar:
//
//   1. cria o convite A com data velha  -> nasce vencido, nao ocupa vaga
//   2. cria o convite B, o de verdade   -> a vaga ainda estava livre
//   3. volta em A, arruma a data e publica -> dois no ar no plano de um
//
// O que fecha o caminho e cobrar a vaga tambem na REATIVACAO (salvar rascunho
// vencido com data futura) e no PUBLICAR. Botao escondido no painel nao prova
// nada: quem tranca sao as actions, e so o banco mostra o que elas gravaram.
//
//   PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:...@127.0.0.1:5433/seuconviteia \
//     npx vitest run tests/limite-de-convites.test.ts
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import { legacyEventToDocument } from "@/lib/event-editor/legacy";
import type { EventEditorDocument } from "@/lib/event-editor/document";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;

const MARCA = "limite-convites-teste";
const DIA = 24 * 60 * 60 * 1000;
/** Data futura que o dono digitaria no editor para "consertar" o convite. */
const FUTURO = "2031-05-20";

const sessionMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: sessionMock, signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { salvarDocumentoConvite, publicarDocumentoConvite } = await import(
  "@/app/(dashboard)/painel/criar/acoes"
);

/** Conta logada. `plan` sem assinatura viva vale BASICO (`planoEfetivo`). */
async function conta(db: PrismaClient, dados: Partial<Prisma.ProfessionalUncheckedCreateInput> = {}) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const prof = await db.professional.create({
    data: { name: "Dono", email: `${MARCA}-${sufixo}@exemplo.test`, passwordHash: "x", ...dados },
  });
  sessionMock.mockResolvedValue({ user: { id: prof.id, email: prof.email } });
  return prof;
}

/**
 * Convite com rascunho valido. A `eventDate` decide tudo: no futuro ele ocupa
 * vaga, no passado ele ja venceu e a vaga volta a ficar livre.
 */
async function convite(db: PrismaClient, professionalId: string, eventDate: Date) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const event = await db.event.create({
    data: {
      professionalId,
      type: "QUINZE_ANOS",
      subdomain: `${MARCA}-${sufixo}`,
      title: "Festa de teste",
      status: "DRAFT",
      eventDate,
      expiresAt: new Date(eventDate.getTime() + 2 * DIA),
    },
  });
  // O documento canonico sai do proprio evento (mesmo caminho do editor ao abrir
  // um convite que ja existe), entao ele passa no Zod da action sem fixture.
  const document = legacyEventToDocument({ ...event, gifts: [], photos: [] });
  const comRascunho = await db.event.update({
    where: { id: event.id },
    data: { draftData: document as unknown as Prisma.InputJsonValue, draftVersion: 1 },
  });
  return { event: comRascunho, document };
}

/** O mesmo documento com outra data de festa — o que o dono digita no editor. */
function comData(document: EventEditorDocument, iso: string): EventEditorDocument {
  return { ...document, schedule: { ...document.schedule, date: iso } };
}

beforeEach(() => {
  sessionMock.mockReset();
});

describe("cota de convites do plano", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.event.deleteMany({ where: { subdomain: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
    await prisma.$disconnect();
  });

  it.skipIf(!enabled)("com a vaga tomada, SALVAR nao ressuscita o convite vencido", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const morto = await convite(db, prof.id, new Date(Date.now() - 10 * DIA));
    await convite(db, prof.id, new Date(Date.now() + 60 * DIA)); // o convite de verdade

    const r = await salvarDocumentoConvite({
      id: morto.event.id,
      expectedVersion: 1,
      document: comData(morto.document, FUTURO),
    });

    expect(r).toMatchObject({ ok: false, kind: "limit" });
    // Recusou SEM gravar: a data velha continua na linha e o rascunho nao andou.
    const depois = await db.event.findUniqueOrThrow({ where: { id: morto.event.id } });
    expect(depois.draftVersion).toBe(1);
    expect(depois.expiresAt.getTime()).toBeLessThan(Date.now());
  });

  it.skipIf(!enabled)("com a vaga tomada, PUBLICAR nao poe o convite vencido no ar", async () => {
    const db = prisma!;
    const prof = await conta(db);
    // O caso que so o publicar pega: o rascunho JA aponta para uma data futura
    // (foi salvo quando a vaga ainda estava livre), e a linha continua vencida.
    const morto = await convite(db, prof.id, new Date(Date.now() - 10 * DIA));
    await db.event.update({
      where: { id: morto.event.id },
      data: { draftData: comData(morto.document, FUTURO) as unknown as Prisma.InputJsonValue },
    });
    await convite(db, prof.id, new Date(Date.now() + 60 * DIA));

    const r = await publicarDocumentoConvite({ id: morto.event.id, expectedDraftVersion: 1 });

    expect(r).toMatchObject({ ok: false, kind: "limit" });
    const depois = await db.event.findUniqueOrThrow({ where: { id: morto.event.id } });
    expect(depois.status).toBe("DRAFT");
    expect(depois.expiresAt.getTime()).toBeLessThan(Date.now());
  });

  it.skipIf(!enabled)("quem JA ocupa a vaga nao paga por ela de novo", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const unico = await convite(db, prof.id, new Date(Date.now() + 60 * DIA));

    const salvo = await salvarDocumentoConvite({ id: unico.event.id, expectedVersion: 1, document: unico.document });
    expect(salvo.ok).toBe(true);
    const publicado = await publicarDocumentoConvite({ id: unico.event.id, expectedDraftVersion: 2 });
    expect(publicado.ok).toBe(true);
  });

  it.skipIf(!enabled)("passada a festa, a vaga volta: o vencido pode ser consertado e republicado", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const morto = await convite(db, prof.id, new Date(Date.now() - 10 * DIA));

    const salvo = await salvarDocumentoConvite({
      id: morto.event.id,
      expectedVersion: 1,
      document: comData(morto.document, FUTURO),
    });
    expect(salvo.ok).toBe(true);
    const publicado = await publicarDocumentoConvite({ id: morto.event.id, expectedDraftVersion: 2 });
    expect(publicado.ok).toBe(true);

    const depois = await db.event.findUniqueOrThrow({ where: { id: morto.event.id } });
    expect(depois.status).toBe("PUBLISHED");
    expect(depois.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it.skipIf(!enabled)("plano com convites ilimitados passa pelas tres portas", async () => {
    const db = prisma!;
    const prof = await conta(db, {
      plan: "CLASSICO",
      assinaturaStatus: "authorized",
      assinaturaAte: new Date(Date.now() + 365 * DIA),
    });
    const morto = await convite(db, prof.id, new Date(Date.now() - 10 * DIA));
    await convite(db, prof.id, new Date(Date.now() + 60 * DIA));

    const salvo = await salvarDocumentoConvite({
      id: morto.event.id,
      expectedVersion: 1,
      document: comData(morto.document, FUTURO),
    });
    expect(salvo.ok).toBe(true);
    const publicado = await publicarDocumentoConvite({ id: morto.event.id, expectedDraftVersion: 2 });
    expect(publicado.ok).toBe(true);
  });
});
