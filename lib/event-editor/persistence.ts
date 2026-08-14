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
