// Taxa da plataforma sobre a lista de presentes. Fonte unica de verdade.
// Modelo: o dono assume a taxa (liquido = bruto - taxa). Gancho futuro:
// repassar ao convidado (bruto + taxa) fica na Fatia 4.
export const TAXA_BPS = 500; // 5,00% em basis points

/** Taxa em centavos sobre um bruto em centavos. Bruto invalido -> 0. */
export function calcularTaxaCents(brutoCents: number): number {
  if (!Number.isInteger(brutoCents) || brutoCents <= 0) return 0;
  return Math.round((brutoCents * TAXA_BPS) / 10_000);
}

/** Liquido que vai para o cofre do dono (bruto - taxa). */
export function calcularLiquidoCents(brutoCents: number): number {
  return brutoCents - calcularTaxaCents(brutoCents);
}
