# Cache do Site Público de Evento — Plano de Implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: usar `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar tarefa a tarefa. Os passos usam checkbox (`- [ ]`).

**Spec:** `docs/superpowers/specs/2026-07-10-cache-site-evento-design.md` (commits `72f2aec`, `ed1efe3`)

**Goal:** Fazer o banco parar de ser consultado a cada visita de convidado, sem que as edições do profissional demorem a aparecer no convite.

**Architecture:** A query do evento passa a viver no Data Cache do Next (`unstable_cache`), sob a tag `evento:<sub>`, com TTL de 300s como rede de segurança. As páginas continuam `force-dynamic` — decisão do dono, que exige expiração exata no segundo. Uma fronteira de revival normaliza as datas, porque o `unstable_cache` devolve `Date` no cache miss e `string` no cache hit.

**Tech Stack:** Next.js 16.2.9 (App Router, Turbopack), React 19, TypeScript strict, Prisma 6, Vitest, pnpm.

## Global Constraints

- **As páginas de `app/%5Fsites/[sub]/` continuam `force-dynamic`.** Não remover.
- **`revalidate: 300`** em todo `unstable_cache` deste plano. Não é redundante com as tags — é o que limita o dano de uma invalidação esquecida a 5 minutos em vez de "para sempre".
- **`lib/cacheTags.ts` é puro.** Não pode importar `next/cache`, senão o Vitest não o testa. As chamadas a `revalidateTag` vivem em `lib/revalidar.ts`.
- **Nenhuma tag é montada à mão** fora de `lib/cacheTags.ts`.
- TypeScript strict, sem `any` injustificado. Commits semânticos. Gerenciador: **pnpm**.
- Os 19 arquivos `*.test.ts` existentes (147 testes, funções puras, nenhum toca o banco) devem permanecer verdes em toda tarefa.

## Estrutura de arquivos

| Arquivo | Responsabilidade | Tarefa |
|---|---|---|
| `lib/cacheTags.ts` | **Novo, puro.** `tagEvento(sub)`, `tagRecados(eventId)` | 1 |
| `lib/cacheTags.test.ts` | **Novo.** Formato e estabilidade das tags | 1 |
| `lib/eventoFesta.ts` | Revival de datas (puro) + `unstable_cache` no carregador | 2, 3 |
| `lib/eventoFesta.test.ts` | **Novo.** Revival: cache hit (string), cache miss (Date), `null` | 2 |
| `lib/revalidar.ts` | **Novo.** `revalidarSiteDoEvento(sub)`, `revalidarRecados(eventId)` | 4 |
| `app/(dashboard)/painel/acoes.ts` | 9 pontos de escrita passam a invalidar | 4 |
| `app/(dashboard)/actions.ts` | `eventoDoDono` devolve `subdomain`; `despublicarEvento` invalida | 5 |
| `lib/recados.ts` | Cache do mural + invalidação no `deixarRecado` | 6 |

**Não serão tocados:** as 9 rotas de `app/%5Fsites/[sub]/`, `middleware.ts`, `lib/db.ts`, `lib/event.ts`. O `agenda/route.ts` gera `.ics` com `DTSTAMP` da hora atual e fica fora de propósito.

---

## Tarefa 1: `lib/cacheTags.ts` — as tags, num lugar só

**Files:**
- Create: `lib/cacheTags.ts`
- Test: `lib/cacheTags.test.ts`

**Interfaces:**
- Produz: `tagEvento(sub: string): string` e `tagRecados(eventId: string): string`, consumidos pelas Tarefas 3, 4, 5 e 6.

Por que existe: quem **escreve** a tag e quem a **invalida** precisam concordar na string. Uma divergência não dá erro de compilação nem de runtime — o site apenas para de atualizar, em silêncio.

- [ ] **Passo 1: Escrever o teste que falha**

