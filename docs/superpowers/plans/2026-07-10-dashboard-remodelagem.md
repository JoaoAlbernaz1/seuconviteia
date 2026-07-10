# Remodelagem do Dashboard — Plano de Implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: usar `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans`. Os passos usam checkbox (`- [ ]`).

**Spec:** `docs/superpowers/specs/2026-07-10-dashboard-remodelagem-design.md` (commit `fa50a70`)

**Goal:** A home do painel se sustenta com um evento e com doze, fala a mesma língua visual da landing, e representa honestamente os quatro estados de um evento.

**Architecture:** A lógica sai do componente. `page.tsx` vira composição: quatro componentes de `_ui/` e três módulos puros em `lib/` (estado do evento, frases com concordância correta, filtro/ordenação). Os módulos puros carregam os testes; os componentes carregam só marcação. A página continua Server Component e `force-dynamic`; o filtro roda no cliente sobre a lista já carregada.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4, Vitest, pnpm.

## Global Constraints

- **Sem sidebar.** O painel usa topbar (`TopBar.tsx`). A sidebar que apareceu numa das telas do Stitch está fora, junto dos itens que ela inventou ("Convidados", "Mensagens", "Configurações").
- **Sem gráfico, sem KPI com seta de tendência, sem tabela densa.** Não é um ERP.
- **Tema claro apenas.** O modo escuro foi removido do produto de propósito.
- **O amarelo `#F5FF63` só é usado como fundo, com tinta preta.** Ele não passa contraste com branco. Regra, não sugestão.
- **Módulos de `lib/` que têm teste não podem importar `@/...`** — o Vitest não resolve o alias. Usar caminho relativo (`./event`) ou nenhum import de runtime. Os 21 arquivos de teste do repo são puros e nenhum toca o banco; mantenha assim.
- **Não tocar em `app/(dashboard)/painel/[id]/*`.** Só a home.
- **Não renomear os planos.** "Básico" permite 3 eventos; "Convite único" da landing, pelo nome, permite 1. É regra de negócio divergente, não rótulo. Fora de escopo (§7 do spec).
- Copy em **português do Brasil**. Commits semânticos. Gerenciador **pnpm**.
- O `impeccable` instalou um hook `PostToolUse` que roda o detector a cada Edit/Write em arquivo de UI. Ele vai comentar; leia o que ele diz.

## Estrutura de arquivos

| Arquivo | Responsabilidade | Tarefa |
|---|---|---|
| `lib/frases.ts` | **Novo, puro.** `frasePresencas`, `fraseResumo` — concordância correta | 1 |
| `lib/frases.test.ts` | **Novo.** Singular e plural em cada posição | 1 |
| `lib/painelEstado.ts` | **Novo, puro.** `EstadoEvento`, `estadoDoEvento`, `pendenciaDoEvento` | 2 |
| `lib/painelEstado.test.ts` | **Novo.** Os 4 estados; `PUBLISHED` vencido → `EXPIRADO` | 2 |
| `lib/filtroEventos.ts` | **Novo, puro.** Busca, filtro por status, ordenação | 3 |
| `lib/filtroEventos.test.ts` | **Novo.** Acentos, status, as 3 ordenações | 3 |
| `app/globals.css` | Tokens da marca — **os dois roxos** | 4 |
| `app/(dashboard)/painel/_ui/ResumoBlocos.tsx` | **Novo.** Três blocos coloridos | 5 |
| `app/(dashboard)/painel/_ui/CardEvento.tsx` | **Novo.** Um componente, quatro estados | 6 |
| `app/(dashboard)/painel/_ui/EstadoVazio.tsx` | **Novo.** Conta sem eventos | 7 |
| `app/(dashboard)/painel/_ui/FiltroEventos.tsx` | **Novo, client.** Controles de busca/filtro | 8 |
| `app/(dashboard)/painel/page.tsx` | Recomposição + limite do plano | 9 |

**Reaproveitar, não recriar:** `_ui/CapaEvento.tsx` (capa com foto ou gradiente da paleta) e
`_ui/estilos.ts` (`COLUNA`, `CARD`, `BTN_PRIMARIO`, `BTN_GHOST`, `TITULO`, `PILL_NO_AR`).

---

## Tarefa 1: `lib/frases.ts` — a concordância

**Files:**
- Create: `lib/frases.ts`, `lib/frases.test.ts`

**Interfaces:**
- Produz: `frasePresencas(n: number): string` e `fraseResumo(sites: number, presencas: number, recados: number): string`, consumidos pelas Tarefas 5, 6 e 9.

Hoje `page.tsx:104` escreve `` `${n} convidado${n === 1 ? "" : "s"} confirmaram` ``: o
substantivo é condicional, o verbo não. Com um convidado a tela diz **"1 convidado
confirmaram"**.

- [ ] **Passo 1: Escrever o teste que falha**

```ts
// lib/frases.test.ts
import { describe, expect, it } from "vitest";
import { frasePresencas, fraseResumo } from "./frases";

describe("frasePresencas", () => {
  it("singular: substantivo E verbo concordam", () => {
    expect(frasePresencas(1)).toBe("1 convidado confirmou");
  });
  it("plural", () => {
    expect(frasePresencas(3)).toBe("3 convidados confirmaram");
  });
  it("zero usa plural", () => {
    expect(frasePresencas(0)).toBe("Nenhum convidado confirmou ainda");
  });
});

describe("fraseResumo", () => {
  it("tudo no singular", () => {
    expect(fraseResumo(1, 1, 1)).toBe(
      "1 site no ar · 1 presença confirmada · 1 recado de carinho",
    );
  });
  it("tudo no plural", () => {
    expect(fraseResumo(2, 3, 4)).toBe(
      "2 sites no ar · 3 presenças confirmadas · 4 recados de carinho",
    );
  });
  it("mistura: cada posição concorda sozinha", () => {
    expect(fraseResumo(1, 0, 2)).toBe(
      "1 site no ar · 0 presenças confirmadas · 2 recados de carinho",
    );
  });
});
```

