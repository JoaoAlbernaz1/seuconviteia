// Taxa da plataforma sobre a lista de presentes. Fonte unica de verdade.
// Modelo: o dono assume a taxa (liquido = bruto - taxa). Gancho futuro:
// repassar ao convidado (bruto + taxa) fica na Fatia 4.
//
// A taxa CAI conforme o plano da conta. Os numeros sao decisao do Joao em
// 17/08/2026, depois de levantar o mercado — e a taxa e o UNICO numero que o
// cliente compara de verdade, porque o site todo mundo da de graca:
//
//   FestaLab .. 3,69% + R$ 3,67 por saque, e o dinheiro so 30 dias depois
//   iCasei .... 3,69% a 3,89% (regressiva)
//   Wedy ...... 5,99% no gratuito, 4,95% no pago
//
// Por isso o GRATUITO daqui entra em 3,5%: abaixo do melhor plano deles. Antes
// era 5,90%, o pior lugar da tabela — empatado com o Wedy gratuito.
//
// Custo do trilho: Pix do Mercado Pago ~0,99% (0,49% com volume). Por isso a
// taxa nunca desce abaixo de ~1,5%: abaixo disso ela nao paga o proprio custo.
import type { Plan } from "../plans";

/** Taxa por plano, em basis points (100 bps = 1%). */
export const TAXA_BPS_POR_PLANO: Record<Plan, number> = {
  BASICO: 350, // 3,50% — o gratuito, ja menor que a taxa do melhor plano deles
  CLASSICO: 290, // 2,90% — profissional
  PREMIUM: 250, // 2,50% — estudio
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
