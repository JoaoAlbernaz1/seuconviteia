import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import { legacyEventToDocument } from "@/lib/event-editor/legacy";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;

const MARCA = "credito-portas-teste";
const DIA = 24 * 60 * 60 * 1000;

const sessionMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: sessionMock, signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { salvarDocumentoConvite, publicarDocumentoConvite } = await import(
  "@/app/(dashboard)/painel/criar/acoes"
);

async function conta(db: PrismaClient) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const prof = await db.professional.create({
    data: { name: "Dono", email: `${MARCA}-${sufixo}@exemplo.test`, passwordHash: "x" },
  });
  sessionMock.mockResolvedValue({ user: { id: prof.id, email: prof.email } });
  return prof;
}

/** Convite no ar (data futura), opcionalmente pago por um credito. */
async function convite(db: PrismaClient, professionalId: string, pagoPorCredito: boolean) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const event = await db.event.create({
    data: {
      professionalId,
      type: "QUINZE_ANOS",
      subdomain: `${MARCA}-${sufixo}`,
      title: "Festa de teste",
      status: "DRAFT",
      eventDate: new Date(Date.now() + 30 * DIA),
      expiresAt: new Date(Date.now() + 60 * DIA),
    },
  });
  if (pagoPorCredito) {
    await db.creditoConvite.create({
      data: { professionalId, amountCents: 2990, status: "PAID", eventId: event.id },
    });
  }
  return event;
}

/**
 * Documento válido para a action, tirado do próprio evento — o mesmo caminho que
 * o editor usa ao abrir um convite que já existe, então ele passa no Zod da
 * action sem fixture. Mesma técnica de `tests/limite-de-convites.test.ts`.
 */
function documentoDe(event: Awaited<ReturnType<typeof convite>>) {
  return legacyEventToDocument({ ...event, gifts: [], photos: [] });
}

beforeEach(() => {
  sessionMock.mockReset();
});

describe("a vaga do Gratis e o credito", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.creditoConvite.deleteMany({
      where: { professional: { email: { contains: MARCA } } },
    });
    await prisma.event.deleteMany({ where: { subdomain: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
    await prisma.$disconnect();
  });

  it.skipIf(!enabled)("convite pago por CREDITO nao ocupa a vaga gratuita", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const comprado = await convite(db, prof.id, true);
    // A vaga gratuita continua LIVRE: criar o convite do plano tem de passar.
    const criado = await salvarDocumentoConvite({
      expectedVersion: 0,
      document: documentoDe(comprado),
    });
    expect(criado).toMatchObject({ ok: true });
  });

  it.skipIf(!enabled)("convite GRATUITO no ar ocupa a vaga, e o segundo e recusado", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const gratuito = await convite(db, prof.id, false);
    const criado = await salvarDocumentoConvite({
      expectedVersion: 0,
      document: documentoDe(gratuito),
    });
    expect(criado).toMatchObject({ ok: false, kind: "limit" });
  });

  it.skipIf(!enabled)("a TERCEIRA porta: publicar o gratuito passa com um comprado no ar", async () => {
    const db = prisma!;
    const prof = await conta(db);
    await convite(db, prof.id, true); // comprado, nao disputa vaga

    // O convite gratuito, com rascunho pronto para publicar.
    const gratuito = await convite(db, prof.id, false);
    const comRascunho = await db.event.update({
      where: { id: gratuito.id },
      data: {
        draftData: documentoDe(gratuito) as unknown as Prisma.InputJsonValue,
        draftVersion: 1,
        edicaoAte: new Date(Date.now() + DIA),
      },
    });

    const publicado = await publicarDocumentoConvite({
      id: comRascunho.id,
      expectedDraftVersion: 1,
    });

    // Sem a mudanca de `vagaParaAtivar`, o convite COMPRADO ocuparia a vaga e a
    // porta de publicar recusaria o unico convite do plano.
    expect(publicado).toMatchObject({ ok: true });
  });
});