- [ ] **Passo 2: Rodar e ver falhar**

Run: `pnpm exec vitest run lib/frases.test.ts`
Esperado: FAIL — `Failed to resolve import "./frases"`.

- [ ] **Passo 3: Implementar**

```ts
// lib/frases.ts
/**
 * Frases da home do painel. PURO: sem import de runtime, para o Vitest testar.
 *
 * Existe porque a versao anterior escrevia `${n} convidado${n===1?"":"s"} confirmaram`:
 * pluralizava o substantivo e esquecia o verbo. Com 1 convidado, a tela dizia
 * "1 convidado confirmaram".
 */

/** "1 convidado confirmou" · "3 convidados confirmaram" · zero tem frase propria. */
export function frasePresencas(n: number): string {
  if (n === 0) return "Nenhum convidado confirmou ainda";
  if (n === 1) return "1 convidado confirmou";
  return `${n} convidados confirmaram`;
}

/** Cada uma das tres posicoes concorda por conta propria. */
export function fraseResumo(
  sites: number,
  presencas: number,
  recados: number,
): string {
  const s = sites === 1 ? "1 site no ar" : `${sites} sites no ar`;
  const p =
    presencas === 1
      ? "1 presença confirmada"
      : `${presencas} presenças confirmadas`;
  const r =
    recados === 1 ? "1 recado de carinho" : `${recados} recados de carinho`;
  return `${s} · ${p} · ${r}`;
}
```

- [ ] **Passo 4: Rodar e ver passar**

Run: `pnpm exec vitest run lib/frases.test.ts`
Esperado: PASS, 6 testes.

- [ ] **Passo 5: Commit**

```bash
git add lib/frases.ts lib/frases.test.ts
git commit -m "fix(painel): concordancia das frases de resumo e presencas

'1 convidado confirmaram' — o substantivo era condicional, o verbo nao."
```

---

## Tarefa 2: `lib/painelEstado.ts` — os quatro estados

**Files:**
- Create: `lib/painelEstado.ts`, `lib/painelEstado.test.ts`

**Interfaces:**
- Consome: `StatusEvento` de `lib/event.ts` (import de tipo, relativo).
- Produz: `EstadoEvento`, `estadoDoEvento(ev, pendencia, agora)` e `pendenciaDoEvento(temFoto, qtdPresentes)`, consumidos pelas Tarefas 3, 6 e 9.

**O ponto desta tarefa.** A tela de hoje só pergunta `status === "PUBLISHED"` e trata todo o
resto como rascunho — então um evento **expirado** aparece como *"Em preparação"*, com o
botão *"Continuar montando"*.

E expirado não é só o status `EXPIRED`: um evento `PUBLISHED` com `expiresAt` no passado
também está expirado. É assim que `lib/event.ts:eventoPublico` já decide a visibilidade do
site público. Reaproveitamos essa verdade em vez de inventar outra.

- [ ] **Passo 1: Escrever o teste que falha**

```ts
// lib/painelEstado.test.ts
import { describe, expect, it } from "vitest";
import { estadoDoEvento, pendenciaDoEvento } from "./painelEstado";

const AGORA = new Date("2026-07-10T12:00:00Z");
const FUTURO = new Date("2026-08-10T12:00:00Z");
const PASSADO = new Date("2026-06-10T12:00:00Z");

describe("estadoDoEvento", () => {
  it("rascunho", () => {
    expect(estadoDoEvento({ status: "DRAFT", expiresAt: FUTURO }, null, AGORA)).toBe(
      "RASCUNHO",
    );
  });

  it("publicado e dentro do prazo", () => {
    expect(estadoDoEvento({ status: "PUBLISHED", expiresAt: FUTURO }, null, AGORA)).toBe(
      "NO_AR",
    );
  });

  it("publicado COM pendencia", () => {
    expect(
      estadoDoEvento({ status: "PUBLISHED", expiresAt: FUTURO }, "faltam as fotos", AGORA),
    ).toBe("NO_AR_PENDENTE");
  });

  it("PUBLISHED com prazo vencido e EXPIRADO, nao NO_AR", () => {
    expect(estadoDoEvento({ status: "PUBLISHED", expiresAt: PASSADO }, null, AGORA)).toBe(
      "EXPIRADO",
    );
  });

  it("status EXPIRED explicito", () => {
    expect(estadoDoEvento({ status: "EXPIRED", expiresAt: FUTURO }, null, AGORA)).toBe(
      "EXPIRADO",
    );
  });

  it("expirado vence a pendencia (nao adianta pedir fotos de um site fora do ar)", () => {
    expect(
      estadoDoEvento({ status: "PUBLISHED", expiresAt: PASSADO }, "faltam as fotos", AGORA),
    ).toBe("EXPIRADO");
  });

  it("rascunho vencido continua rascunho (nunca esteve no ar)", () => {
    expect(estadoDoEvento({ status: "DRAFT", expiresAt: PASSADO }, null, AGORA)).toBe(
      "RASCUNHO",
    );
  });
});

describe("pendenciaDoEvento", () => {
  it("sem foto: a foto vem primeiro", () => {
    expect(pendenciaDoEvento(false, 0)).toBe("faltam as fotos");
  });
  it("com foto e sem presentes", () => {
    expect(pendenciaDoEvento(true, 0)).toBe("falta a lista de presentes");
  });
  it("tudo pronto", () => {
    expect(pendenciaDoEvento(true, 3)).toBeNull();
  });
});
```

