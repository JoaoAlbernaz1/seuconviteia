// Núcleo (server-only, SEM "use server") do fluxo de confirmação de um presente.
// Compartilhado entre a server action `confirmarPresente` e o webhook do gateway
// (/api/webhooks/mercadopago). Idempotente: confirmar duas vezes não duplica nada.
import { prisma } from "@/lib/db";

/**
 * Marca a contribuição como PAGA (idempotente), registra a Transação no ledger e,
 * se o item ficou completo (FIXO pago / COTAS lotado), marca o presente como
 * realizado. Devolve true se está paga ao final.
 */
export async function confirmarContribuicaoPaga(contributionId: string): Promise<boolean> {
  const contrib = await prisma.giftContribution.findUnique({ where: { id: contributionId } });
  if (!contrib) return false;
  if (contrib.status === "PAID") return true; // idempotente

  // COMPARE-AND-SET dentro de UMA transação.
  //
  // Antes era `findUnique` -> `update` -> `create`, solto: o webhook do gateway
  // e o polling da action `confirmarPresente` confirmam o MESMO pagamento e
  // podiam passar juntos pela checagem de status, gravando DUAS Transactions
  // para um Pix só — dinheiro contado em dobro no cofre.
  //
  // Agora só quem muda a linha de não-PAID para PAID (`count === 1`) lança no
  // ledger; o perdedor sai por baixo sabendo que já está pago. E como as duas
  // escritas estão na mesma transação, uma falha ao lançar no ledger desfaz o
  // PAID — em vez de deixar a contribuição paga e o ledger sem o registro,
  // que nenhuma tentativa posterior repararia.
  const ganhouACorrida = await prisma.$transaction(async (tx) => {
    const marcou = await tx.giftContribution.updateMany({
      where: { id: contrib.id, status: { not: "PAID" } },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (marcou.count !== 1) return false;

    await tx.transaction.create({
      data: {
        eventId: contrib.eventId,
        amountCents: contrib.grossCents,
        kind: "GIFT_PIX",
        status: "PAID",
        providerId: contrib.providerChargeId,
      },
    });
    return true;
  });

  // Já estava paga (o outro lado da corrida cuidou do ledger e do item).
  if (!ganhouACorrida) return true;

  // Marca o item como realizado quando totalmente arrecadado.
  const item = await prisma.giftItem.findUnique({ where: { id: contrib.giftItemId } });
  if (item) {
    let completo = false;
    if (item.pricingMode === "FIXO") {
      completo = true; // FIXO: uma contribuição paga o item inteiro
    } else if (item.pricingMode === "COTAS") {
      const s = await prisma.giftContribution.aggregate({
        where: { giftItemId: item.id, status: "PAID" },
        _sum: { quotas: true },
      });
      completo = (s._sum.quotas ?? 0) >= (item.quotaCount ?? 0);
    }
    if (completo && !item.purchased) {
      await prisma.giftItem.update({ where: { id: item.id }, data: { purchased: true } });
    }
  }

  return true;
}
