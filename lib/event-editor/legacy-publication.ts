import type { EventEditorDocument } from "./document";

export type PublicationState = {
  status: string;
  draftData: EventEditorDocument | null;
  publishedData: EventEditorDocument | null;
  draftVersion: number;
  publishedVersion: number;
};

export function initializeLegacyPublishedEvent(state: PublicationState, legacy: EventEditorDocument) {
  if (state.status !== "PUBLISHED" || state.draftData !== null || state.publishedData !== null) {
    return { changed: false as const, state };
  }
  return {
    changed: true as const,
    state: { ...state, draftData: legacy, publishedData: legacy },
  };
}

export function publishDraftSnapshot(state: PublicationState): PublicationState {
  return { ...state, publishedData: state.draftData, publishedVersion: state.draftVersion };
}

export function publicSnapshot(state: PublicationState): EventEditorDocument | null {
  return state.publishedData;
}
