// Taxa da plataforma sobre a lista de presentes. Fonte unica de verdade.
// Modelo: o dono assume a taxa (liquido = bruto - taxa). Gancho futuro:
// repassar ao convidado (bruto + taxa) fica na Fatia 4.
//
// A taxa CAI conforme o plano da conta — e o principal degrau da assinatura
// (mesmo desenho da Wedy, que vai de 5,99% no gratuito para 4,95% no pago).
// Decisao do Joao em 12/08/2026: taxas maiores que a proposta inicial, com a
// queda concentrada do Basico para o Classico, pra que o plano do MEIO seja o
// obviamente melhor negocio.
//
// Custo do trilho: Pix do Mercado Pago ~0,99% (0,49% com volume). Por isso a
// taxa nunca desce abaixo de ~1,5%: abaixo disso ela nao paga o proprio custo.
import type { Plan } from "../plans";

/** Taxa por plano, em basis points (100 bps = 1%). */
export const TAXA_BPS_POR_PLANO: Record<Plan, number> = {
  BASICO: 590, // 5,90%
  CLASSICO: 340, // 3,40%
  PREMIUM: 260, // 2,60%
};

/** Plano usado quando a conta ainda nao foi resolvida (o mais caro em taxa). */
const PLANO_PADRAO: Plan = "BASICO";

/** Taxa (bps) do plano. Plano desconhecido cai no Basico (nunca cobra de menos). */
export function taxaBpsDoPlano(plan?: Plan | null): number {
  return TAXA_BPS_POR_PLANO[plan ?? PLANO_PADRAO] ?? TAXA_BPS_POR_PLANO[PLANO_PADRAO];
}

/** Rotulo da taxa para a UI ("5,9%") — sempre derivado do bps. */
export function taxaLabel(plan?: Plan | null): string {
  const pct = taxaBpsDoPlano(plan) / 100;
  return `${pct.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
}

/** Taxa em centavos sobre um bruto em centavos. Bruto invalido -> 0. */
export function calcularTaxaCents(brutoCents: number, plan?: Plan | null): number {
  if (!Number.isInteger(brutoCents) || brutoCents <= 0) return 0;
  return Math.round((brutoCents * taxaBpsDoPlano(plan)) / 10_000);
}

/** Liquido que vai para o cofre do dono (bruto - taxa). */
export function calcularLiquidoCents(brutoCents: number, plan?: Plan | null): number {
  return brutoCents - calcularTaxaCents(brutoCents, plan);
}

/**
 * Quanto em presentes por mes faz a assinatura se pagar sozinha, comparando com
 * o plano de baixo. E o argumento honesto do card de plano ("se paga com uma
 * festa"): mensalidade / diferenca de taxa. `null` quando nao ha plano abaixo
 * ou quando a taxa nao cai.
 */
export function presentesParaSePagar(
  mensalidadeCents: number,
  plan: Plan,
  planoAbaixo: Plan,
): number | null {
  const queda = taxaBpsDoPlano(planoAbaixo) - taxaBpsDoPlano(plan);
  if (queda <= 0 || mensalidadeCents <= 0) return null;
  return Math.ceil((mensalidadeCents * 10_000) / queda);
}