- [ ] **Passo 2: Rodar e ver falhar**

Run: `pnpm exec vitest run lib/painelEstado.test.ts`
Esperado: FAIL — `Failed to resolve import "./painelEstado"`.

- [ ] **Passo 3: Implementar**

```ts
// lib/painelEstado.ts
/**
 * Estado de um evento na home do painel. PURO e testavel: `agora` entra por
 * parametro (a pagina e force-dynamic; nada de Date.now() escondido aqui).
 *
 * Import de TIPO, relativo: o Vitest nao resolve o alias `@/`.
 */
import type { StatusEvento } from "./event";

export type EstadoEvento = "RASCUNHO" | "NO_AR" | "NO_AR_PENDENTE" | "EXPIRADO";

/** Subconjunto do Event necessario para decidir o estado. */
export interface EventoParaEstado {
  status: StatusEvento;
  expiresAt: Date;
}

/**
 * Ordem das perguntas importa:
 *  1. Nunca publicado -> RASCUNHO (mesmo com o prazo vencido: nunca esteve no ar).
 *  2. EXPIRED, ou prazo vencido -> EXPIRADO (mesma regra de `eventoPublico`).
 *  3. Pendencia -> NO_AR_PENDENTE.
 *  4. Caso contrario -> NO_AR.
 */
export function estadoDoEvento(
  ev: EventoParaEstado,
  pendencia: string | null,
  agora: Date,
): EstadoEvento {
  if (ev.status === "DRAFT") return "RASCUNHO";
  if (ev.status === "EXPIRED" || ev.expiresAt.getTime() < agora.getTime()) {
    return "EXPIRADO";
  }
  return pendencia ? "NO_AR_PENDENTE" : "NO_AR";
}

/** O que falta para o site ficar completo. `null` = nada falta. */
export function pendenciaDoEvento(
  temFoto: boolean,
  qtdPresentes: number,
): string | null {
  if (!temFoto) return "faltam as fotos";
  if (qtdPresentes === 0) return "falta a lista de presentes";
  return null;
}
```

- [ ] **Passo 4: Rodar e ver passar**

Run: `pnpm exec vitest run lib/painelEstado.test.ts`
Esperado: PASS, 10 testes.

- [ ] **Passo 5: Commit**

```bash
git add lib/painelEstado.ts lib/painelEstado.test.ts
git commit -m "feat(painel): estado do evento com EXPIRADO de verdade

A tela so testava status === PUBLISHED, entao um evento vencido aparecia como
'Em preparacao' com botao 'Continuar montando'. Expirado tambem e PUBLISHED com
expiresAt no passado — a mesma regra que eventoPublico ja usa no site publico."
```

---

## Tarefa 3: `lib/filtroEventos.ts` — busca, filtro, ordenação

**Files:**
- Create: `lib/filtroEventos.ts`, `lib/filtroEventos.test.ts`

**Interfaces:**
- Consome: `EstadoEvento` (Tarefa 2).
- Produz: `FiltroStatus`, `Ordenacao`, `filtrarEOrdenar(itens, busca, status, ordem)`, consumidos pelas Tarefas 8 e 9.

A lógica sai do componente para ser testável. O componente da Tarefa 8 só liga os controles.

- [ ] **Passo 1: Escrever o teste que falha**

```ts
// lib/filtroEventos.test.ts
import { describe, expect, it } from "vitest";
import { filtrarEOrdenar, type ItemFiltravel } from "./filtroEventos";

const itens: ItemFiltravel[] = [
  { id: "a", titulo: "Casamento Ana", estado: "NO_AR",        criadoEm: new Date("2026-01-01"), dataEvento: new Date("2026-12-01") },
  { id: "b", titulo: "15 Anos Bárbara", estado: "RASCUNHO",   criadoEm: new Date("2026-03-01"), dataEvento: new Date("2026-09-01") },
  { id: "c", titulo: "Bodas Célia", estado: "EXPIRADO",       criadoEm: new Date("2026-02-01"), dataEvento: new Date("2026-05-01") },
  { id: "d", titulo: "Aniversário Duda", estado: "NO_AR_PENDENTE", criadoEm: new Date("2026-04-01"), dataEvento: new Date("2026-10-01") },
];

const ids = (r: ItemFiltravel[]) => r.map((i) => i.id);

describe("filtrarEOrdenar", () => {
  it("sem busca e sem filtro, devolve tudo", () => {
    expect(filtrarEOrdenar(itens, "", "TODOS", "RECENTES")).toHaveLength(4);
  });

  it("busca ignora acento e caixa", () => {
    expect(ids(filtrarEOrdenar(itens, "barbara", "TODOS", "RECENTES"))).toEqual(["b"]);
    expect(ids(filtrarEOrdenar(itens, "ANIVERSARIO", "TODOS", "RECENTES"))).toEqual(["d"]);
  });

  it("filtro NO_AR inclui os que tem pendencia", () => {
    expect(ids(filtrarEOrdenar(itens, "", "NO_AR", "RECENTES")).sort()).toEqual(["a", "d"]);
  });

  it("filtro EXPIRADO", () => {
    expect(ids(filtrarEOrdenar(itens, "", "EXPIRADO", "RECENTES"))).toEqual(["c"]);
  });

  it("ordem RECENTES: criado mais recente primeiro", () => {
    expect(ids(filtrarEOrdenar(itens, "", "TODOS", "RECENTES"))).toEqual(["d", "b", "c", "a"]);
  });

  it("ordem PROXIMOS: data do evento mais proxima primeiro", () => {
    expect(ids(filtrarEOrdenar(itens, "", "TODOS", "PROXIMOS"))).toEqual(["c", "b", "d", "a"]);
  });

  it("ordem ALFABETICA respeita acento do portugues", () => {
    expect(ids(filtrarEOrdenar(itens, "", "TODOS", "ALFABETICA"))).toEqual(["b", "d", "c", "a"]);
  });

  it("nao muta a lista recebida", () => {
    const copia = [...itens];
    filtrarEOrdenar(itens, "", "TODOS", "ALFABETICA");
    expect(itens).toEqual(copia);
  });
});
```

