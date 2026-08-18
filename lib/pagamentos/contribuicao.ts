// Logica pura de uma contribuicao a um item da lista de presentes.
// Sem I/O: recebe a config do item + a escolha do convidado e devolve o bruto.
export type GiftPricing = "FIXO" | "COTAS" | "LIVRE";
export type PayStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface ItemConfig {
  pricingMode: GiftPricing;
  priceCents: number;
  quotaCount?: number | null;
}
export interface EscolhaConvidado {
  quotas?: number;
  valorCustomCents?: number;
}
export type ResultadoValor =
  | { ok: true; brutoCents: number; quotas: number | undefined }
  | { ok: false; erro: string };

/** Valor da cota (item COTAS): preco total / nº de cotas, arredondado ao centavo. */
export function valorDaCotaCents(priceCents: number, quotaCount: number): number {
  return Math.round(priceCents / quotaCount);
}

/** Deriva o bruto (em centavos) de uma contribuicao conforme o modo do item. */
export function valorDaContribuicao(item: ItemConfig, escolha: EscolhaConvidado): ResultadoValor {
  if (item.pricingMode === "FIXO") {
    if (item.priceCents <= 0) return { ok: false, erro: "Item sem preco." };
    return { ok: true, brutoCents: item.priceCents, quotas: undefined };
  }
  if (item.pricingMode === "COTAS") {
    const total = item.quotaCount ?? 0;
    const q = escolha.quotas ?? 0;
    if (total < 1) return { ok: false, erro: "Item sem cotas configuradas." };
    if (!Number.isInteger(q) || q < 1 || q > total) return { ok: false, erro: "Escolha 1 ou mais cotas." };
    return { ok: true, brutoCents: valorDaCotaCents(item.priceCents, total) * q, quotas: q };
  }
  // LIVRE
  //
  // A contribuicao de valor livre nasce com `priceCents = 0` (nao ha minimo a
  // cobrar). So que "sem minimo" nao pode virar "aceita zero": sem a checagem
  // abaixo, um convidado que nao digitasse nada gerava um Pix de R$ 0,00 —
  // cobranca vazia no gateway e uma contribuicao fantasma no ledger.
  const v = escolha.valorCustomCents ?? 0;
  if (!Number.isInteger(v) || v <= 0) {
    return { ok: false, erro: "Informe um valor maior que zero." };
  }
  if (v < item.priceCents) {
    return { ok: false, erro: "Valor abaixo do minimo." };
  }
  return { ok: true, brutoCents: v, quotas: undefined };
}

/** Saldo do convite = Σ liquidos PAGOS − Σ payouts (PAGO ou PENDENTE, ja reservados). */
export function saldoDoEvento(
  contribs: { netCents: number; status: PayStatus }[],
  payouts: { amountCents: number; status: PayStatus }[],
): number {
  const entrou = contribs.filter((c) => c.status === "PAID").reduce((s, c) => s + c.netCents, 0);
  const saiu = payouts
    .filter((p) => p.status === "PAID" || p.status === "PENDING")
    .reduce((s, p) => s + p.amountCents, 0);
  return entrou - saiu;
}
