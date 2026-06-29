/**
 * Geracao de slug/subdominio unico para um evento.
 *
 * Mantido "puro-ish": o acesso a banco (checagem de existencia) entra por
 * injecao de dependencia (`existe`), entao a logica e testavel sem Prisma.
 */
import { RESERVED, slugify } from "./tenant";

/** Slug usado quando o nome do evento nao gera nenhum caractere valido. */
const FALLBACK = "evento";

function ehReservado(slug: string): boolean {
  return (RESERVED as readonly string[]).includes(slug);
}

/**
 * Gera um slug unico a partir de `base`.
 *
 *  - Normaliza com `slugify` (vazio -> "evento").
 *  - Palavras RESERVED contam como "ja em uso" (nunca viram subdominio de evento).
 *  - Se `existe(slug)` for verdadeiro (ou reservado), tenta `slug-2`, `slug-3`, ...
 *    ate achar um livre.
 *
 * @param base   Texto de origem (ex.: o titulo do evento).
 * @param existe Predicado async que diz se um slug ja esta ocupado no banco.
 */
export async function gerarSlugUnico(
  base: string,
  existe: (slug: string) => Promise<boolean>,
): Promise<string> {
  const baseSlug = slugify(base) || FALLBACK;

  const indisponivel = async (slug: string): Promise<boolean> =>
    ehReservado(slug) || (await existe(slug));

  if (!(await indisponivel(baseSlug))) return baseSlug;

  for (let n = 2; n < Number.MAX_SAFE_INTEGER; n += 1) {
    const candidato = `${baseSlug}-${n}`;
    if (!(await indisponivel(candidato))) return candidato;
  }

  // Inalcancavel na pratica (limite astronomico acima).
  return `${baseSlug}-${Date.now()}`;
}
