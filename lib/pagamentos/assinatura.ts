// Assinatura mensal do SaaS no Mercado Pago (`preapproval`) — o profissional
// pagando a plataforma. Nao confundir com `mercadopago.ts`, que e o Pix avulso
// do convidado presenteando.
//
// Criamos a assinatura SEM `card_token_id`: o MP devolve um `init_point` e o
// profissional digita o cartao la. Nenhum dado de cartao encosta no nosso
// servidor, o que nos mantem inteiramente fora do escopo PCI — a mesma
// conclusao que matou a digitacao de cartao no projeto do eletroposto.
import { PLANOS_INFO, type Plan } from "@/lib/plans";
import { mapMpStatus } from "./mercadopago";

const MP_API = "https://api.mercadopago.com";

/**
 * Teste gratis: dias de uso ANTES da primeira cobranca.
 *
 * O cartao e digitado no comeco (e o MP guarda), a cobranca so acontece no 8o
 * dia — e e o proprio MP que segura o prazo (`free_trial`), nao a gente. Assim
 * nao existe estado nosso "em teste" para dessincronizar do gateway.
 */
export const DIAS_TESTE_GRATIS = 7;

function tokenMp(): string {
  const t = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!t) throw new Error("MERCADO_PAGO_ACCESS_TOKEN ausente.");
  return t;
}

export interface AssinaturaCriada {
  /** Id do `preapproval` no MP — e por ele que o webhook acha o dono. */
  preapprovalId: string;
  /** Checkout hospedado pelo MP, para onde o profissional e redirecionado. */
  initPoint: string;
}

/**
 * Cria a assinatura mensal do plano e devolve o link de checkout do MP.
 *
 * O valor NUNCA e escrito aqui: sai de `PLANOS_INFO[].mensalidadeCents`, que e
 * a fonte unica de preco (decisao de negocio do dono).
 */
export async function criarAssinaturaMp(input: {
  plano: Plan;
  email: string;
  professionalId: string;
  backUrl: string;
  /** 7 dias antes da primeira cobranca. So na PRIMEIRA assinatura da conta. */
  comTesteGratis?: boolean;
}): Promise<AssinaturaCriada> {
  const token = tokenMp();

  const info = PLANOS_INFO.find((p) => p.key === input.plano);
  if (!info || info.mensalidadeCents <= 0) {
    throw new Error("O plano Básico não se assina — ele é grátis.");
  }

  const res = await fetch(`${MP_API}/preapproval`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      reason: `seuconvite — plano ${info.label}`,
      // Liga a assinatura a conta. Sem isto, uma assinatura autorizada chegaria
      // no webhook sem dono.
      external_reference: input.professionalId,
      payer_email: input.email,
      back_url: input.backUrl,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: info.mensalidadeCents / 100,
        currency_id: "BRL",
        // O teste ADIA a cobranca, nao desconta: o valor cheio continua aqui.
        ...(input.comTesteGratis
          ? { free_trial: { frequency: DIAS_TESTE_GRATIS, frequency_type: "days" } }
          : {}),
      },
    }),
  });

  if (!res.ok) throw new Error(`Mercado Pago recusou a assinatura (${res.status}).`);

  const data = (await res.json()) as { id?: string; init_point?: string };
  // Falha alto: sem `init_point` nao ha para onde mandar a pessoa, e seguir em
  // silencio deixaria a conta com uma assinatura pendente que ninguem paga.
  if (!data.id || !data.init_point) {
    throw new Error("Resposta do Mercado Pago sem id/init_point.");
  }
  return { preapprovalId: data.id, initPoint: data.init_point };
}

/**
 * Estado REAL da assinatura no MP.
 *
 * O webhook nunca confia no corpo que recebeu — ele diz apenas QUE algo mudou;
 * quem diz O QUE mudou e esta consulta. Mesma regra do fluxo de presente.
 */
