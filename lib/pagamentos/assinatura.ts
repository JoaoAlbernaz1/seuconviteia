// Assinatura mensal do SaaS no Mercado Pago (`preapproval`) — o profissional
// pagando a plataforma. Nao confundir com `mercadopago.ts`, que e o Pix avulso
// do convidado presenteando.
//
// Criamos a assinatura SEM `card_token_id`: o MP devolve um `init_point` e o
// profissional digita o cartao la. Nenhum dado de cartao encosta no nosso
// servidor, o que nos mantem inteiramente fora do escopo PCI — a mesma
// conclusao que matou a digitacao de cartao no projeto do eletroposto.
import { PLANOS_INFO, type Plan } from "@/lib/plans";

const MP_API = "https://api.mercadopago.com";

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
}): Promise<AssinaturaCriada> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN ausente.");

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