> A ordem alfabética esperada é `"15 Anos Bárbara"`, `"Aniversário Duda"`, `"Bodas Célia"`,
> `"Casamento Ana"` — dígito antes de letra, e `Intl.Collator("pt-BR")` decide o resto.

- [ ] **Passo 2: Rodar e ver falhar**

Run: `pnpm exec vitest run lib/filtroEventos.test.ts`
Esperado: FAIL — `Failed to resolve import "./filtroEventos"`.

- [ ] **Passo 3: Implementar**

```ts
// lib/filtroEventos.ts
/** Busca, filtro e ordenacao da lista de eventos. PURO — o componente so liga os controles. */
import type { EstadoEvento } from "./painelEstado";

export type FiltroStatus = "TODOS" | "NO_AR" | "RASCUNHO" | "EXPIRADO";
export type Ordenacao = "RECENTES" | "PROXIMOS" | "ALFABETICA";

export interface ItemFiltravel {
  id: string;
  titulo: string;
  estado: EstadoEvento;
  criadoEm: Date;
  dataEvento: Date;
}

/** "Aniversário" -> "aniversario". A busca nao pode exigir acento certo. */
function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

const collator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

function casaStatus(estado: EstadoEvento, filtro: FiltroStatus): boolean {
  if (filtro === "TODOS") return true;
  // "No ar" inclui quem esta no ar COM pendencia: o site esta publicado do mesmo jeito.
  if (filtro === "NO_AR") return estado === "NO_AR" || estado === "NO_AR_PENDENTE";
  return estado === filtro;
}

/** Devolve uma lista NOVA; nunca muta a recebida. */
export function filtrarEOrdenar<T extends ItemFiltravel>(
  itens: readonly T[],
  busca: string,
  status: FiltroStatus,
  ordem: Ordenacao,
): T[] {
  const termo = normalizar(busca);
  const filtrados = itens.filter(
    (i) =>
      casaStatus(i.estado, status) &&
      (termo === "" || normalizar(i.titulo).includes(termo)),
  );

  const copia = [...filtrados];
  switch (ordem) {
    case "RECENTES":
      return copia.sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
    case "PROXIMOS":
      return copia.sort((a, b) => a.dataEvento.getTime() - b.dataEvento.getTime());
    case "ALFABETICA":
      return copia.sort((a, b) => collator.compare(a.titulo, b.titulo));
  }
}
```

- [ ] **Passo 4: Rodar e ver passar**

Run: `pnpm exec vitest run lib/filtroEventos.test.ts`
Esperado: PASS, 8 testes.

- [ ] **Passo 5: Commit**

```bash
git add lib/filtroEventos.ts lib/filtroEventos.test.ts
git commit -m "feat(painel): busca, filtro por status e ordenacao (puros)

Logica fora do componente para poder testar. Busca ignora acento; o filtro
'No ar' inclui quem tem pendencia — o site esta publicado do mesmo jeito."
```

---

## Tarefa 4: Tokens da marca

**Files:**
- Modify: `app/globals.css:15` e `app/globals.css:55` (os dois roxos), mais três tokens novos

**Interfaces:**
- Produz: utilitários `bg-violeta`, `text-violeta`, `bg-amarelo`, `text-preto`, `bg-cinza`, consumidos pelas Tarefas 5 a 9.

**A armadilha:** o roxo mora em **dois** lugares. `--color-violeta` (linha 15) gera os
utilitários do Tailwind v4 (`bg-violeta`); `--scv-violet` (linha 55) é lido como
`text-scv-violet`. Trocar só um deixa a tela com dois roxos, e ninguém percebe até olhar de
perto.

- [ ] **Passo 1: Trocar os dois roxos e acrescentar os três tokens**

Na linha 15:

```css
  --color-violeta: #7a40ed; /* roxo da marca (o ".ia" do logo) */
  --color-amarelo: #f5ff63; /* acento — SO como fundo, com tinta preta */
  --color-preto: #19171c;
  --color-cinza: #f2f1f3;
```

Na linha 55:

```css
  --scv-violet: #7a40ed; /* roxo da marca (mesmo hex do --color-violeta) */
```

- [ ] **Passo 2: Provar que não sobrou o roxo velho**

```bash
grep -rn "6d28d9" app/ components/ | grep -v "docs/"
```
Esperado: nenhuma saída. Se aparecer alguma sombra `rgba(109,40,217,...)` (o mesmo roxo em
decimal), troque também — `109,40,217` é `#6d28d9`.

```bash
grep -rn "109, *40, *217" app/ components/
```
Esperado: as ocorrências aparecem em `page.tsx`; a Tarefa 9 as substitui. Anote quais são.

