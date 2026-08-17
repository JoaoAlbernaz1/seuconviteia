// Teste dos eventos de assinatura contra BANCO DE VERDADE — o que se prova aqui
// (o segundo webhook nao cobra de novo, o cancelamento nao apaga o prazo pago)
// so existe na disputa entre dois processos pela mesma linha, e mock nenhum
// reproduz isso. Atras de env var, no molde de `presentearCore.test.ts`:
//
//   PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:...@127.0.0.1:5433/seuconviteia \
//     npx vitest run lib/assinaturaCore.test.ts
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { aplicarStatusAssinatura, registrarCobrancaAssinatura } from "./assinaturaCore";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;

const MARCA = "assinatura-teste";

/** Conta descartavel ja apontando para uma assinatura do MP. */
async function conta(db: PrismaClient, pre: string) {
  return db.professional.create({
    data: {
      name: "Assinante",
      email: `${MARCA}-${pre}@exemplo.test`,
      passwordHash: "x",
      plan: "CLASSICO",
      mpPreapprovalId: pre,
      assinaturaStatus: "pending",
    },
  });
}

describe("eventos de assinatura", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.cobrancaAssinatura.deleteMany({ where: { providerId: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
    await prisma.$disconnect();
  });

  it.skipIf(!enabled)("authorized empurra o vencimento um mês à frente", async () => {
    const db = prisma!;
    const pre = `${MARCA}-a${Date.now()}`;
    const p = await conta(db, pre);

    expect(await aplicarStatusAssinatura(pre, "authorized")).toBe(true);

    const depois = await db.professional.findUniqueOrThrow({ where: { id: p.id } });
    expect(depois.assinaturaStatus).toBe("authorized");
    expect(depois.assinaturaAte).not.toBeNull();
    expect(depois.assinaturaAte!.getTime()).toBeGreaterThan(Date.now());
  });

  it.skipIf(!enabled)("cancelled NÃO apaga o vencimento já pago", async () => {
    const db = prisma!;
    const pre = `${MARCA}-c${Date.now()}`;
    const p = await conta(db, pre);
    await aplicarStatusAssinatura(pre, "authorized");
    const ateAntes = (await db.professional.findUniqueOrThrow({ where: { id: p.id } })).assinaturaAte;

    await aplicarStatusAssinatura(pre, "cancelled");

    const depois = await db.professional.findUniqueOrThrow({ where: { id: p.id } });
    expect(depois.assinaturaStatus).toBe("cancelled");
    expect(depois.assinaturaAte?.getTime()).toBe(ateAntes?.getTime());
  });

  it.skipIf(!enabled)("a mesma cobrança entregue duas vezes grava UMA linha", async () => {
    const db = prisma!;
    const pre = `${MARCA}-d${Date.now()}`;
    const p = await conta(db, pre);
    const cobranca = {
      preapprovalId: pre,
      providerId: `${MARCA}-pay-${Date.now()}`,
      amountCents: 5900,
      pagoEm: new Date(),
    };

    const [x, y] = await Promise.all([
      registrarCobrancaAssinatura(cobranca),
      registrarCobrancaAssinatura(cobranca),
    ]);

    expect(x || y).toBe(true);
    expect(await db.cobrancaAssinatura.count({ where: { providerId: cobranca.providerId } })).toBe(1);
    expect((await db.professional.findUniqueOrThrow({ where: { id: p.id } })).assinaturaAte).not.toBeNull();
  });

  it.skipIf(!enabled)("assinatura desconhecida não explode", async () => {
    expect(await aplicarStatusAssinatura(`${MARCA}-nao-existe`, "authorized")).toBe(false);
  });
});
