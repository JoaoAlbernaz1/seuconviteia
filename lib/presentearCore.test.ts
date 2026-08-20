// Teste de CONCORRÊNCIA da confirmação de pagamento — precisa de banco de
// verdade (o bug só existe entre dois processos disputando a mesma linha, e
// mock nenhum reproduz isso). Atrás de env var, como
// `legacy-db-characterization.test.ts`:
//
//   PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:...@127.0.0.1:5433/seuconviteia \
//     npx vitest run lib/presentearCore.test.ts
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { confirmarContribuicaoPaga, estornarContribuicao } from "./presentearCore";
import { saldoDoEvento } from "./pagamentos/contribuicao";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;

const MARCA = "concorrencia-teste";

async function limpar(db: PrismaClient) {
  await db.transaction.deleteMany({ where: { providerId: { startsWith: MARCA } } });
  await db.giftContribution.deleteMany({ where: { providerChargeId: { startsWith: MARCA } } });
  await db.giftItem.deleteMany({ where: { title: MARCA } });
  await db.event.deleteMany({ where: { subdomain: { startsWith: MARCA } } });
  await db.professional.deleteMany({ where: { email: { contains: MARCA } } });
}


/** Profissional + evento descartaveis. `expiresAt` e obrigatorio no schema. */
async function criarEvento(db: PrismaClient, sufixo: string) {
  const prof = await db.professional.create({
    data: { name: "Corrida", email: `${MARCA}-${sufixo}@exemplo.test`, passwordHash: "x", plan: "PREMIUM" },
  });
  return db.event.create({
    data: {
      professionalId: prof.id,
      type: "QUINZE_ANOS",
      subdomain: `${MARCA}-${sufixo}`,
      title: "Corrida",
      eventDate: new Date("2026-12-01T23:00:00Z"),
      expiresAt: new Date("2027-06-01T23:00:00Z"),
      status: "PUBLISHED",
      plan: "PREMIUM",
    },
  });
}

describe("confirmarContribuicaoPaga sob corrida", () => {
  afterAll(async () => {
    if (!prisma) return;
    await limpar(prisma);
    await prisma.$disconnect();
  });

  it.skipIf(!enabled)(
    "duas confirmações simultâneas do MESMO Pix lançam UMA transação só",
    async () => {
      const db = prisma!;
      await limpar(db);

      const charge = `${MARCA}-${Date.now()}`;
      const evento = await criarEvento(db, `a${Date.now()}`);
      const item = await db.giftItem.create({
        data: { eventId: evento.id, title: MARCA, priceCents: 10_000, mode: "PIX", pricingMode: "FIXO" },
      });
      const contrib = await db.giftContribution.create({
        data: {
          eventId: evento.id,
          giftItemId: item.id,
          buyerName: "Convidado",
          grossCents: 10_000,
          feeCents: 500,
          netCents: 9_500,
          status: "PENDING",
          provider: "mercadopago",
          providerChargeId: charge,
        },
      });

      // O webhook e o polling da action chegam JUNTOS. Antes do conserto os
      // dois passavam pela checagem de status e cada um criava sua Transaction.
      const [a, b] = await Promise.all([
        confirmarContribuicaoPaga(contrib.id),
        confirmarContribuicaoPaga(contrib.id),
      ]);

      // Os dois devem responder "está paga" — nenhum lado pode dizer que falhou.
      expect(a).toBe(true);
      expect(b).toBe(true);

      const lancamentos = await db.transaction.count({ where: { providerId: charge } });
      expect(lancamentos).toBe(1);

      const depois = await db.giftContribution.findUniqueOrThrow({ where: { id: contrib.id } });
      expect(depois.status).toBe("PAID");
      expect(depois.paidAt).not.toBeNull();
    },
  );

  it.skipIf(!enabled)("o banco recusa um segundo lançamento com o mesmo id do gateway", async () => {
    const db = prisma!;
    const charge = `${MARCA}-unico-${Date.now()}`;
    const evento = await criarEvento(db, `b${Date.now()}`);
    const dados = {
      eventId: evento.id,
      amountCents: 10_000,
      kind: "GIFT_PIX",
      status: "PAID",
      providerId: charge,
    };

    await db.transaction.create({ data: dados });
    await expect(db.transaction.create({ data: dados })).rejects.toThrow();
  });
});

