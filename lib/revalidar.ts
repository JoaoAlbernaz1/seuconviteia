/**
 * Invalidacao do Data Cache. Separado de `lib/cacheTags.ts` porque importa
 * `next/cache`, o que impediria o Vitest de testar as tags.
 *
 * Usa `updateTag` e nao `revalidateTag`. No Next 16 a assinatura mudou:
 *   revalidateTag(tag, profile)  -- exige um perfil de cache
 *   updateTag(tag)               -- so dentro de Server Action, e da semantica
 *                                   de "read-your-own-writes"
 *
 * Todos os chamadores destas funcoes vivem em arquivos `"use server"`
 * (`painel/acoes.ts`, `actions.ts`, `lib/recados.ts`), entao `updateTag` e legal
 * e da o comportamento que queremos: o dono salva e ve a mudanca na hora, sem
 * corrida com o cache.
 */
import { updateTag } from "next/cache";
import { tagEvento, tagRecados } from "@/lib/cacheTags";

/**
 * Chamar em TODO ponto de escrita que muda o que o convidado ve.
 *
 * Esquecer uma chamada nao quebra nada visivelmente: o dono edita, ve o painel
 * certo, abre o site e nada muda. Sem erro, sem log, sem teste vermelho. O
 * `revalidate: 300` do unstable_cache limita o estrago a 5 minutos.
 */
export function revalidarSiteDoEvento(sub: string): void {
  updateTag(tagEvento(sub));
}

/** Mural de recados. Nao invalida o convite — sao tags distintas de proposito. */
export function revalidarRecados(eventId: string): void {
  updateTag(tagRecados(eventId));
}
