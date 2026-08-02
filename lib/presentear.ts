"use server";

// Server actions do fluxo "presentear" (site público do evento).
//
// Modelo "conta única + carteira interna": o convidado paga a PLATAFORMA (Pix,
// via Mercado Pago em prod ou FakePaymentProvider em dev); retemos a taxa e
// creditamos o líquido no cofre do convite. Em produção quem confirma é o webhook
// assinado do MP (/api/webhooks/mercadopago); `confirmarPresente` é o atalho
// manual usado só no modo simulado (dev).
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
import { confirmarContribuicaoPaga } from "@/lib/presentearCore";

const ehEmail = (v: string | undefined): v is string =>
  !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

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
      pagador: {
        nome: dados.buyerName,
        email: ehEmail(dados.buyerContact) ? dados.buyerContact : undefined,
      },
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
 * Confirmação MANUAL (só modo simulado/dev): o modal chama isto no botão
 * "Confirmar pagamento". Em produção quem confirma é o webhook do gateway
 * (/api/webhooks/mercadopago) — este atalho não existe no fluxo real.
 */
export async function confirmarPresente(contributionId: string): Promise<{ ok: boolean }> {
  const id = z.string().min(1).safeParse(contributionId);
  if (!id.success) return { ok: false };
  // Trava de segurança: só o provedor simulado permite confirmação manual.
  if (getPaymentProvider().nome !== "fake") return { ok: false };
  const ok = await confirmarContribuicaoPaga(id.data);
  return { ok };
}

/**
 * Consulta o status REAL da cobrança no gateway (polling do modal). Se o
 * pagamento caiu (approved), confirma a contribuição e devolve "PAID". Nunca
 * confia no cliente: re-lê a contribuição e usa o chargeId salvo no servidor.
 */
export async function checarPagamento(
  contributionId: string,
): Promise<{ status: "PENDING" | "PAID" | "FAILED" }> {
  const id = z.string().min(1).safeParse(contributionId);
  if (!id.success) return { status: "PENDING" };

  const contrib = await prisma.giftContribution.findUnique({ where: { id: id.data } });
  if (!contrib) return { status: "FAILED" };
  if (contrib.status === "PAID") return { status: "PAID" };
  if (!contrib.providerChargeId) return { status: "PENDING" };

  try {
    const { status } = await getPaymentProvider().consultarCobranca(contrib.providerChargeId);
    if (status === "PAID") {
      await confirmarContribuicaoPaga(contrib.id);
      return { status: "PAID" };
    }
    if (status === "FAILED" || status === "REFUNDED") return { status: "FAILED" };
    return { status: "PENDING" };
  } catch (err) {
    console.error("[presentear] falha ao consultar pagamento:", err);
    return { status: "PENDING" };
  }
}