- [ ] **Passo 3: Verificar que o build passa**

```bash
pnpm exec tsc --noEmit && pnpm build
```
Esperado: verde. (Se `pnpm build` falhar com `Type 'Route' does not satisfy the constraint
'LayoutRoutes'`, há um dev server rodando: mate o processo node e `rm -rf .next`.)

- [ ] **Passo 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(painel): adota a paleta da marca (roxo #7A40ED, amarelo, preto)

O roxo vivia em dois tokens (--color-violeta e --scv-violet) e nenhum deles era o
roxo da landing. Nem o roxo era o mesmo roxo."
```

---

## Tarefa 5: `ResumoBlocos` — os três números

**Files:**
- Create: `app/(dashboard)/painel/_ui/ResumoBlocos.tsx`

**Interfaces:**
- Consome: tokens (Tarefa 4).
- Produz: `<ResumoBlocos sites={n} presencas={n} recados={n} />`, consumido pela Tarefa 9.

Três blocos: **sites no ar** em amarelo com tinta preta, **presenças** em cinza, **recados**
em roxo com tinta branca. Com zero eventos os três aparecem **zerados** — não somem. É o que
evita a tela vazia parecer quebrada.

- [ ] **Passo 1: Implementar**

```tsx
// app/(dashboard)/painel/_ui/ResumoBlocos.tsx
/**
 * Tres blocos de resumo. O amarelo #F5FF63 NAO passa contraste com branco:
 * ele so aparece como FUNDO, com tinta preta. Regra, nao sugestao.
 */
const BLOCO =
  "flex flex-col justify-between rounded-[18px] px-5 py-4 min-h-[104px]";

export function ResumoBlocos({
  sites,
  presencas,
  recados,
}: {
  sites: number;
  presencas: number;
  recados: number;
}) {
  return (
    <div className="mt-7 grid gap-4 sm:grid-cols-3">
      <div className={`${BLOCO} bg-amarelo text-preto`}>
        <span className="text-[32px] font-semibold leading-none">{sites}</span>
        <span className="text-[13px] font-medium opacity-80">
          {sites === 1 ? "site no ar" : "sites no ar"}
        </span>
      </div>

      <div className={`${BLOCO} bg-cinza text-preto`}>
        <span className="text-[32px] font-semibold leading-none">{presencas}</span>
        <span className="text-[13px] font-medium opacity-70">
          {presencas === 1 ? "presença confirmada" : "presenças confirmadas"}
        </span>
      </div>

      <div className={`${BLOCO} bg-violeta text-white`}>
        <span className="text-[32px] font-semibold leading-none">{recados}</span>
        <span className="text-[13px] font-medium opacity-85">
          {recados === 1 ? "recado recebido" : "recados recebidos"}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Passo 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Esperado: sem erros.

- [ ] **Passo 3: Commit**

```bash
git add "app/(dashboard)/painel/_ui/ResumoBlocos.tsx"
git commit -m "feat(painel): blocos de resumo na paleta da marca"
```

---

## Tarefa 6: `CardEvento` — um componente, quatro estados

**Files:**
- Create: `app/(dashboard)/painel/_ui/CardEvento.tsx`

**Interfaces:**
- Consome: `EstadoEvento` (Tarefa 2), `frasePresencas` (Tarefa 1), `CapaEvento` (existente).
- Produz: `<CardEvento ... />`, consumido pela Tarefa 9.

O selo **não pode depender só de cor**: cada estado leva um ponto/forma própria além do
texto. O card expirado fica dessaturado.

- [ ] **Passo 1: Implementar**

```tsx
// app/(dashboard)/painel/_ui/CardEvento.tsx
import Link from "next/link";
import { CapaEvento } from "./CapaEvento";
import { frasePresencas } from "@/lib/frases";
import type { EstadoEvento } from "@/lib/painelEstado";

const DATA_CURTA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Selo por estado. Cor E forma — nunca so cor. */
const SELO: Record<EstadoEvento, { texto: string; classe: string; ponto: string }> = {
  RASCUNHO: { texto: "Em preparação", classe: "bg-white/95 text-[#B45309]", ponto: "bg-amber-500" },
  NO_AR: { texto: "No ar", classe: "bg-amarelo text-preto", ponto: "bg-preto" },
  NO_AR_PENDENTE: { texto: "No ar", classe: "bg-amarelo text-preto", ponto: "bg-preto" },
  EXPIRADO: { texto: "Expirado", classe: "bg-white/95 text-scv-muted", ponto: "bg-scv-faint" },
};

export function CardEvento({
  id,
  estado,
  titulo,
  nicho,
  kicker,
  dataEvento,
  expiraEm,
  presencas,
  pendencia,
  tema,
  fontes,
  fotoUrl,
}: {
  id: string;
  estado: EstadoEvento;
  titulo: string;
  nicho: string;
  kicker: string;
  dataEvento: Date;
  expiraEm: Date;
  presencas: number;
  pendencia: string | null;
  tema: string;
  fontes: string;
  fotoUrl?: string;
}) {
  const selo = SELO[estado];
  const expirado = estado === "EXPIRADO";
  const rascunho = estado === "RASCUNHO";

  const linha = rascunho
    ? "Continue de onde parou — falta pouco"
    : expirado
      ? `Este site saiu do ar em ${DATA_CURTA.format(expiraEm)}`
      : pendencia
        ? `${frasePresencas(presencas)} · ${pendencia}`
        : frasePresencas(presencas);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[20px] border border-scv-line bg-scv-card shadow-[0_16px_40px_-32px_rgba(15,23,42,0.12)] ${
        expirado ? "opacity-75 saturate-[0.35]" : ""
      }`}
    >
      <CapaEvento tema={tema} fontes={fontes} nome={titulo} kicker={kicker} fotoUrl={fotoUrl} altura={140}>
        <span
          className={`absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${selo.classe}`}
        >
          <span aria-hidden className={`size-[6px] rounded-full ${selo.ponto}`} />
          {selo.texto}
        </span>
      </CapaEvento>

      <div className="flex flex-1 flex-col gap-3 p-4 pb-[18px]">
        <div>
          <div className="text-[13px] font-semibold text-scv-ink">
            {nicho} · {DATA_CURTA.format(dataEvento)}
          </div>
          <div className="mt-1.5 text-[12.5px] leading-snug text-scv-muted">{linha}</div>
        </div>

        <Link
          href={rascunho ? `/painel/${id}/publicar` : `/painel/${id}`}
          className={`mt-auto w-full rounded-[11px] py-2.5 text-center text-[13.5px] font-semibold transition ${
            rascunho
              ? "bg-violeta text-white hover:brightness-110"
              : "border border-scv-line bg-scv-card text-scv-ink hover:border-scv-dash"
          }`}
        >
          {rascunho ? "Continuar montando" : "Ver e editar"}
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Passo 2: Typecheck e commit**

```bash
pnpm exec tsc --noEmit
git add "app/(dashboard)/painel/_ui/CardEvento.tsx"
git commit -m "feat(painel): card do evento com os quatro estados

Inclui EXPIRADO, que a tela nao tinha. Selo distingue por cor E forma."
```

---

## Tarefa 7: `EstadoVazio`

**Files:**
- Create: `app/(dashboard)/painel/_ui/EstadoVazio.tsx`

**Interfaces:**
- Produz: `<EstadoVazio />`, consumido pela Tarefa 9.

- [ ] **Passo 1: Implementar**

```tsx
// app/(dashboard)/painel/_ui/EstadoVazio.tsx
import Link from "next/link";

const PASSOS = ["Tema", "Informações", "Lista", "Convite"] as const;

export function EstadoVazio() {
  return (
    <div className="mt-8 rounded-[24px] border border-scv-line bg-scv-card px-6 py-16 text-center">
      <h2 className="font-display text-[26px] font-semibold tracking-tight text-scv-ink">
        Seu primeiro site de evento está a 4 passos daqui.
      </h2>
      <p className="mx-auto mt-3 max-w-[420px] text-[14px] leading-relaxed text-scv-muted">
        Escolha um tema, adicione os detalhes e convide seus convidados. É simples,
        rápido e encantador.
      </p>

      <Link
        href="/painel/novo"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-violeta px-6 py-3 text-[14px] font-semibold text-white transition hover:brightness-110"
      >
        Criar meu primeiro evento
      </Link>

      <ol className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {PASSOS.map((passo, i) => (
          <li key={passo} className="flex items-center gap-2 text-[12px] text-scv-muted">
            <span className="grid size-[22px] place-items-center rounded-full bg-cinza text-[11px] font-semibold text-preto">
              {i + 1}
            </span>
            {passo}
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Passo 2: Typecheck e commit**

```bash
pnpm exec tsc --noEmit
git add "app/(dashboard)/painel/_ui/EstadoVazio.tsx"
git commit -m "feat(painel): estado vazio convida em vez de parecer quebrado"
```

---

## Tarefa 8: `FiltroEventos` — os controles (client)

**Files:**
- Create: `app/(dashboard)/painel/_ui/FiltroEventos.tsx`

**Interfaces:**
- Consome: `filtrarEOrdenar`, `FiltroStatus`, `Ordenacao`, `ItemFiltravel` (Tarefa 3).
- Produz: `<FiltroEventos itens={...}>{(visiveis) => ...}</FiltroEventos>` — um *render prop*
  que devolve a lista já filtrada. A Tarefa 9 desenha os cards dentro dele.

O componente **só liga os controles**; a lógica está na Tarefa 3 e é testada lá.

Filtra no cliente, sobre a lista já carregada. Não há query nova: a página é `force-dynamic`
e já traz todos os eventos do profissional. Paginação no servidor seria resolver um problema
que ninguém tem.

- [ ] **Passo 1: Implementar**

```tsx
// app/(dashboard)/painel/_ui/FiltroEventos.tsx
"use client";
import { useMemo, useState, type ReactNode } from "react";
import {
  filtrarEOrdenar,
  type FiltroStatus,
  type ItemFiltravel,
  type Ordenacao,
} from "@/lib/filtroEventos";

const STATUS: { valor: FiltroStatus; rotulo: string }[] = [
  { valor: "TODOS", rotulo: "Todos" },
  { valor: "NO_AR", rotulo: "No ar" },
  { valor: "RASCUNHO", rotulo: "Em preparação" },
  { valor: "EXPIRADO", rotulo: "Expirado" },
];

const ORDENS: { valor: Ordenacao; rotulo: string }[] = [
  { valor: "RECENTES", rotulo: "Mais recentes" },
  { valor: "PROXIMOS", rotulo: "Data do evento" },
  { valor: "ALFABETICA", rotulo: "Ordem alfabética" },
];

export function FiltroEventos<T extends ItemFiltravel>({
  itens,
  children,
}: {
  itens: T[];
  children: (visiveis: T[]) => ReactNode;
}) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<FiltroStatus>("TODOS");
  const [ordem, setOrdem] = useState<Ordenacao>("RECENTES");

  const visiveis = useMemo(
    () => filtrarEOrdenar(itens, busca, status, ordem),
    [itens, busca, status, ordem],
  );

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar evento…"
          aria-label="Buscar evento pelo nome"
          className="min-w-[220px] flex-1 rounded-full border border-scv-line bg-scv-field px-4 py-2.5 text-[13.5px] text-scv-ink outline-none transition focus-visible:border-violeta"
        />

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por status">
          {STATUS.map((s) => (
            <button
              key={s.valor}
              type="button"
              onClick={() => setStatus(s.valor)}
              aria-pressed={status === s.valor}
              className={`rounded-full px-3.5 py-2 text-[12.5px] font-medium transition ${
                status === s.valor
                  ? "bg-preto text-white"
                  : "bg-scv-soft text-scv-muted hover:text-scv-ink"
              }`}
            >
              {s.rotulo}
            </button>
          ))}
        </div>

        <select
          value={ordem}
          onChange={(e) => setOrdem(e.target.value as Ordenacao)}
          aria-label="Ordenar eventos"
          className="rounded-full border border-scv-line bg-scv-card px-3.5 py-2.5 text-[12.5px] text-scv-ink"
        >
          {ORDENS.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      </div>

      {visiveis.length === 0 ? (
        <p className="mt-10 text-center text-[14px] text-scv-muted">
          Nenhum evento encontrado com esses filtros.
        </p>
      ) : (
        children(visiveis)
      )}
    </>
  );
}
```

- [ ] **Passo 2: Typecheck e commit**

```bash
pnpm exec tsc --noEmit
git add "app/(dashboard)/painel/_ui/FiltroEventos.tsx"
git commit -m "feat(painel): controles de busca, status e ordenacao

Filtra no cliente sobre a lista ja carregada. Sem query nova."
```

---

## Tarefa 9: Recompor a `page.tsx`

**Files:**
- Modify: `app/(dashboard)/painel/page.tsx` (reescrita)

**Interfaces:**
- Consome: tudo das Tarefas 1 a 8, mais `limiteEventos` de `lib/plans.ts`.

- [ ] **Passo 1: Reescrever a página**

```tsx
// app/(dashboard)/painel/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { lerTemaKey } from "@/lib/temas";
import { lerFonteKey } from "@/lib/fontes";
import { textosDoNicho } from "@/lib/textos";
import { TIPO_LABEL } from "@/lib/painelUi";
import { limiteEventos } from "@/lib/plans";
import { fraseResumo } from "@/lib/frases";
import { estadoDoEvento, pendenciaDoEvento } from "@/lib/painelEstado";
import { COLUNA, TITULO } from "./_ui/estilos";
import { ResumoBlocos } from "./_ui/ResumoBlocos";
import { CardEvento } from "./_ui/CardEvento";
import { EstadoVazio } from "./_ui/EstadoVazio";
import { FiltroEventos } from "./_ui/FiltroEventos";

export const dynamic = "force-dynamic";

function lerCustomStr(c: unknown, k: string): string | undefined {
  if (c && typeof c === "object" && k in c) {
    const v = (c as Record<string, unknown>)[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

export default async function MeusEventosPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const [prof, events] = await Promise.all([
    prisma.professional.findUnique({
      where: { id: session.user.id },
      select: { name: true, plan: true },
    }),
    prisma.event.findMany({
      where: { professionalId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            guests: { where: { status: "CONFIRMED" } },
            recados: true,
            gifts: true,
            photos: true,
          },
        },
      },
    }),
  ]);

  const agora = new Date();
  const primeiro = (prof?.name ?? "").split(" ")[0] || "você";

  // Um unico passe: deriva estado e pendencia de cada evento.
  const itens = events.map((e) => {
    const fotoUrl = lerCustomStr(e.customization, "fotoUrl");
    const pendencia = pendenciaDoEvento(Boolean(fotoUrl), e._count.gifts);
    return {
      id: e.id,
      titulo: e.title,
      estado: estadoDoEvento(e, pendencia, agora),
      criadoEm: e.createdAt,
      dataEvento: e.eventDate,
      expiraEm: e.expiresAt,
      presencas: e._count.guests,
      pendencia,
      nicho: TIPO_LABEL[e.type] ?? e.type,
      kicker: textosDoNicho(e.type).conviteTitulo,
      tema: lerTemaKey(e.customization),
      fontes: lerFonteKey(e.customization),
      fotoUrl,
    };
  });

  // "No ar" conta quem esta publicado E dentro do prazo — nao `status === PUBLISHED`.
  const noAr = itens.filter(
    (i) => i.estado === "NO_AR" || i.estado === "NO_AR_PENDENTE",
  ).length;
  const presencas = itens.reduce((a, i) => a + i.presencas, 0);
  const recados = events.reduce((a, e) => a + e._count.recados, 0);

  const limite = limiteEventos(prof?.plan ?? "BASICO");
  const noLimite = limite !== null && events.length >= limite;

  return (
    <div className={`${COLUNA} scv-fade py-11 pb-20 ${EVT_FONTS_CLASS}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={`${TITULO} text-[34px]`}>Olá, {primeiro}</h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-scv-muted">
            {events.length === 0
              ? "Sua jornada para o evento perfeito começa aqui."
              : fraseResumo(noAr, presencas, recados)}
          </p>
        </div>

        {events.length > 0 && !noLimite && (
          <Link
            href="/painel/novo"
            className="rounded-full bg-preto px-5 py-3 text-[13.5px] font-semibold text-white transition hover:brightness-125"
          >
            + Criar novo evento
          </Link>
        )}
      </div>

      <ResumoBlocos sites={noAr} presencas={presencas} recados={recados} />

      {events.length === 0 ? (
        <EstadoVazio />
      ) : (
        <>
          {noLimite && (
            <div className="mt-6 rounded-[16px] border border-scv-line bg-cinza px-5 py-4 text-[13.5px] text-preto">
              Você chegou ao limite de {limite} eventos do seu plano.{" "}
              <Link href="/painel/plano" className="font-semibold underline underline-offset-2">
                Ver planos
              </Link>{" "}
              para criar mais.
            </div>
          )}

          <FiltroEventos itens={itens}>
            {(visiveis) => (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visiveis.map((i) => (
                  <CardEvento key={i.id} {...i} />
                ))}
              </div>
            )}
          </FiltroEventos>
        </>
      )}
    </div>
  );
}
```

- [ ] **Passo 2: A contagem de "sites no ar" mudou de propósito**

Antes: `events.filter(e => e.status === "PUBLISHED").length`. Agora conta os estados
`NO_AR` e `NO_AR_PENDENTE` — ou seja, **um evento vencido deixa de ser contado como no ar**.
Isso corrige o número, que hoje mente.

- [ ] **Passo 3: Typecheck, testes, build**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm build
```
Esperado: 24 arquivos de teste passando, `tsc` limpo, build verde.

- [ ] **Passo 4: Commit**

```bash
git add "app/(dashboard)/painel/page.tsx"
git commit -m "feat(painel)!: recompoe a home com os quatro estados e filtros

'Sites no ar' passa a contar NO_AR + NO_AR_PENDENTE: um evento vencido deixa de
ser contado como no ar. Comunica o limite de 3 eventos do plano Basico."
```

---

## Tarefa 10: Verificar na tela real

**Files:** nenhum.

Testes puros não provam layout. Esta tarefa existe porque **o dono decide vendo**.

- [ ] **Passo 1: Semear os quatro estados no banco de dev**

Sem isso a tela só mostra um estado e a verificação não vale nada.

```bash
docker start sc-postgres
```

```bash
docker exec sc-postgres psql -U postgres -d seuconviteia -c "
INSERT INTO \"Event\" (id,\"professionalId\",type,subdomain,title,\"eventDate\",\"expiresAt\",status,plan,\"createdAt\",\"updatedAt\")
SELECT 'ev-rascunho', p.id,'CASAMENTO','ana-e-bruno','Ana & Bruno', now()+interval '90 days', now()+interval '120 days','DRAFT','BASICO',now(),now() FROM \"Professional\" p WHERE p.email='demo@seuconviteia.com'
ON CONFLICT (id) DO NOTHING;
INSERT INTO \"Event\" (id,\"professionalId\",type,subdomain,title,\"eventDate\",\"expiresAt\",status,plan,\"createdAt\",\"updatedAt\")
SELECT 'ev-expirado', p.id,'ANIVERSARIO','theo-1-ano','Theo · 1 ano', now()-interval '60 days', now()-interval '30 days','PUBLISHED','BASICO',now(),now() FROM \"Professional\" p WHERE p.email='demo@seuconviteia.com'
ON CONFLICT (id) DO NOTHING;"
```

O `ev-expirado` é `PUBLISHED` com `expiresAt` no passado **de propósito**: é o caso que a
tela antiga renderizava como "Em preparação".

- [ ] **Passo 2: Subir o dev e capturar a tela autenticada**

```bash
pnpm dev
```

O driver CDP do scratchpad injeta o cookie do Auth.js e fotografa a página logada:

```bash
node shot.mjs "http://app.localhost:3000/painel" "painel-novo.png" "$TOKEN" 1440 900
```

(`$TOKEN` sai de um login por `curl` em `/api/auth/callback/credentials` com
`demo@seuconviteia.com` / `demo12345`.)

Esperado na imagem: três blocos coloridos, os controles de filtro, e três cards — um
`Em preparação`, um `No ar`, um `Expirado` (dessaturado).

- [ ] **Passo 3: Rodar o detector de anti-padrões**

```bash
npx impeccable detect "app/(dashboard)/painel/"
```
Esperado: `0 anti-patterns found`. A landing em produção acusa 6 hoje; o painel novo não
deve acrescentar nenhum.

- [ ] **Passo 4: Conferir o filtro e o vazio, no navegador**

- Buscar por `theo` (sem acento) encontra `Theo · 1 ano`.
- Filtrar por `Expirado` mostra só um card.
- Filtrar por `No ar` mostra os publicados dentro do prazo.
- Apagar os dois eventos semeados **e** o `maria-clara` para ver o estado vazio; depois
  `pnpm db:seed` restaura.

- [ ] **Passo 5: Mostrar ao dono e esperar o "pode subir"**

Nada vai para a `master` sem aprovação visual.

- [ ] **Passo 6: Limpar o banco de dev**

```bash
docker exec sc-postgres psql -U postgres -d seuconviteia -c "DELETE FROM \"Event\" WHERE id IN ('ev-rascunho','ev-expirado');"
```

---

## Fora deste plano

- **Nomes e regras dos planos.** "Básico" permite 3 eventos; "Convite único" da landing,
  pelo nome, permite 1. É divergência de regra, não de rótulo. Precisa de decisão do dono.
- **Contraste da landing.** `app/globals.css:275` põe iniciais brancas sobre um gradiente que
  termina em `#d0bafe` — 1,7:1, reprovado em WCAG AA. Defeito real, commit separado.
- **Paginação no servidor**, se algum dia alguém tiver centenas de eventos.