```ts
// lib/cacheTags.test.ts
import { describe, expect, it } from "vitest";
import { tagEvento, tagRecados } from "./cacheTags";

describe("tagEvento", () => {
  it("prefixa com evento: e usa o subdominio", () => {
    expect(tagEvento("maria-clara")).toBe("evento:maria-clara");
  });

  it("nao colide com a tag de recados", () => {
    expect(tagEvento("abc")).not.toBe(tagRecados("abc"));
  });
});

describe("tagRecados", () => {
  it("prefixa com recados: e usa o eventId", () => {
    expect(tagRecados("ckv123")).toBe("recados:ckv123");
  });
});
```

- [ ] **Passo 2: Rodar e ver falhar**

Run: `pnpm exec vitest run lib/cacheTags.test.ts`
Esperado: FAIL — `Failed to resolve import "./cacheTags"`.

- [ ] **Passo 3: Implementar**

```ts
// lib/cacheTags.ts
/**
 * Tags do Data Cache do Next. Modulo PURO de proposito: se importar
 * `next/cache`, o Vitest nao consegue testa-lo. As chamadas a `revalidateTag`
 * vivem em `lib/revalidar.ts`.
 *
 * Quem escreve a tag e quem a invalida precisam concordar na string. Uma
 * divergencia nao quebra build nem runtime — o site so para de atualizar.
 */

/** Dados do evento servidos ao convidado. Invalidada quando o dono salva. */
export function tagEvento(sub: string): string {
  return `evento:${sub}`;
}

/**
 * Mural de recados. Chaveada por `eventId` (e nao pelo subdominio) porque
 * `listarRecadosAprovados` recebe eventId. Tag separada da do evento: o mural
 * muda por acao de CONVIDADO, e nao deveria invalidar o convite inteiro.
 */
export function tagRecados(eventId: string): string {
  return `recados:${eventId}`;
}
```

- [ ] **Passo 4: Rodar e ver passar**

Run: `pnpm exec vitest run lib/cacheTags.test.ts`
Esperado: PASS, 3 testes.

- [ ] **Passo 5: Commit**

```bash
git add lib/cacheTags.ts lib/cacheTags.test.ts
git commit -m "feat(cache): tags do data cache num modulo puro"
```

---

## Tarefa 2: Revival de datas (função pura)

**Files:**
- Modify: `lib/eventoFesta.ts` (acrescenta export; não mexe no carregador ainda)
- Test: `lib/eventoFesta.test.ts` (novo)

**Interfaces:**
- Produz: `reviverEventoFesta(ev: EventoCru | null): EventoFestaRow | null`, consumido pela Tarefa 3.
- Produz os tipos `EventoFestaRow` (payload do Prisma com as 4 relações) e `EventoCru` (o mesmo, com datas podendo ser `string`).

**Por que esta tarefa existe.** Lido o fonte de `next/dist/server/web/spec-extension/unstable-cache.js` (Next 16.2.9):

- cache **miss**: `cacheNewResult()` grava com `JSON.stringify(result)` e faz `return result` — o objeto original, com `Date` intactos;
- cache **hit**: `return JSON.parse(cacheEntry.value.data.body)` — os `Date` viraram `string` ISO.

O TypeScript não avisa, porque acredita no tipo do Prisma. Logo o bug é **intermitente**: a primeira visita ao convite funciona, a segunda estoura em `eventoPublico` → `ev.expiresAt.getTime()`. Um teste manual de uma visita passaria.

A fronteira aceita **os dois** formatos e normaliza para `Date`.

- [ ] **Passo 1: Escrever o teste que falha**

