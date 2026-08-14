/**
 * Ordem da lista de presentes — a posicao no array E a ordem que o convidado ve
 * no site (o rascunho e o payload preservam o indice). As setas ↑ ↓ do editor
 * chamam esta funcao.
 *
 * PURO: devolve uma lista NOVA, nunca muta a original (o estado do editor e
 * imutavel). Indice fora da faixa = lista intacta — a UI ja esconde a seta nas
 * pontas, isto e a rede de seguranca.
 */
export function moverItem<T>(lista: T[], de: number, para: number): T[] {
  if (de < 0 || para < 0 || de >= lista.length || para >= lista.length || de === para) {
    return [...lista];
  }
  const out = [...lista];
  const [item] = out.splice(de, 1);
  out.splice(para, 0, item);
  return out;
}
