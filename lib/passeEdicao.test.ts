// Teste do NUCLEO do passe contra BANCO DE VERDADE: o que se prova aqui (a
// segunda confirmacao do mesmo pagamento nao empurra a janela de novo, duas
// confirmacoes simultaneas empurram uma vez so) mora no compare-and-set de uma
// linha, e mock nenhum reproduz isso. Atras da mesma env var de
// `assinaturaCore.test.ts`:
//
//   PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:...@127.0.0.1:5433/seuconviteia \
//     npx vitest run lib/passeEdicao.test.ts
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PASSE_PRECO_CENTS, fimDoPasse } from "./edicao";
import { confirmarPasseEdicao } from "./passeEdicao";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;

const MARCA = "passe-core-teste";

/** Convite PUBLICADO com a janela ja vencida — o caso real de quem compra passe. */
async function conviteFechado(db: PrismaClient) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const prof = await db.professional.create({
    data: { name: "Dono", email: `${MARCA}-${sufixo}@exemplo.test`, passwordHash: "x", plan: "BASICO" },
  });
  return db.event.create({
    data: {
      professionalId: prof.id,
      type: "QUINZE_ANOS",
      subdomain: `${MARCA}-${sufixo}`,
      title: "Festa de teste",
      eventDate: new Date("2030-01-01T00:00:00Z"),
      expiresAt: new Date("2030-02-01T00:00:00Z"),
      status: "PUBLISHED",
      plan: "BASICO",
      edicaoAte: new Date(Date.now() - 60_000), // venceu ha um minuto
    },
  });
}

/** Cobranca do passe como a Task 4 a cria: nasce PENDING. */
async function cobrancaPendente(db: PrismaClient, eventId: string, extra: { createdAt?: Date; kind?: string } = {}) {
  return db.transaction.create({
    data: {
      eventId,
      amountCents: PASSE_PRECO_CENTS,
      kind: extra.kind ?? "EDIT_PASS",
      status: "PENDING",
      ...(extra.createdAt ? { createdAt: extra.createdAt } : {}),
    },
  });
}

describe("confirmarPasseEdicao", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.event.deleteMany({ where: { subdomain: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
    await prisma.$disconnect();
  });

  it.skipIf(!enabled)("pagamento confirmado abre 48h a partir de AGORA", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const tx = await cobrancaPendente(db, event.id);
    const agora = new Date();

    await confirmarPasseEdicao(tx.id, agora);

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte?.toISOString()).toBe(fimDoPasse(agora).toISOString());
    expect((await db.transaction.findUniqueOrThrow({ where: { id: tx.id } })).status).toBe("PAID");
  });

  it.skipIf(!enabled)("a MESMA cobranca confirmada duas vezes nao empurra a janela de novo", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const tx = await cobrancaPendente(db, event.id);
    const agora = new Date();

    await confirmarPasseEdicao(tx.id, agora);
    // O MP reentrega a mesma notificacao por contrato; horas depois, inclusive.
    await confirmarPasseEdicao(tx.id, new Date(agora.getTime() + 3 * 60 * 60_000));

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte?.toISOString()).toBe(fimDoPasse(agora).toISOString());
  });

  it.skipIf(!enabled)("duas confirmacoes SIMULTANEAS abrem a janela uma vez so", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const tx = await cobrancaPendente(db, event.id);
    const a = new Date();
    const b = new Date(a.getTime() + 60 * 60_000);

    await Promise.all([confirmarPasseEdicao(tx.id, a), confirmarPasseEdicao(tx.id, b)]);

    // Uma das duas ganha a corrida; o que nao pode e a janela levar as duas.
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    const venceu = [fimDoPasse(a).toISOString(), fimDoPasse(b).toISOString()];
    expect(venceu).toContain(depois.edicaoAte?.toISOString());
  });

  it.skipIf(!enabled)("Pix pago dias depois abre a janela contada da confirmacao", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const tx = await cobrancaPendente(db, event.id, {
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60_000),
    });
    const agora = new Date();

    // A pessoa pagou. Negar seria ficar com o dinheiro dela.
    await confirmarPasseEdicao(tx.id, agora);

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte?.toISOString()).toBe(fimDoPasse(agora).toISOString());
  });

  it.skipIf(!enabled)("passe pago com a janela aberta ESTENDE, nunca encurta", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const longe = new Date(Date.now() + 10 * 24 * 60 * 60_000);
    await db.event.update({ where: { id: event.id }, data: { edicaoAte: longe } });
    const tx = await cobrancaPendente(db, event.id);

    await confirmarPasseEdicao(tx.id, new Date());

    // Quem pagou dois passes ganha tempo; 48h a partir de agora seria ENCURTAR.
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte?.toISOString()).toBe(longe.toISOString());
    expect((await db.transaction.findUniqueOrThrow({ where: { id: tx.id } })).status).toBe("PAID");
  });

  it.skipIf(!enabled)("lancamento que nao e passe de edicao nao abre nada", async () => {
    const db = prisma!;
    const event = await conviteFechado(db);
    const tx = await cobrancaPendente(db, event.id, { kind: "GIFT_PIX" });

    await confirmarPasseEdicao(tx.id, new Date());

    // Presente de convidado paga o cofre do dono, nao a edicao do site.
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte!.getTime()).toBeLessThan(Date.now());
    expect((await db.transaction.findUniqueOrThrow({ where: { id: tx.id } })).status).toBe("PENDING");
  });
});