```ts
// lib/eventoFesta.test.ts
import { describe, expect, it } from "vitest";
import { reviverEventoFesta } from "./eventoFesta";

/** Monta um evento cru; `d` decide se as datas vao como Date ou string ISO. */
function cru(d: (iso: string) => Date | string) {
  return {
    id: "ev1",
    professionalId: "p1",
    type: "QUINZE_ANOS",
    subdomain: "maria-clara",
    title: "Maria Clara",
    templateId: null,
    eventDate: d("2026-08-01T23:00:00.000Z"),
    expiresAt: d("2026-08-31T23:00:00.000Z"),
    status: "PUBLISHED",
    plan: "BASICO",
    customization: null,
    createdAt: d("2026-07-01T10:00:00.000Z"),
    updatedAt: d("2026-07-02T10:00:00.000Z"),
    professional: {
      id: "p1",
      name: "Estudio",
      email: "e@e.com",
      passwordHash: null,
      plan: "BASICO",
      avatarUrl: null,
      brandName: null,
      brandLogoUrl: null,
      brandColors: null,
      createdAt: d("2026-06-01T10:00:00.000Z"),
      updatedAt: d("2026-06-01T10:00:00.000Z"),
    },
    template: null,
    gifts: [
      {
        id: "g1",
        eventId: "ev1",
        title: "Pix",
        description: null,
        imageUrl: null,
        priceCents: 5000,
        mode: "PIX",
        pixPayload: null,
        purchased: false,
        buyerName: null,
        createdAt: d("2026-07-01T10:00:00.000Z"),
      },
    ],
    photos: [
      {
        id: "f1",
        eventId: "ev1",
        url: "/f.jpg",
        order: 0,
        createdAt: d("2026-07-01T10:00:00.000Z"),
      },
    ],
  };
}

describe("reviverEventoFesta", () => {
  it("cache HIT: converte strings ISO em Date", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ev = reviverEventoFesta(cru((iso) => iso) as any)!;
    expect(ev.expiresAt).toBeInstanceOf(Date);
    expect(ev.eventDate).toBeInstanceOf(Date);
    expect(ev.expiresAt.toISOString()).toBe("2026-08-31T23:00:00.000Z");
  });

  it("cache MISS: preserva Date que ja sao Date", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ev = reviverEventoFesta(cru((iso) => new Date(iso)) as any)!;
    expect(ev.expiresAt).toBeInstanceOf(Date);
    expect(ev.expiresAt.toISOString()).toBe("2026-08-31T23:00:00.000Z");
  });

  it("revive as datas das relacoes", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ev = reviverEventoFesta(cru((iso) => iso) as any)!;
    expect(ev.professional.createdAt).toBeInstanceOf(Date);
    expect(ev.gifts[0]!.createdAt).toBeInstanceOf(Date);
    expect(ev.photos[0]!.createdAt).toBeInstanceOf(Date);
  });

  it("aceita template nulo sem estourar", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ev = reviverEventoFesta(cru((iso) => iso) as any)!;
    expect(ev.template).toBeNull();
  });

  it("evento inexistente vira null", () => {
    expect(reviverEventoFesta(null)).toBeNull();
  });

  it("o resultado sobrevive ao eventoPublico (que chama getTime)", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ev = reviverEventoFesta(cru((iso) => iso) as any)!;
    expect(() => ev.expiresAt.getTime()).not.toThrow();
  });
});
```

- [ ] **Passo 2: Rodar e ver falhar**

Run: `pnpm exec vitest run lib/eventoFesta.test.ts`
Esperado: FAIL — `reviverEventoFesta is not a function`.

- [ ] **Passo 3: Implementar**

Acrescente ao topo de `lib/eventoFesta.ts` (após os imports existentes):

