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
