/**
 * Fronteira de serializacao do Data Cache do Next.
 *
 * Modulo PURO de proposito: nenhum import de runtime (o `Prisma` abaixo e
 * `import type`, apagado na compilacao). Assim o Vitest o testa sem subir Next
 * nem tocar o banco — a convencao dos outros 19 arquivos de teste do repo.
 *
 * POR QUE EXISTE. Verificado no fonte do Next 16.2.9
 * (`next/dist/server/web/spec-extension/unstable-cache.js`):
 *
 *  - cache MISS: `cacheNewResult()` grava com `JSON.stringify(result)` e faz
 *    `return result` — o objeto ORIGINAL, com `Date` intactos;
 *  - cache HIT:  devolve `JSON.parse(cacheEntry.value.data.body)` — os `Date`
 *    viraram string ISO.
 *
 * O tipo do Prisma nao denuncia a troca, entao o defeito seria INTERMITENTE: a
 * primeira visita a um convite funciona (miss) e a segunda estoura em
 * `eventoPublico` -> `expiresAt.getTime()` (hit). O `tsc` fica calado.
 */
import type { Prisma } from "@prisma/client";

/** O payload exato que `carregarEventoFesta` traz do banco. */
export type EventoFestaRow = Prisma.EventGetPayload<{
  include: { professional: true; template: true; gifts: true; photos: true };
}>;

type ComDatasCruas<T> = {
  [K in keyof T]: T[K] extends Date ? Date | string : T[K];
};

/** O mesmo payload como ele SAI do `unstable_cache` (datas podem ser string). */
export type EventoCru = Omit<
  EventoFestaRow,
  | "eventDate"
  | "expiresAt"
  | "createdAt"
  | "updatedAt"
  | "professional"
  | "template"
  | "gifts"
  | "photos"
> & {
  eventDate: Date | string;
  expiresAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  professional: ComDatasCruas<EventoFestaRow["professional"]>;
  template: ComDatasCruas<NonNullable<EventoFestaRow["template"]>> | null;
  gifts: ComDatasCruas<EventoFestaRow["gifts"][number]>[];
  photos: ComDatasCruas<EventoFestaRow["photos"][number]>[];
};

/** `Date` passa direto; string ISO vira `Date`. */
function paraData(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

/** Revive o `createdAt` de uma linha de relacao. */
function reviverLinha<T extends { createdAt: Date | string }>(
  linha: T,
): T & { createdAt: Date } {
  return { ...linha, createdAt: paraData(linha.createdAt) };
}

/**
 * Aceita os dois formatos (cache hit e cache miss), devolve sempre `Date`.
 *
 * O `as EventoFestaRow` final e o unico cast: o TypeScript nao consegue provar
 * que o mapeamento reconstroi o tipo. A garantia vem dos testes, nao do compilador.
 */
export function reviverEventoFesta(
  ev: EventoCru | null,
): EventoFestaRow | null {
  if (!ev) return null;
  return {
    ...ev,
    eventDate: paraData(ev.eventDate),
    expiresAt: paraData(ev.expiresAt),
    createdAt: paraData(ev.createdAt),
    updatedAt: paraData(ev.updatedAt),
    professional: {
      ...ev.professional,
      createdAt: paraData(ev.professional.createdAt),
      updatedAt: paraData(ev.professional.updatedAt),
    },
    template: ev.template ? reviverLinha(ev.template) : null,
    gifts: ev.gifts.map(reviverLinha),
    photos: ev.photos.map(reviverLinha),
  } as EventoFestaRow;
}
