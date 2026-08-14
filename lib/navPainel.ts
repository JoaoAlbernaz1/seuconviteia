/**
 * Quais ABAS do menu do painel aparecem, e para onde elas apontam.
 *
 * As abas Convidados / Presentes / Recebimentos so fazem sentido DENTRO de um
 * convite. Quem ainda nao criou nenhum nao pode nem ve-las: antes elas caiam no
 * assistente `/painel/novo` e o cliente levava um susto (reclamacao do Joao,
 * 12/08/2026).
 *
 * Com convite, cada aba segue o que esta ATIVO naquele convite — plano da conta
 * ∩ liga/desliga do evento (`lib/recursos.ts`). Se a confirmacao de presenca
 * esta desligada, nao existe lista de convidados pra mostrar.
 *
 * PURO: so decide; quem busca plano/customization e o layout do painel.
 */
export type AbasPainel = {
  convidados: boolean;
  presentes: boolean;
  recebimentos: boolean;
};

export function abasDoPainel(opts: {
  /** A conta tem pelo menos um convite? */
  temConvite: boolean;
  /** Confirmacao de presenca ATIVA no convite selecionado. */
  rsvp: boolean;
  /** Lista de presentes ATIVA no convite selecionado. */
  presentes: boolean;
}): AbasPainel {
  if (!opts.temConvite) {
    return { convidados: false, presentes: false, recebimentos: false };
  }
  return {
    convidados: opts.rsvp,
    presentes: opts.presentes,
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
