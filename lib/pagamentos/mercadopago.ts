// Provedor de pagamento Mercado Pago (Pix). Usa a API REST via fetch (sem SDK).
// Ativado quando MERCADO_PAGO_ACCESS_TOKEN está setado (ver getPaymentProvider).
//
// Fluxo Pix:
//  1) criarCobrancaPix -> POST /v1/payments (payment_method_id: "pix") -> devolve
//     o copia-e-cola (qr_code) + a imagem (qr_code_base64) + o id da cobrança.
//  2) o convidado paga no app do banco.
//  3) o Mercado Pago chama nosso webhook (/api/webhooks/mercadopago) quando o
//     status muda -> confirmamos a contribuição. O modal também consulta o status
//     (consultarCobranca) como rede de segurança.
import { createHmac, timingSafeEqual } from "node:crypto";
import type { PayStatus } from "./contribuicao";
import type { CobrancaPix, CobrancaPixInput, PaymentProvider, Transferencia } from "./index";

const MP_API = "https://api.mercadopago.com";

/** Mapeia o status do Mercado Pago para o nosso PayStatus. */
export function mapMpStatus(status: string | undefined): PayStatus {
  switch (status) {
    case "approved":
      return "PAID";
    case "refunded":
    case "charged_back":
      return "REFUNDED";
    case "rejected":
    case "cancelled":
      return "FAILED";
    default:
      // pending, in_process, authorized, etc.
      return "PENDING";
  }
}

/** E-mail do pagador exigido pelo MP: usa o contato se for e-mail; senão sintetiza. */
function emailPagador(input: CobrancaPixInput): string {
  const c = input.pagador?.email?.trim();
  if (c && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return c;
  return `convidado-${input.referencia}@seuconviteia.com.br`;
}

export class MercadoPagoPaymentProvider implements PaymentProvider {
  readonly nome = "mercadopago";

  private token(): string {
    const t = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!t) throw new Error("MERCADO_PAGO_ACCESS_TOKEN ausente.");
    return t;
  }

  async criarCobrancaPix(input: CobrancaPixInput): Promise<CobrancaPix> {
    const body = {
      transaction_amount: Number((input.valorCents / 100).toFixed(2)),
      description: (input.descricao || "Presente").slice(0, 240),
      payment_method_id: "pix",
      external_reference: input.referencia,
      payer: {
        email: emailPagador(input),
        first_name: (input.pagador?.nome || "Convidado").slice(0, 40),
      },
    };
    const res = await fetch(`${MP_API}/v1/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token()}`,
        "Content-Type": "application/json",
        // Idempotência: a mesma contribuição nunca gera duas cobranças.
        "X-Idempotency-Key": input.referencia,
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok || !data) {
      const msg = (data?.message as string) ?? `HTTP ${res.status}`;
      throw new Error(`Mercado Pago: ${msg}`);
    }
    const poi = data.point_of_interaction as
      | { transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } }
      | undefined;
    const td = poi?.transaction_data ?? {};
    const pixCode = td.qr_code ?? "";
    const pixQrUrl = td.qr_code_base64
      ? `data:image/png;base64,${td.qr_code_base64}`
      : td.ticket_url ?? "";
    return {
      chargeId: String(data.id),
      pixCode,
      pixQrUrl,
      status: mapMpStatus(data.status as string | undefined),
    };
  }

  async consultarCobranca(chargeId: string): Promise<{ status: PayStatus }> {
    const res = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(chargeId)}`, {
      headers: { Authorization: `Bearer ${this.token()}` },
    });
    const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok || !data) {
      throw new Error(`Mercado Pago: consulta falhou (HTTP ${res.status}).`);
    }
    return { status: mapMpStatus(data.status as string | undefined) };
  }

  async transferir(): Promise<Transferencia> {
    // Saque do cofre para o Pix do dono: fica para a etapa de payouts (não é o
    // fluxo do convidado). Evita uso acidental antes de estar homologado.
    throw new Error("Transferência (payout) via Mercado Pago ainda não implementada.");
  }
}

/**
 * Valida a assinatura do webhook do Mercado Pago (header x-signature: "ts=..,v1=..").
 * Manifesto: `id:<dataId>;request-id:<xRequestId>;ts:<ts>;` — HMAC-SHA256 com o
 * segredo do webhook. Sem segredo configurado, retorna true (dev). Pura/testável.
 */
export function verificarAssinaturaMp(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string | undefined;
}): boolean {
  const { xSignature, xRequestId, dataId, secret } = params;
  if (!secret) return true; // dev: sem segredo, não valida
  if (!xSignature || !dataId) return false;

  const partes = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, ...v] = p.split("=");
      return [k.trim(), v.join("=").trim()];
    }),
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  const manifesto = `id:${dataId.toLowerCase()};request-id:${xRequestId ?? ""};ts:${ts};`;
  const esperado = createHmac("sha256", secret).update(manifesto).digest("hex");
  try {
    const a = Buffer.from(esperado, "hex");
    const b = Buffer.from(v1, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Com dinheiro REAL circulando, webhook sem segredo e webhook aberto: a
 * `verificarAssinaturaMp` deixa passar quando `secret` e undefined (comodidade
 * de desenvolvimento). Isso e aceitavel enquanto o provedor e o simulado, mas
 * nao quando o Mercado Pago esta ativo — a convencao do repo (CLAUDE.md) e
 * validar assinatura de webhook de pagamento ANTES de processar.
 *
 * Retorna true quando a requisicao deve ser recusada por falta de segredo.
 */
export function webhookDesprotegido(providerNome: string, secret: string | undefined): boolean {
  return providerNome === "mercadopago" && !secret?.trim();
}