// ESTORNO de presente (refund/chargeback). O webhook tratava estorno SO do
// passe de edicao: um presente estornado ficava PAID e o liquido continuava no
// cofre — dinheiro que voltou para o convidado, sacavel pelo dono. Como o saldo
// e Sigma dos `netCents` das contribuicoes PAID (`saldoDoEvento`), o conserto e
// tirar a contribuicao de PAID; a Transaction do ledger vira REFUNDED no mesmo
// lugar, do jeito que `registrarEstornoPasse` ja fazia com o passe.
describe("estornarContribuicao", () => {
  afterAll(async () => {
    if (!prisma) return;
    await limpar(prisma);
  });

  async function contribuicaoPaga(db: PrismaClient, sufixo: string, pricingMode: "FIXO" | "LIVRE") {
    const charge = `${MARCA}-estorno-${sufixo}`;
    const evento = await criarEvento(db, `e${sufixo}`);
    const item = await db.giftItem.create({
      data: { eventId: evento.id, title: MARCA, priceCents: 10_000, mode: "PIX", pricingMode },
    });
    const contrib = await db.giftContribution.create({
      data: {
        eventId: evento.id,
        giftItemId: item.id,
        buyerName: "Convidado",
        grossCents: 10_000,
        feeCents: 500,
        netCents: 9_500,
        status: "PENDING",
        provider: "mercadopago",
        providerChargeId: charge,
      },
    });
    await confirmarContribuicaoPaga(contrib.id);
    return { evento, item, contrib, charge };
  }

  it.skipIf(!enabled)("estorno tira o dinheiro do cofre e destrava o item", async () => {
    const db = prisma!;
    const { evento, item, contrib, charge } = await contribuicaoPaga(db, `a${Date.now()}`, "FIXO");

    // Ponto de partida: pago, no cofre, e o item marcado como realizado.
    const antes = await db.giftContribution.findUniqueOrThrow({ where: { id: contrib.id } });
    expect(antes.status).toBe("PAID");
    expect((await db.giftItem.findUniqueOrThrow({ where: { id: item.id } })).purchased).toBe(true);
    expect(
      saldoDoEvento(await db.giftContribution.findMany({ where: { eventId: evento.id } }), []),
    ).toBe(9_500);

    await estornarContribuicao(contrib.id);

    const depois = await db.giftContribution.findUniqueOrThrow({ where: { id: contrib.id } });
    expect(depois.status).toBe("REFUNDED");
    // O saldo do cofre volta a zero — e o ponto todo.
    expect(
      saldoDoEvento(await db.giftContribution.findMany({ where: { eventId: evento.id } }), []),
    ).toBe(0);
    // O lancamento do ledger vira REFUNDED NO LUGAR (igual ao passe), sem linha nova.
    const lancamentos = await db.transaction.findMany({ where: { providerId: charge } });
    expect(lancamentos).toHaveLength(1);
    expect(lancamentos[0].status).toBe("REFUNDED");
    // E o presente volta a ficar disponivel: ninguem pagou por ele.
    expect((await db.giftItem.findUniqueOrThrow({ where: { id: item.id } })).purchased).toBe(false);
  });

  it.skipIf(!enabled)("reentrega da mesma notificacao nao estorna duas vezes", async () => {
    const db = prisma!;
    const { evento, contrib } = await contribuicaoPaga(db, `b${Date.now()}`, "LIVRE");

    const [a, b] = await Promise.all([
      estornarContribuicao(contrib.id),
      estornarContribuicao(contrib.id),
    ]);
    expect([a, b].filter(Boolean)).toHaveLength(1); // so um lado ganha a corrida

    expect((await db.giftContribution.findUniqueOrThrow({ where: { id: contrib.id } })).status).toBe("REFUNDED");
    expect(
      saldoDoEvento(await db.giftContribution.findMany({ where: { eventId: evento.id } }), []),
    ).toBe(0);
  });

  it.skipIf(!enabled)("contribuicao que nunca foi paga nao vira estorno", async () => {
    const db = prisma!;
    const charge = `${MARCA}-estorno-pendente-${Date.now()}`;
    const evento = await criarEvento(db, `c${Date.now()}`);
    const item = await db.giftItem.create({
      data: { eventId: evento.id, title: MARCA, priceCents: 5_000, mode: "PIX", pricingMode: "FIXO" },
    });
    const contrib = await db.giftContribution.create({
      data: {
        eventId: evento.id, giftItemId: item.id, buyerName: "Convidado",
        grossCents: 5_000, feeCents: 250, netCents: 4_750,
        status: "PENDING", provider: "mercadopago", providerChargeId: charge,
      },
    });

    expect(await estornarContribuicao(contrib.id)).toBe(false);
    // Continua PENDING: estornar o que nao entrou seria inventar um evento.
    expect((await db.giftContribution.findUniqueOrThrow({ where: { id: contrib.id } })).status).toBe("PENDING");
  });
});
