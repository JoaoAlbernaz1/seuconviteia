/**
 * Regra do re-salvamento do editor.
 *
 * O autosave grava um SNAPSHOT do rascunho. Se o cliente digitou mais coisa
 * enquanto o save estava indo, precisamos salvar de novo o que ficou pra tras.
 *
 * O detalhe que importa: **so re-dispara quando o save DEU CERTO**. Se ele
 * falhou (sessao expirada, validacao, rede), o conteudo atual continua diferente
 * do ultimo salvo pra sempre — e re-tentar na hora vira um laco infinito de
 * POSTs. Aconteceu de verdade: 86.534 salvamentos numa sessao (11/08/2026),
 * depois que a sessao do navegador expirou. Falhou, para: a proxima alteracao
 * do cliente (ou o proximo login) dispara o save de novo pelo debounce.
 *
 * PURO: so compara strings.
 */
export function deveResalvar(
  salvouOk: boolean,
  atual: string,
  ultimoSalvo: string | null,
): boolean {
  if (!salvouOk) return false;
  return atual !== ultimoSalvo;
}
