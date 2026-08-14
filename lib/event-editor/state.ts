import type { EventEditorDocument } from "./document";
import { TOGGLE_REGISTRY, type EditorToggleId } from "./registry";

export function readPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, source);
}

export function updateField(document: EventEditorDocument, path: string, value: unknown): EventEditorDocument {
  const keys = path.split(".");
  if (!keys.length || keys.some((key) => !key)) throw new Error(`Invalid editor path: ${path}`);

  const update = (source: unknown, index: number): unknown => {
    if (index === keys.length) return structuredClone(value);
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      throw new Error(`Unknown editor path: ${path}`);
    }
    const key = keys[index];
    if (!(key in source)) throw new Error(`Unknown editor path: ${path}`);
    return { ...source, [key]: update((source as Record<string, unknown>)[key], index + 1) };
  };

  return update(document, 0) as EventEditorDocument;
}

type EditorSection = Exclude<keyof EventEditorDocument, "schemaVersion">;

export function updateSection<K extends EditorSection>(
  document: EventEditorDocument,
  section: K,
  patch: Partial<EventEditorDocument[K]>,
): EventEditorDocument {
  return {
    ...document,
    [section]: {
      ...(document[section] as Record<string, unknown>),
      ...(patch as Record<string, unknown>),
    },
  };
}

export function toggleSection(document: EventEditorDocument, id: EditorToggleId, enabled?: boolean): EventEditorDocument {
  const definition = TOGGLE_REGISTRY.find((toggle) => toggle.id === id);
  if (!definition) throw new Error(`Unknown editor toggle: ${id}`);
  const current = Boolean(readPath(document, definition.enabledPath));
  return updateField(document, definition.enabledPath, enabled ?? !current);
}
