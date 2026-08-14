import type { DeepPartial, EventEditorDocument } from "./document";

export function applyDocumentPatch<T>(current: T, patch: DeepPartial<T> | undefined): T {
  if (patch === undefined) return structuredClone(current);
  if (Array.isArray(current) || Array.isArray(patch)) return structuredClone(patch) as T;
  if (current === null || typeof current !== "object" || patch === null || typeof patch !== "object") {
    return structuredClone(patch) as T;
  }
  const result = structuredClone(current) as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const previous = (current as Record<string, unknown>)[key];
    result[key] = applyDocumentPatch(previous, value);
  }
  return result as T;
}

export type EventDocumentPatch = DeepPartial<EventEditorDocument>;

type VersionedSaveInput = {
  currentDocument: EventEditorDocument;
  currentVersion: number;
  expectedVersion: number;
  incomingDocument: EventEditorDocument;
};

export type VersionedSaveResult =
  | { ok: true; document: EventEditorDocument; version: number }
  | { ok: false; reason: "conflict"; currentVersion: number };

export function applyVersionedSave(input: VersionedSaveInput): VersionedSaveResult {
  if (input.expectedVersion !== input.currentVersion) {
    return { ok: false, reason: "conflict", currentVersion: input.currentVersion };
  }
  return {
    ok: true,
    document: structuredClone(input.incomingDocument),
    version: input.currentVersion + 1,
  };
}

export function createPublishedSnapshot(document: EventEditorDocument, draftVersion: number, publishedAt: Date) {
  return {
    publishedDocument: structuredClone(document),
    publishedVersion: draftVersion,
    publishedAt: new Date(publishedAt),
  };
}
