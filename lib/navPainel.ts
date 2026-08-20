/**
 * Quais ABAS do menu do painel aparecem, e para onde elas apontam.
 *
 * As abas Convidados / Recebimentos so fazem sentido DENTRO de um convite. Quem
 * ainda nao criou nenhum nao pode nem ve-las: antes elas caiam no assistente
 * `/painel/novo` e o cliente levava um susto (reclamacao do Joao, 12/08/2026).
 *
 * Com convite, a aba de convidados segue o que esta ATIVO naquele convite —
 * plano da conta ∩ liga/desliga do evento (`lib/recursos.ts`). Se a confirmacao
 * de presenca esta desligada, nao existe lista de convidados pra mostrar.
 *
 * A aba "Presentes" MORREU na Task 11: ela abria a tela de editar a lista, que
 * gravava em `Event.customization` — um lugar que o convite publicado nao le
 * mais. Editar a lista e assunto do editor de 6 passos (atras da janela de
 * edicao); o dinheiro que ela ja rendeu continua em "Recebimentos". Menu que
 * promete edicao que o servidor recusa e o mesmo erro que a lista, a tela do
 * convite e o Dashboard ja tinham deixado para tras.
 *
 * PURO: so decide; quem busca plano/customization e o layout do painel.
 */
export type AbasPainel = {
  convidados: boolean;
  recebimentos: boolean;
};

export function abasDoPainel(opts: {
  /** A conta tem pelo menos um convite? */
  temConvite: boolean;
  /** Confirmacao de presenca ATIVA no convite selecionado. */
  rsvp: boolean;
}): AbasPainel {
  if (!opts.temConvite) {
    return { convidados: false, recebimentos: false };
  }
  return {
    convidados: opts.rsvp,
    // Recebimentos NAO segue o liga/desliga dos presentes de proposito: dinheiro
    // que ja entrou precisa continuar acessivel mesmo se o dono desligar a lista.
    recebimentos: true,
  };
}

/**
 * Destino de uma aba de convite. So e chamada quando a aba aparece — ou seja,
 * quando existe convite ativo. O fallback existe por seguranca e leva a "Meus
 * convites" (que explica e oferece criar), nunca ao assistente antigo.
 */
export function hrefDoConvite(fid: string | null, sufixo: string): string {
  return fid ? `/painel/${fid}/${sufixo}` : "/painel/convites";
}
