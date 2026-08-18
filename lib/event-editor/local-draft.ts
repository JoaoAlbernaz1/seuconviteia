const PREFIX = "sc-editor-rascunho";

export function localDraftKey(eventId: string | null, userScope: string): string {
  return eventId ? `${PREFIX}:${eventId}` : `${PREFIX}:new:${userScope}`;
}

export function activeDraftPointerKey(userScope: string): string {
  return `sc-editor-active:${userScope}`;
}

/**
 * Esquece o rascunho apontado no navegador. O ponteiro sobrevive ao convite:
 * apagado o evento (em outra aba, outra sessão, outro banco), ele continua
 * apontando para um id morto e o editor insiste em ATUALIZAR essa linha em vez
 * de criar — todo save seguinte volta "Convite não encontrado", para sempre.
 * Limpar aqui é o que devolve o editor ao estado de convite novo.
 */
export function esquecerRascunhoLocal(eventId: string | null, userScope: string): void {
  try {
    if (eventId) localStorage.removeItem(localDraftKey(eventId, userScope));
    localStorage.removeItem(activeDraftPointerKey(userScope));
  } catch {}
}

/** O que o editor guarda no navegador (só o que interessa para a versão). */
export type RascunhoLocalSalvo = {
  eventId?: string | null;
  draftVersion?: number;
};

/**
 * Com que versão o editor deve mandar o PRÓXIMO save.
 *
 * O save usa compare-and-set: mandar uma versão diferente da que está no banco
 * volta "Este convite foi alterado em outra aba. Recarregue para continuar." —
 * e o editor engasgava com essa mensagem SEM nenhuma outra aba aberta.
 *
 * A causa era confiar no navegador. O `localStorage` guarda a versão de quando
 * a aba fechou; ao reabrir, ela era adotada mesmo quando o servidor tinha
 * carregado o convite com uma versão MAIS NOVA (e mesmo quando o conteúdo local
 * era descartado por incompatível). Pior: recarregar não resolvia, porque a
 * versão velha era restaurada de novo — o produto ficava sem saída.
 *
 * Regra: quem carregou o convite manda. Se o servidor entregou o evento, a
 * versão é a dele. A do navegador só vale quando não houve carga do servidor
 * (o editor abriu sem `?id=` e está retomando pelo ponteiro), e aí é um palpite
 * — por isso o save também sabe se recuperar de um conflito.
 */
export function versaoInicialDoRascunho(args: {
  initialEventId?: string | null;
  initialDraftVersion: number;
  salvo?: RascunhoLocalSalvo | null;
}): number {
  const { initialEventId, initialDraftVersion, salvo } = args;
  if (initialEventId) return initialDraftVersion;
  if (salvo?.eventId && typeof salvo.draftVersion === "number") return salvo.draftVersion;
  return initialDraftVersion;
}
