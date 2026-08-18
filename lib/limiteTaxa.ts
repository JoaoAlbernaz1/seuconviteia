// Limite de uso por conta, em memória.
//
// A geração de imagem custa dinheiro do dono do SaaS (~US$0,01 por imagem na
// OpenAI). Sem limite, um profissional logado que fique clicando — ou um script
// dele — vira fatura. O botão já trava clique duplo no navegador, mas trava de
// navegador não é trava: quem quiser, chama a rota direto.
//
// JANELA DESLIZANTE simples: guarda os instantes das últimas chamadas de cada
// conta e conta quantas cabem na janela.
//
// LIMITAÇÃO CONHECIDA: a memória é de UMA instância. Na Vercel, várias podem
// atender a mesma conta, então o teto real é por instância, não global. Isso
// segura o caso que importa hoje (o clique repetido, que cai sempre na mesma
// instância quente) sem exigir tabela nova em produção. Se a conta de imagem
// crescer, o passo seguinte é levar isto para o banco.

type Registro = number[];

const memoria = new Map<string, Registro>();

export type ResultadoLimite = { ok: true; restantes: number } | { ok: false; esperarSegundos: number };

/**
 * Registra uma chamada de `chave` e diz se ela cabe no limite.
 *
 * @param maximo quantas chamadas cabem na janela
 * @param janelaMs tamanho da janela
 * @param agora instante (injetável para teste)
 */
export function consumir(
  chave: string,
  maximo: number,
  janelaMs: number,
  agora: number = Date.now(),
): ResultadoLimite {
  const inicio = agora - janelaMs;
  const anteriores = (memoria.get(chave) ?? []).filter((t) => t > inicio);

  if (anteriores.length >= maximo) {
    memoria.set(chave, anteriores);
    const maisAntiga = anteriores[0] ?? agora;
    return { ok: false, esperarSegundos: Math.max(1, Math.ceil((maisAntiga + janelaMs - agora) / 1000)) };
  }

  anteriores.push(agora);
  memoria.set(chave, anteriores);
  return { ok: true, restantes: maximo - anteriores.length };
}

/** Só para os testes: esquece tudo. */
export function limparLimites(): void {
  memoria.clear();
}