```ts
import type { Prisma } from "@prisma/client";

/** O payload exato que `carregarEventoFesta` traz do banco. */
export type EventoFestaRow = Prisma.EventGetPayload<{
  include: { professional: true; template: true; gifts: true; photos: true };
}>;

/**
 * O mesmo payload como ele SAI do `unstable_cache`: no cache hit as datas
 * chegam como string ISO (o Next serializa com JSON.stringify e devolve
 * JSON.parse); no cache miss chegam como `Date`. Ver o spec de 2026-07-10.
 */
export type EventoCru = Omit<
  EventoFestaRow,
  "eventDate" | "expiresAt" | "createdAt" | "updatedAt" | "professional" | "template" | "gifts" | "photos"
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

type ComDatasCruas<T> = {
  [K in keyof T]: T[K] extends Date ? Date | string : T[K];
};

/** `Date` passa direto; string ISO vira `Date`. */
function paraData(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

/** Revive `createdAt`/`updatedAt` de uma linha de relacao. */
function reviverLinha<T extends { createdAt: Date | string }>(
  linha: T,
): T & { createdAt: Date } {
  return { ...linha, createdAt: paraData(linha.createdAt) };
}

/**
 * Fronteira de serializacao do Data Cache.
 *
 * O `unstable_cache` do Next devolve `Date` no cache MISS e `string` no cache
 * HIT — e o tipo do Prisma nao denuncia. Sem esta funcao, a primeira visita a um
 * convite funciona e a segunda estoura em `eventoPublico` -> `expiresAt.getTime()`.
 *
 * PURA e testada. Aceita os dois formatos, devolve sempre `Date`.
 */
export function reviverEventoFesta(ev: EventoCru | null): EventoFestaRow | null {
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
```

O `as EventoFestaRow` do final é o único cast, e ele existe porque o TypeScript não consegue provar que o mapeamento reconstrói o tipo — a garantia vem dos testes acima, não do compilador.

- [ ] **Passo 4: Rodar e ver passar**

Run: `pnpm exec vitest run lib/eventoFesta.test.ts`
Esperado: PASS, 6 testes.

- [ ] **Passo 5: Typecheck**

Run: `pnpm exec tsc --noEmit`
Esperado: sem erros.

- [ ] **Passo 6: Commit**

```bash
git add lib/eventoFesta.ts lib/eventoFesta.test.ts
git commit -m "feat(cache): fronteira de revival de datas do data cache

unstable_cache devolve Date no miss e string ISO no hit (verificado no fonte do
Next 16.2.9). Sem revival, a 2a visita a um convite estoura em expiresAt.getTime()
e o tsc nao avisa."
```

---

## Tarefa 3: Cachear a query do evento

**Files:**
- Modify: `lib/eventoFesta.ts:168-173`

**Interfaces:**
- Consome: `tagEvento` (Tarefa 1), `reviverEventoFesta` (Tarefa 2).
- Produz: `carregarEventoFesta(sub: string): Promise<EventoFestaRow | null>` — **mesma assinatura de antes**. Nenhuma rota muda.

- [ ] **Passo 1: Substituir o carregador**

Troque o bloco atual:

```ts
export const carregarEventoFesta = cache(async (sub: string) => {
  return prisma.event.findUnique({
    where: { subdomain: sub },
    include: { professional: true, template: true, gifts: true, photos: true },
  });
});
```

por:

```ts
/**
 * Query crua do evento, no Data Cache do Next.
 *
 * `revalidate: 300` NAO e redundante com a tag: e a rede de seguranca para o dia
 * em que alguem adicionar um ponto de escrita e esquecer de invalidar. Com ele, o
 * custo do esquecimento cai de "stale para sempre" para "ate 5 minutos".
 *
 * Nao afeta a exatidao da expiracao: as paginas seguem `force-dynamic` e chamam
 * `eventoPublico(event, new Date())` a cada visita. O que envelhece e a LINHA do
 * banco, e o `expiresAt` dela nao muda com o tempo.
 */
const carregarEventoCru = (sub: string) =>
  unstable_cache(
    async () =>
      prisma.event.findUnique({
        where: { subdomain: sub },
        include: { professional: true, template: true, gifts: true, photos: true },
      }),
    ["evento-festa", sub],
    { tags: [tagEvento(sub)], revalidate: 300 },
  )();

/**
 * Carrega o Event do subdominio (+ relacoes usadas pela home).
 *
 * Duas camadas de cache, de fora para dentro:
 *  - `cache()` do React: memoiza por REQUISICAO (layout e page compartilham).
 *  - `unstable_cache`: persiste ENTRE requisicoes, invalidado por `tagEvento(sub)`.
 *
 * O revival no meio existe porque o `unstable_cache` serializa (ver Tarefa 2).
 */
export const carregarEventoFesta = cache(
  async (sub: string): Promise<EventoFestaRow | null> =>
    reviverEventoFesta((await carregarEventoCru(sub)) as EventoCru | null),
);
```

