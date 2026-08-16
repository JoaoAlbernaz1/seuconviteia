const PREFIX = "sc-editor-rascunho";

export function localDraftKey(eventId: string | null, userScope: string): string {
  return eventId ? `${PREFIX}:${eventId}` : `${PREFIX}:new:${userScope}`;
}

export function activeDraftPointerKey(userScope: string): string {
  return `sc-editor-active:${userScope}`;
}