export async function consultarAssinaturaMp(preapprovalId: string): Promise<{
  preapprovalId: string;
  status: string;
  /** Quando o MP vai cobrar de novo — durante o teste grátis, o fim do teste. */
  proximoPagamento: Date | null;
}> {
  const res = await fetch(`${MP_API}/preapproval/${encodeURIComponent(preapprovalId)}`, {
    headers: { Authorization: `Bearer ${tokenMp()}` },
  });
  if (!res.ok) throw new Error(`Mercado Pago: consulta da assinatura falhou (HTTP ${res.status}).`);

  const data = (await res.json()) as { id?: unknown; status?: unknown; next_payment_date?: unknown };
  if (typeof data.status !== "string") {
    throw new Error("Resposta do Mercado Pago sem status da assinatura.");
  }
  // É esta data que sustenta o teste grátis: o direito vale até a próxima
  // cobrança, seja ela daqui a 7 dias (teste) ou daqui a um mês (renovação).
  const proximo =
    typeof data.next_payment_date === "string" ? new Date(data.next_payment_date) : null;
  return {
    preapprovalId: data.id != null ? String(data.id) : preapprovalId,
    status: data.status,
    proximoPagamento: proximo && !Number.isNaN(proximo.getTime()) ? proximo : null,
  };
}

/**
 * Cancela a assinatura no MP — o que de fato para de cobrar o cartao.
 *
 * Sem isto, "cancelar" no nosso painel so mudaria a nossa linha e o Mercado
 * Pago continuaria cobrando todo mes: cobrar por algo que a pessoa cancelou.
 *
 * NAO mexe em `assinaturaAte`: o mes ja pago continua valendo (ver
 * `planoEfetivo`). Devolve false se o MP recusou — quem chama decide o que
 * fazer, mas nunca deve dizer que cancelou sem isto ter dado certo.
 */
export async function cancelarAssinaturaMp(preapprovalId: string): Promise<boolean> {
  const res = await fetch(`${MP_API}/preapproval/${encodeURIComponent(preapprovalId)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${tokenMp()}`, "content-type": "application/json" },
    body: JSON.stringify({ status: "cancelled" }),
  });
  return res.ok;
}

export interface CobrancaAssinaturaMp {
  /** Assinatura dona da cobranca — e por ela que achamos a conta. */
  preapprovalId: string;
  /** Id da COBRANCA mensal no MP. Vira o `providerId` unico do ledger. */
  providerId: string;
  amountCents: number;
  /** So `true` quando o pagamento foi mesmo aprovado. */
  pago: boolean;
  pagoEm: Date;
}

/**
 * Cobranca mensal da assinatura (`authorized_payment`), consultada no MP.
 *
 * Guardamos o id da COBRANCA, nao o do pagamento: quando o cartao recusa, o MP
 * tenta de novo (`recycling`) gerando um pagamento novo para a MESMA cobranca —
 * e o mes tem de continuar sendo um so no nosso ledger.
 */
export async function consultarCobrancaAssinaturaMp(
  authorizedPaymentId: string,
): Promise<CobrancaAssinaturaMp> {
  const res = await fetch(
    `${MP_API}/authorized_payments/${encodeURIComponent(authorizedPaymentId)}`,
    { headers: { Authorization: `Bearer ${tokenMp()}` } },
  );
  if (!res.ok) throw new Error(`Mercado Pago: consulta da cobranca falhou (HTTP ${res.status}).`);

  const data = (await res.json()) as {
    id?: unknown;
    preapproval_id?: unknown;
    transaction_amount?: unknown;
    payment?: { status?: unknown; date_approved?: unknown } | null;
    date_created?: unknown;
  };

  // Sem a assinatura dona nao ha a quem creditar o mes. Falha alto para o MP
  // reenviar, em vez de descartar uma cobranca paga em silencio.
  if (typeof data.preapproval_id !== "string" || !data.preapproval_id) {
    throw new Error("Cobrança do Mercado Pago sem preapproval_id.");
  }

  const valor = typeof data.transaction_amount === "number" ? data.transaction_amount : 0;
  const dataPagamento =
    typeof data.payment?.date_approved === "string"
      ? data.payment.date_approved
      : typeof data.date_created === "string"
        ? data.date_created
        : null;

  return {
    preapprovalId: data.preapproval_id,
    providerId: data.id != null ? String(data.id) : authorizedPaymentId,
    amountCents: Math.round(valor * 100),
    pago: mapMpStatus(typeof data.payment?.status === "string" ? data.payment.status : undefined) === "PAID",
    pagoEm: dataPagamento ? new Date(dataPagamento) : new Date(),
  };
}
