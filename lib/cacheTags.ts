/**
 * Tags do Data Cache do Next. Modulo PURO de proposito: se importar
 * `next/cache`, o Vitest nao consegue testa-lo. As chamadas a `revalidateTag`
 * vivem em `lib/revalidar.ts`.
 *
 * Quem escreve a tag e quem a invalida precisam concordar na string. Uma
 * divergencia nao quebra build nem runtime — o site so para de atualizar.
 */

/** Dados do evento servidos ao convidado. Invalidada quando o dono salva. */
export function tagEvento(sub: string): string {
  return `evento:${sub}`;
}

/**
 * Mural de recados. Chaveada por `eventId` (e nao pelo subdominio) porque
 * `listarRecadosAprovados` recebe eventId. Tag separada da do evento: o mural
 * muda por acao de CONVIDADO, e nao deveria invalidar o convite inteiro.
 */
export function tagRecados(eventId: string): string {
  return `recados:${eventId}`;
}
