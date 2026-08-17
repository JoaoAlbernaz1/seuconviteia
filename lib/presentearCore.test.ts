// Teste de CONCORRÊNCIA da confirmação de pagamento — precisa de banco de
// verdade (o bug só existe entre dois processos disputando a mesma linha, e
// mock nenhum reproduz isso). Atrás de env var, como
// `legacy-db-characterization.test.ts`:
//
//   PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:...@127.0.0.1:5433/seuconviteia \
//     npx vitest run lib/presentearCore.test.ts
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { confirmarContribuicaoPaga } from "./presentearCore";

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
