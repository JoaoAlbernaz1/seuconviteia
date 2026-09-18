import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;

const MARCA = "credito-modelo-teste";

async function conta(db: PrismaClient) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return db.professional.create({
    data: { name: "Dono", email: `${MARCA}-${sufixo}@exemplo.test`, passwordHash: "x" },
  });
}

async function eventoDe(db: PrismaClient, professionalId: string) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return db.event.create({
    data: {
      professionalId,
      type: "QUINZE_ANOS",
      subdomain: `${MARCA}-${sufixo}`,
      title: "Festa",
      eventDate: new Date(Date.now() + 30 * 864e5),
      expiresAt: new Date(Date.now() + 60 * 864e5),
    },
  });
}

describe("modelo CreditoConvite", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.creditoConvite.deleteMany({
      where: { professional: { email: { contains: MARCA } } },
    });
    await prisma.event.deleteMany({ where: { subdomain: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
  });

  it.skipIf(!enabled)("nasce PENDING, sem convite e sem cobranca", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const credito = await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990 },
    });
    expect(credito.status).toBe("PENDING");
    expect(credito.eventId).toBeNull();
    expect(credito.providerId).toBeNull();
    expect(credito.paidAt).toBeNull();
  });

  it.skipIf(!enabled)("DOIS creditos nao podem apontar para o MESMO convite", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const evento = await eventoDe(db, prof.id);
    await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990, status: "PAID", eventId: evento.id },
    });
    // O indice unico e a rede: gasto duplo tem de morrer NO BANCO, nao na aplicacao.
    await expect(
      db.creditoConvite.create({
        data: { professionalId: prof.id, amountCents: 2990, status: "PAID", eventId: evento.id },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it.skipIf(!enabled)("apagar o convite DEVOLVE o credito ao saldo", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const evento = await eventoDe(db, prof.id);
    const credito = await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990, status: "PAID", eventId: evento.id },
    });
    await db.event.delete({ where: { id: evento.id } });
    const depois = await db.creditoConvite.findUnique({ where: { id: credito.id } });
    expect(depois?.eventId).toBeNull();
  });
});

// Task 2 acrescenta um SEGUNDO describe neste arquivo (saldo/gasto). O vitest
// roda o afterAll de um describe antes dos testes do proximo — se o disconnect
// morasse dentro do describe acima, o segundo bloco encontraria o client
// fechado. Por isso ele fica aqui fora, um so, depois de todos os describes.
afterAll(async () => {
  await prisma?.$disconnect();
});
