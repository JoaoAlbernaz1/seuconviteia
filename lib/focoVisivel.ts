// Qual seção do editor está sob os olhos da pessoa.
//
// A prévia mostra a seção "em foco". Até aqui o foco só mudava no CLIQUE: quem
// rolava o editor até o mural de recados continuava vendo a galeria na prévia,
// e só descobria o mural depois de tocar num campo — parecia que editar recado
// não mudava nada. O editor passou a observar a rolagem e usa esta função para
// decidir qual seção está sendo lida.
//
// PURA (sem DOM) para poder ser testada: recebe a posição de cada seção na
// tela, devolve a vencedora.

export type SecaoNaTela = {
  /** Valor do `data-foco` da seção. */
  sec: string;
  /** Distância do topo da seção até o topo da janela (negativa = já passou). */
  topo: number;
  /** Altura da seção em pixels. */
  altura: number;
};

/**
 * Onde fica a "linha de leitura": um terço abaixo do topo da janela. Quem
 * cruzou essa linha é o que a pessoa está lendo — usar o meio da tela faria a
 * prévia trocar cedo demais, e o topo faria trocar tarde.
 */
const LINHA = 0.35;

/**
 * A seção em leitura: a ÚLTIMA cujo topo já passou da linha. Nenhuma passou
 * ainda (a pessoa está no comecinho)? Vale a primeira que aparece na tela.
 * Nada visível devolve `undefined` — quem chama mantém o foco atual.
 */
export function secaoEmLeitura(itens: SecaoNaTela[], alturaJanela: number): string | undefined {
  const linha = alturaJanela * LINHA;
  const naTela = itens.filter((i) => i.topo + i.altura > 0 && i.topo < alturaJanela);
  if (naTela.length === 0) return undefined;

  let passou: SecaoNaTela | undefined;
  for (const item of naTela) {
    if (item.topo <= linha && (!passou || item.topo > passou.topo)) passou = item;
  }
  if (passou) return passou.sec;

  // Ninguém cruzou a linha: a primeira visível (a de cima) é a que está sendo lida.
  return naTela.reduce((a, b) => (b.topo < a.topo ? b : a)).sec;
}
