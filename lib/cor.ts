/**
 * Helpers de cor — puros e testaveis. Convertem a cor de acento do evento
 * (`accent`, hex) nos insumos que o site do evento precisa: as cores das
 * particulas da atmosfera (triplets "r,g,b" consumidos pelo canvas).
 *
 * Mantido puro (sem DOM, sem `Date`) para os testes do Vitest.
 */

/** Normaliza "#abc" / "#aabbcc" -> [r,g,b] (0-255). Cai para violeta se invalido. */
export function hexParaRgb(hex: string): [number, number, number] {
  const limpo = hex.trim().replace(/^#/, "");
  const full =
    limpo.length === 3
      ? limpo
          .split("")
          .map((c) => c + c)
          .join("")
      : limpo;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return [109, 40, 217]; // #6D28D9
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mistura linear de dois RGB (t=0 -> a, t=1 -> b). */
function mistura(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

const triplet = (c: [number, number, number]) => `${c[0]},${c[1]},${c[2]}`;

const BRANCO: [number, number, number] = [255, 255, 255];
/** Champanhe/areia quente — a faisca neutra (equivalente ao "prata" do festa). */
const CHAMPANHE: [number, number, number] = [226, 214, 198];

/**
 * Cores das particulas a partir do accent: uma faisca neutra quente + o accent
 * clareado (~30%) + o accent bem claro (~58%). Sempre 3 triplets "r,g,b".
 * Clareamos porque as particulas brilham sobre fundo claro (ivory).
 */
export function coresParticulas(accent: string): string[] {
  const base = hexParaRgb(accent);
  return [
    triplet(CHAMPANHE),
    triplet(mistura(base, BRANCO, 0.3)),
    triplet(mistura(base, BRANCO, 0.58)),
  ];
}
