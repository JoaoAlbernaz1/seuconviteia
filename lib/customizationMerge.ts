export const REMOVE_CUSTOMIZATION_FIELD = Symbol("REMOVE_CUSTOMIZATION_FIELD");

export type CustomizationPatchValue = unknown | typeof REMOVE_CUSTOMIZATION_FIELD;
export type CustomizationPatch = Record<string, CustomizationPatchValue>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Merge não destrutivo para `Event.customization`.
 *
 * - `undefined`: campo não enviado; mantém o valor atual.
 * - objetos: merge recursivo, para `enabled: false` não apagar configuração.
 * - `REMOVE_CUSTOMIZATION_FIELD`: única operação que apaga uma chave.
 * - `null`: valor explícito; cabe ao chamador permitir no domínio.
 */
export function mergeCustomization(current: unknown, patch: CustomizationPatch): Record<string, unknown> {
  const result = isPlainObject(current) ? { ...current } : {};

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (value === REMOVE_CUSTOMIZATION_FIELD) {
      delete result[key];
      continue;
    }
    result[key] = isPlainObject(value) && isPlainObject(result[key])
      ? mergeCustomization(result[key], value)
      : value;
  }

  return result;
}

export function removeCustomizationWhenMissing<T>(value: T | undefined): T | typeof REMOVE_CUSTOMIZATION_FIELD {
  return value === undefined ? REMOVE_CUSTOMIZATION_FIELD : value;
}
