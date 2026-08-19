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

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;

const MARCA = "portas-edicao-teste";

/** As actions leem a sessao do Auth.js; aqui ela e fixada na conta do teste. */
const sessionMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: sessionMock, signIn: vi.fn(), signOut: vi.fn() }));
// `revalidatePath` so existe dentro de um request do Next; aqui o que importa e
// o que ficou gravado no banco.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { salvarDocumentoConvite, publicarDocumentoConvite } = await import(
  "@/app/(dashboard)/painel/criar/acoes"
);

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
    const minutos = (depois.edicaoAte!.getTime() - Date.now()) / 60_000;
    expect(minutos).toBeGreaterThan(CORTESIA_MINUTOS - 2);
    expect(minutos).toBeLessThanOrEqual(CORTESIA_MINUTOS);
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
});
