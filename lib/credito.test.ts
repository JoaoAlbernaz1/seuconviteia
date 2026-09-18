import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { CREDITO_PRECO_CENTS, gastarCredito, saldoDeCreditos } from "./credito";

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

describe("saldo e gasto do credito", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.creditoConvite.deleteMany({
      where: { professional: { email: { contains: MARCA } } },
    });
    await prisma.event.deleteMany({ where: { subdomain: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
  });

  it.skipIf(!enabled)("o preco e R$ 29,90", () => {
    expect(CREDITO_PRECO_CENTS).toBe(2990);
  });

  it.skipIf(!enabled)("saldo conta so o que esta PAID e nao foi gasto", async () => {
    const db = prisma!;
    const prof = await conta(db);
    await db.creditoConvite.createMany({
      data: [
        { professionalId: prof.id, amountCents: 2990, status: "PAID" },
        { professionalId: prof.id, amountCents: 2990, status: "PAID" },
        { professionalId: prof.id, amountCents: 2990, status: "PENDING" },
        { professionalId: prof.id, amountCents: 2990, status: "FAILED" },
      ],
    });
    expect(await saldoDeCreditos(db, prof.id)).toBe(2);
  });

  it.skipIf(!enabled)("gastar marca o credito com o convite e derruba o saldo", async () => {
    const db = prisma!;
    const prof = await conta(db);
    await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990, status: "PAID" },
    });
    const evento = await eventoDe(db, prof.id);
    expect(await gastarCredito(db, prof.id, evento.id)).toBe(true);
    expect(await saldoDeCreditos(db, prof.id)).toBe(0);
  });

  it.skipIf(!enabled)("sem saldo, gastar devolve false e nao inventa linha", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const evento = await eventoDe(db, prof.id);
    expect(await gastarCredito(db, prof.id, evento.id)).toBe(false);
    expect(await db.creditoConvite.count({ where: { professionalId: prof.id } })).toBe(0);
  });

  it.skipIf(!enabled)("UM credito e DOIS convites: so o primeiro leva", async () => {
    const db = prisma!;
    const prof = await conta(db);
    await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990, status: "PAID" },
    });
    const a = await eventoDe(db, prof.id);
    const b = await eventoDe(db, prof.id);
    const resultados = await Promise.all([
      gastarCredito(db, prof.id, a.id),
      gastarCredito(db, prof.id, b.id),
    ]);
    expect(resultados.filter(Boolean)).toHaveLength(1);
  });

  it.skipIf(!enabled)("com DOIS creditos, dois convites concorrentes levam um cada", async () => {
    const db = prisma!;
    const prof = await conta(db);
    await db.creditoConvite.createMany({
      data: [
        { professionalId: prof.id, amountCents: 2990, status: "PAID" },
        { professionalId: prof.id, amountCents: 2990, status: "PAID" },
      ],
    });
    const a = await eventoDe(db, prof.id);
    const b = await eventoDe(db, prof.id);
    const resultados = await Promise.all([
      gastarCredito(db, prof.id, a.id),
      gastarCredito(db, prof.id, b.id),
    ]);
    // Sem a varredura de candidatos, os dois disputariam a MESMA primeira linha
    // e um perderia com saldo sobrando.
    expect(resultados).toEqual([true, true]);
  });
});

// Task 2 acrescenta um SEGUNDO describe neste arquivo (saldo/gasto). O vitest
// roda o afterAll de um describe antes dos testes do proximo — se o disconnect
// morasse dentro do describe acima, o segundo bloco encontraria o client
// fechado. Por isso ele fica aqui fora, um so, depois de todos os describes.
afterAll(async () => {
  await prisma?.$disconnect();
});