- [ ] **Passo 2: Ajustar os imports do arquivo**

No topo de `lib/eventoFesta.ts`, junto dos imports existentes:

```ts
import { unstable_cache } from "next/cache";
import { tagEvento } from "@/lib/cacheTags";
```

O `cache` do React já está importado (é o que embrulha o carregador hoje). Não remova.

- [ ] **Passo 3: Typecheck e testes**

Run: `pnpm exec tsc --noEmit && pnpm test`
Esperado: sem erros de tipo; 20 arquivos de teste passando.

- [ ] **Passo 4: Provar que o cache funciona, no navegador**

Adicione **temporariamente** um log dentro da função cacheada, logo antes do `prisma.event.findUnique`:

```ts
console.log("[CACHE MISS] query do evento:", sub);
```

Depois:

```bash
docker start sc-postgres
pnpm dev
```

Abra `http://maria-clara.localhost:3000` e recarregue **cinco vezes**.
Esperado no terminal: `[CACHE MISS]` aparece **uma vez**, não cinco.

Se aparecer cinco vezes, o cache não está pegando — pare e investigue antes de seguir.

- [ ] **Passo 5: Remover o log e commitar**

```bash
git add lib/eventoFesta.ts
git commit -m "feat(cache): query do evento vai para o data cache (tag + TTL 300s)

De uma query por visita de convidado para uma por invalidacao. As paginas seguem
force-dynamic: a expiracao continua exata, so a linha do banco e cacheada."
```

---

## Tarefa 4: Invalidar quando o dono salva (painel)

**Files:**
- Create: `lib/revalidar.ts`
- Modify: `app/(dashboard)/painel/acoes.ts` (9 funções)

**Interfaces:**
- Consome: `tagEvento`, `tagRecados` (Tarefa 1).
- Produz: `revalidarSiteDoEvento(sub: string): void` e `revalidarRecados(eventId: string): void`, consumidos pelas Tarefas 5 e 6.

**Este é o ponto de maior risco do plano.** Hoje o site é `force-dynamic` e sempre fresco. Ao introduzir cache, esquecer **um** ponto de invalidação produz o defeito silencioso: o dono edita, vê o painel certo, abre o site e nada muda. Sem erro, sem log, sem teste vermelho. O `revalidate: 300` da Tarefa 3 limita o estrago a 5 minutos — mas o certo é não esquecer.

Todas as 9 funções abaixo já carregam `const event = await eventoDoDono(...)`, que faz `prisma.event.findFirst` **sem `select`** — portanto `event.subdomain` está disponível. Não é preciso nova query.

- [ ] **Passo 1: Criar o módulo de invalidação**

```ts
// lib/revalidar.ts
/**
 * Invalidacao do Data Cache. Separado de `lib/cacheTags.ts` porque importa
 * `next/cache`, o que impediria o Vitest de testar as tags.
 */
import { revalidateTag } from "next/cache";
import { tagEvento, tagRecados } from "@/lib/cacheTags";

/**
 * Chamar em TODO ponto de escrita que muda o que o convidado ve.
 * Esquecer uma chamada nao quebra nada visivelmente: o site so para de
 * atualizar por ate 5 minutos (TTL do unstable_cache).
 */
export function revalidarSiteDoEvento(sub: string): void {
  revalidateTag(tagEvento(sub));
}

/** Mural de recados. Nao invalida o convite — sao tags distintas de proposito. */
export function revalidarRecados(eventId: string): void {
  revalidateTag(tagRecados(eventId));
}
```

