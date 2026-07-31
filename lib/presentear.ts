"use server";

// Server actions do fluxo "presentear" (site público do evento).
//
// Modelo "conta única + carteira interna" (spec 2026-07-31): o convidado paga a
// PLATAFORMA (Pix, hoje simulado pelo FakePaymentProvider); retemos a taxa e
// creditamos o líquido no cofre do convite. A confirmação (`confirmarPresente`)
// é o "webhook fake" — na Fatia 4 (Asaas) ela vira o webhook assinado de verdade.
//
// Segurança/tenant: o eventId e o giftItemId chegam do cliente mas são
// RE-RESOLVIDOS e RE-VALIDADOS no servidor (evento publicado + item pertence ao
// evento). Nunca confiamos só no input. LGPD: nome + consentimento explícito.
import { z } from "zod";
import { prisma } from "@/lib/db";
import { eventoPublico } from "@/lib/event";
import { getPaymentProvider } from "@/lib/pagamentos";
import { calcularTaxaCents, calcularLiquidoCents } from "@/lib/pagamentos/taxa";
import { valorDaContribuicao, type GiftPricing } from "@/lib/pagamentos/contribuicao";

const iniciarSchema = z.object({
  eventId: z.string().min(1),
  giftItemId: z.string().min(1),
  buyerName: z.string().trim().min(2, "Informe seu nome.").max(80),
  buyerContact: z.string().trim().max(120).optional(),
  message: z.string().trim().max(500).optional(),
  quotas: z.coerce.number().int().min(1).max(1000).optional(),
  valorCustomCents: z.coerce.number().int().min(0).max(100_000_00).optional(),
  consentimento: z.literal(true, {
    message: "É preciso aceitar o compartilhamento dos dados.",
  }),
});

export type IniciarPresenteInput = {
  eventId: string;
  giftItemId: string;
  buyerName: string;
  buyerContact?: string;
  message?: string;
  quotas?: number;
  valorCustomCents?: number;
  consentimento: boolean;
};

export type IniciarPresenteResult =
  | { ok: true; contributionId: string; pixCode: string; pixQrUrl: string; brutoCents: number }
  | { ok: false; erro: string };

/**
 * Cria a contribuição (PENDING) e a cobrança Pix. Devolve o código copia-e-cola
 * + o QR para o convidado pagar. A confirmação vem depois (`confirmarPresente`).
 */
export async function iniciarPresente(input: IniciarPresenteInput): Promise<IniciarPresenteResult> {
  const parsed = iniciarSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? "Confira os dados." };
  }
  const dados = parsed.data;

  // Re-resolve o evento e valida visibilidade (não confia no cliente).
  const event = await prisma.event.findUnique({ where: { id: dados.eventId } });
  const visivel = eventoPublico(event, new Date());
  if (!event || !visivel.ok) {
    return { ok: false, erro: "Este convite não está disponível." };
  }

  // Item precisa pertencer AO evento (isolamento por tenant).
  const item = await prisma.giftItem.findFirst({
    where: { id: dados.giftItemId, eventId: event.id },
  });
  if (!item) return { ok: false, erro: "Presente não encontrado." };

  const valor = valorDaContribuicao(
    {
      pricingMode: item.pricingMode as GiftPricing,
      priceCents: item.priceCents,
      quotaCount: item.quotaCount,
    },
    { quotas: dados.quotas, valorCustomCents: dados.valorCustomCents },
  );
  if (!valor.ok) return { ok: false, erro: valor.erro };

  // COTAS: não deixar exceder o total já vendido (contribuições PAGAS).
  if (item.pricingMode === "COTAS") {
    const vendidas = await prisma.giftContribution.aggregate({
      where: { giftItemId: item.id, status: "PAID" },
      _sum: { quotas: true },
    });
    const jaVendidas = vendidas._sum.quotas ?? 0;
    const total = item.quotaCount ?? 0;
    if (jaVendidas + (valor.quotas ?? 0) > total) {
      return { ok: false, erro: "Esse presente já foi completado." };
    }
  }

  const feeCents = calcularTaxaCents(valor.brutoCents);
  const netCents = calcularLiquidoCents(valor.brutoCents);
  const provider = getPaymentProvider();

  // Cria a contribuição PENDING primeiro (o id vira a referência da cobrança).
  const contrib = await prisma.giftContribution.create({
    data: {
      eventId: event.id,
      giftItemId: item.id,
      buyerName: dados.buyerName,
      buyerContact: dados.buyerContact || null,
      message: dados.message || null,
      quotas: valor.quotas ?? null,
      grossCents: valor.brutoCents,
      feeCents,
      netCents,
      status: "PENDING",
      provider: provider.nome,
    },
  });

  try {
    const cobranca = await provider.criarCobrancaPix({
      valorCents: valor.brutoCents,
      descricao: item.title,
      referencia: contrib.id,
      pagador: { nome: dados.buyerName },
    });
    await prisma.giftContribution.update({
      where: { id: contrib.id },
      data: {
        providerChargeId: cobranca.chargeId,
        pixCode: cobranca.pixCode,
        pixQrUrl: cobranca.pixQrUrl,
      },
    });
    return {
      ok: true,
      contributionId: contrib.id,
      pixCode: cobranca.pixCode,
      pixQrUrl: cobranca.pixQrUrl,
      brutoCents: valor.brutoCents,
    };
  } catch (err) {
    console.error("[presentear] falha ao criar cobrança Pix:", err);
    await prisma.giftContribution.update({
      where: { id: contrib.id },
      data: { status: "FAILED" },
    });
    return { ok: false, erro: "Não foi possível gerar o Pix agora. Tente de novo." };
  }
}

/**
 * "Webhook fake": confirma o pagamento de uma contribuição (idempotente).
 * Marca PAID, registra a Transação (ledger) e, se o item ficou completo, o
 * marca como realizado. Na Fatia 4 (Asaas) isto vira o webhook assinado.
 */
export async function confirmarPresente(contributionId: string): Promise<{ ok: boolean }> {
  const id = z.string().min(1).safeParse(contributionId);
  if (!id.success) return { ok: false };

  const contrib = await prisma.giftContribution.findUnique({ where: { id: id.data } });
  if (!contrib) return { ok: false };
  if (contrib.status === "PAID") return { ok: true }; // idempotente

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

  return { ok: true };
}
