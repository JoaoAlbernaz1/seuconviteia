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

  await prisma.giftContribution.update({
    where: { id: contrib.id },
    data: { status: "PAID", paidAt: new Date() },
  });

  await prisma.transaction.create({
    data: {
      eventId: contrib.eventId,
      amountCents: contrib.grossCents,
      kind: "GIFT_PIX",
      status: "PAID",
      providerId: contrib.providerChargeId,
    },
  });

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