- [ ] **Passo 2: Importar em `acoes.ts`**

```ts
import { revalidarSiteDoEvento } from "@/lib/revalidar";
```

- [ ] **Passo 3: Acrescentar a chamada nas 9 funções**

Em cada uma, **imediatamente após** o `revalidatePath("/painel")` existente, acrescente `revalidarSiteDoEvento(event.subdomain);`.

As funções, com a linha do `revalidatePath` atual:

| Função | Linha do `revalidatePath` |
|---|---|
| `criarRascunho` | 246 |
| `atualizarDetalhes` | 314 |
| `salvarEstilo` | 344 |
| `salvarRecursos` | 359 |
| `salvarFotos` | 396 |
| `salvarPresentes` | (o `revalidatePath` do bloco iniciado em 411) |
| `salvarProgramacao` | (o `revalidatePath` do bloco iniciado em 471) |
| `publicarEComemorar` | 501 |
| `excluirEvento` | 521 |

Duas observações que mudam o código:

Em `criarRascunho`, o evento é criado na linha 231 e a variável se chama `event`; use `event.subdomain`.

Em `excluirEvento`, chame `revalidarSiteDoEvento(event.subdomain)` **antes** do `prisma.event.delete`, ou guarde `const sub = event.subdomain;` no topo — depois do delete o objeto ainda existe em memória, mas deixar a leitura antes do delete torna a intenção óbvia para quem ler.

Exemplo, em `salvarEstilo`:

```ts
  await prisma.event.update({
    where: { id: event.id },
    data: { customization: mesclar(event.customization, patch) },
  });
  revalidatePath("/painel");
  revalidarSiteDoEvento(event.subdomain);
  redirect(destinoVoltar(formData, `/painel/${event.id}`));
}
```

Atenção: `redirect()` do Next lança uma exceção para interromper o fluxo. A chamada de invalidação **precisa vir antes** dele, nunca depois.

- [ ] **Passo 4: Provar que nenhuma das 9 ficou para trás**

```bash
grep -c "revalidarSiteDoEvento" "app/(dashboard)/painel/acoes.ts"
```
Esperado: `10` (as 9 chamadas + a linha do `import`).

```bash
grep -c 'revalidatePath("/painel")' "app/(dashboard)/painel/acoes.ts"
```
Esperado: `9` — o mesmo número. Se os dois não baterem, há um ponto de escrita sem invalidação.

- [ ] **Passo 5: Typecheck, testes, commit**

```bash
pnpm exec tsc --noEmit && pnpm test
git add lib/revalidar.ts "app/(dashboard)/painel/acoes.ts"
git commit -m "feat(cache): painel invalida o site do evento ao salvar

Nove pontos de escrita passam a chamar revalidarSiteDoEvento(sub). Antes, nada
revalidava app/%5Fsites — o site so estava correto porque era force-dynamic."
```

---

## Tarefa 5: `despublicarEvento` — o helper que só devolve o id

**Files:**
- Modify: `app/(dashboard)/actions.ts:165-174` (helper `eventoDoDono`) e `:177-182` (`despublicarEvento`)

**Interfaces:**
- Consome: `revalidarSiteDoEvento` (Tarefa 4).

Tarefa separada porque muda a assinatura de um helper. `actions.ts` tem o **seu próprio** `eventoDoDono`, diferente do de `acoes.ts`: ele faz `select: { id: true }` e devolve `Promise<string | null>`. Sem o `subdomain`, `despublicarEvento` não sabe qual tag invalidar.

- [ ] **Passo 1: Ampliar o `select` do helper**

