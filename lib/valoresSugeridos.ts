// Leitura dos "valores sugeridos" da contribuicao em dinheiro.
//
// No editor o campo e TEXTO LIVRE ("R$ 50 · R$ 100 · R$ 200") porque e assim
// que o profissional pensa. No convite, porem, texto nao ajuda ninguem a
// decidir: vira uma frase na descricao do item e o convidado continua diante de
// um campo vazio. Este modulo transforma aquela frase em VALORES, para o modal
// oferecer atalhos de um toque.
//
// PURO (sem I/O) de proposito: roda no servidor (montagem do payload) e no
// cliente (previa do editor).

/** Teto por contribuicao, igual ao de `lib/presentear.ts` (R$ 100.000). */
const TETO_CENTS = 100_000_00;

/** Quantos atalhos cabem na tela sem virar sopa de botao. */
const MAX_SUGESTOES = 4;

/**
 * Converte um numero escrito em pt-BR para centavos. Virgula e decimal; ponto e
 * separador de milhar ("1.000,50" -> 100050; "1.000" -> 100000).
 */
function paraCents(bruto: string): number | null {
  const limpo = bruto.trim();
  if (!limpo) return null;
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo.replace(/\./g, "");
  const n = Number(normalizado);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/**
 * Extrai os valores sugeridos de um texto livre, em centavos: ordenados,
 * sem repetidos, so positivos e no maximo `MAX_SUGESTOES`. Texto sem numero
 * nenhum devolve lista vazia — quem chama decide o que fazer com isso.
 */
export function lerValoresSugeridos(texto?: string | null): number[] {
  if (!texto) return [];
  const achados = texto.match(/\d[\d.,]*/g) ?? [];
  const cents = achados
    .map(paraCents)
    .filter((c): c is number => c !== null && c > 0 && c <= TETO_CENTS);
  return [...new Set(cents)].sort((a, b) => a - b).slice(0, MAX_SUGESTOES);
}
