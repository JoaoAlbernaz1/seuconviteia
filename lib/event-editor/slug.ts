import { RESERVED } from "../tenant";
import type { EventEditorDocument } from "./document";

export const EVENT_SLUG_MIN_LENGTH = 4;
export const EVENT_SLUG_MAX_LENGTH = 30;

const EVENT_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export type EventSlugErrorKind = "empty" | "too_short" | "too_long" | "invalid_format" | "reserved";

export type EventSlugValidationResult =
  | { ok: true; slug: string }
  | {
      ok: false;
      kind: EventSlugErrorKind;
      message: string;
    };

export type EventSlugResolution =
  | { ok: true; slug: string }
  | { ok: false; kind: EventSlugErrorKind | "taken"; message: string };

/** Prepara o valor do campo de endereço para a edição do convite. */
export function normalizeEventSlugInput(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

/** Valida o label que será usado como subdomínio público do evento. */
export function validateEventSlug(value: string): EventSlugValidationResult {
  const slug = value.trim();
  if (!slug) {
    return { ok: false, kind: "empty", message: "Informe o endereço do convite." };
  }
  if (slug.length < EVENT_SLUG_MIN_LENGTH) {
    return { ok: false, kind: "too_short", message: `Use pelo menos ${EVENT_SLUG_MIN_LENGTH} caracteres.` };
  }
  if (slug.length > EVENT_SLUG_MAX_LENGTH) {
    return { ok: false, kind: "too_long", message: `Use no máximo ${EVENT_SLUG_MAX_LENGTH} caracteres.` };
  }
  if (!EVENT_SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      kind: "invalid_format",
      message: "Use letras minúsculas, números ou hífen, sem hífen no início ou no fim.",
    };
  }
  if ((RESERVED as readonly string[]).includes(slug)) {
    return { ok: false, kind: "reserved", message: "Esse endereço está reservado. Escolha outro." };
  }
  return { ok: true, slug };
}

/**
 * Verifica disponibilidade em memória. O slug atual do próprio evento não é
 * considerado conflito; a consulta ao banco continua sendo responsabilidade da
 * action que chama esta regra.
 */
export function isEventSlugAvailable(
  slug: string,
  currentSlug: string | null | undefined,
  occupiedSlugs: ReadonlySet<string>,
): boolean {
  return slug === currentSlug || !occupiedSlugs.has(slug);
}

/** Cria uma cópia do documento com o endereço efetivamente reservado. */
export function withEventSlug(document: EventEditorDocument, slug: string): EventEditorDocument {
  return {
    ...structuredClone(document),
    basic: { ...document.basic, slug },
  };
}

/** Valida e consulta um slug, preservando o valor escolhido pelo usuário. */
export async function resolveEventSlug(
  value: string,
  currentSlug: string | null | undefined,
  exists: (slug: string) => Promise<boolean>,
): Promise<EventSlugResolution> {
  const validation = validateEventSlug(value);
  if (!validation.ok) return validation;
  if (validation.slug === currentSlug || !(await exists(validation.slug))) {
    return validation;
  }
  return { ok: false, kind: "taken", message: "Este endereço já está sendo usado." };
}