```ts
async function eventoDoDono(
  eventId: unknown,
): Promise<{ id: string; subdomain: string } | null> {
  const session = await auth();
  if (!session?.user) return null;
  if (typeof eventId !== "string" || !eventId) return null;
  const ev = await prisma.event.findFirst({
    where: { id: eventId, professionalId: session.user.id },
    select: { id: true, subdomain: true },
  });
  return ev ?? null;
}
```

- [ ] **Passo 2: Encontrar todos os chamadores desse helper**

```bash
grep -n "eventoDoDono" "app/(dashboard)/actions.ts"
```

Cada chamador que tratava o retorno como `string` precisa passar a usar `.id`. Hoje `despublicarEvento` faz `const id = await eventoDoDono(...)` e depois `where: { id }` — isso **quebra** com o novo tipo, e o `tsc` vai acusar. É o resultado desejado: o compilador aponta cada lugar.

- [ ] **Passo 3: Corrigir `despublicarEvento`**

```ts
export async function despublicarEvento(formData: FormData) {
  const event = await eventoDoDono(formData.get("eventId"));
  if (!event) redirect("/entrar");
  await prisma.event.update({
    where: { id: event.id },
    data: { status: "DRAFT" },
  });
  revalidatePath("/painel");
  revalidarSiteDoEvento(event.subdomain);
}
```

Importe `revalidarSiteDoEvento` de `@/lib/revalidar` no topo do arquivo.

- [ ] **Passo 4: Typecheck — é ele quem prova a tarefa**

Run: `pnpm exec tsc --noEmit`
Esperado: sem erros. Se algum outro chamador tratava o retorno como string, ele aparece aqui e deve ser corrigido para `.id`.

- [ ] **Passo 5: Testes e commit**

```bash
pnpm test
git add "app/(dashboard)/actions.ts"
git commit -m "feat(cache): despublicar invalida o site (helper devolve subdomain)"
```

---

## Tarefa 6: Mural de recados

**Files:**
- Modify: `lib/recados.ts:32-62` (`deixarRecado`) e `:64-75` (`listarRecadosAprovados`)

**Interfaces:**
- Consome: `tagRecados` (Tarefa 1), `revalidarRecados` (Tarefa 4).
- Produz: `listarRecadosAprovados(eventId: string): Promise<RecadoView[]>` — **mesma assinatura**.

O `select` de `listarRecadosAprovados` traz apenas `id`, `name` e `message`. **Nenhuma `Date`** — logo este cache não precisa de revival. Só o do evento precisa.

- [ ] **Passo 1: Cachear a listagem**

```ts
/** Recados aprovados de um evento, mais recentes primeiro. */
export async function listarRecadosAprovados(
  eventId: string,
): Promise<RecadoView[]> {
  // Sem revival: o `select` abaixo nao traz nenhum campo `Date`, entao a
  // serializacao do unstable_cache e inofensiva aqui.
  return unstable_cache(
    async () => {
      const rows = await prisma.recado.findMany({
        where: { eventId, approved: true },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, message: true },
      });
      return rows.map((r) => ({ id: r.id, nome: r.name, mensagem: r.message }));
    },
    ["recados", eventId],
    { tags: [tagRecados(eventId)], revalidate: 300 },
  )();
}
```

- [ ] **Passo 2: Invalidar ao receber um recado**

Em `deixarRecado`, dentro do `try`, logo após o `prisma.recado.create`:

```ts
  try {
    await prisma.recado.create({
      data: { eventId: event.id, name: nome, message: mensagem },
    });
    revalidarRecados(event.id);
  } catch {
    return { ok: false, error: "Não foi possível enviar agora. Tente de novo." };
  }
  return { ok: true };
```

A invalidação fica **dentro** do `try` e **depois** do `create`: se a escrita falhar, não há o que invalidar.

- [ ] **Passo 3: Imports**

```ts
import { unstable_cache } from "next/cache";
import { tagRecados } from "@/lib/cacheTags";
import { revalidarRecados } from "@/lib/revalidar";
```

- [ ] **Passo 4: Typecheck, testes, commit**

```bash
pnpm exec tsc --noEmit && pnpm test
git add lib/recados.ts
git commit -m "feat(cache): mural de recados com tag propria

Tag separada da do evento: um recado de convidado nao deve invalidar o convite."
```

---

## Tarefa 7: Verificação no navegador e fechamento

**Files:** nenhum.

Os testes cobrem funções puras. O comportamento do cache só se prova exercitando o app.

- [ ] **Passo 1: Subir o ambiente**

```bash
docker start sc-postgres
pnpm dev
```

- [ ] **Passo 2: O banco para de ser consultado**

Ligue o log de statements no Postgres do container e conte as queries de verdade:

```bash
docker exec sc-postgres psql -U postgres -d seuconviteia -c "ALTER SYSTEM SET log_statement = 'all';" -c "SELECT pg_reload_conf();"
docker logs --since 1s -f sc-postgres > /tmp/pg.log 2>&1 &
```

Abra `http://maria-clara.localhost:3000` e recarregue **cinco vezes**. Então:

```bash
grep -c 'SELECT.*"Event"' /tmp/pg.log
```

Esperado: **1**, não 5. (Pode haver `SELECT 1` de health check; conte só as do `"Event"`.)

Desligue o log depois:

```bash
docker exec sc-postgres psql -U postgres -d seuconviteia -c "ALTER SYSTEM RESET log_statement;" -c "SELECT pg_reload_conf();"
```

- [ ] **Passo 3: A edição do dono aparece na hora**

Entre no painel (`demo@seuconviteia.com` / `demo12345`), edite o título do evento `maria-clara`, salve, e recarregue `http://maria-clara.localhost:3000`.

Esperado: o título novo aparece **imediatamente**. Se só aparecer depois de 5 minutos, a tag não está sendo invalidada — o TTL é que está te salvando, e há um bug.

- [ ] **Passo 4: O recado aparece na hora, e não invalida o convite**

Deixe um recado no mural do evento. Recarregue: o recado aparece imediatamente.

- [ ] **Passo 5: A expiração continua exata**

```bash
docker exec sc-postgres psql -U postgres -d seuconviteia -c "UPDATE \"Event\" SET \"expiresAt\" = now() - interval '1 minute' WHERE subdomain = 'maria-clara';"
```

Recarregue o site **sem esperar**. Esperado: o convite some na hora (`SiteIndisponivel`), porque a página é `force-dynamic` e reavalia `eventoPublico(event, new Date())` a cada visita — mesmo servindo a linha cacheada.

Isto é o teste da decisão do dono. Se o convite continuar visível, o cache invadiu a decisão de visibilidade e a implementação está errada.

Restaure depois:

```bash
docker exec sc-postgres psql -U postgres -d seuconviteia -c "UPDATE \"Event\" SET \"expiresAt\" = now() + interval '30 days' WHERE subdomain = 'maria-clara';"
```

- [ ] **Passo 6: Build e fechamento**

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
```

Esperado: tudo verde. (O `pnpm lint` acusa erros num `.d.ts` de skill do Figma em `.agents/skills/` — pasta **não rastreada**, que o CI não vê. Ignore.)

---

## Fora deste plano

- **Validade do site por plano contratado.** `lib/dates.ts:4` fixa `VALIDADE_MS = 30 dias` para todos os planos. O dono quer que dependa do plano. É regra de negócio, precisa de spec própria.
- **Cache de página no CDN.** Só faz sentido se o dono reconsiderar a exigência de expiração exata no segundo. A virada custa remover `force-dynamic` e adicionar `export const revalidate`.
- **`excluirEvento` apaga os filhos à mão** (`guest`, `giftItem`, `photo`, `recado`) com um comentário dizendo "nem todas as relações têm onDelete: Cascade". Isso deixou de ser verdade em `0e3b1b3`: as FKs agora são reais e o cascade é do banco. O código está correto, apenas redundante. Limpeza para outro momento.
