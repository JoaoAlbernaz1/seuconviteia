# Editor: programação, negrito, presentes e textos do mural — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No editor guiado (`/painel/criar`), o cliente liga/desliga a programação, escolhe letra em negrito, organiza a lista de presentes (com reordenar) e edita os textos do mural de recados — tudo refletindo na prévia ao vivo e no site publicado.

**Architecture:** Quatro entregas independentes sobre o mesmo trilho já existente: estado local em `CriarConvite.tsx` → `montarRascunho()` → `/preview-evento` (iframe) → `lib/previewEvento.ts` → componentes do template. A persistência segue o caminho de `criar/acoes.ts` → `customization`. Nada de encanamento novo: `recursosOff` (toggles), classe no wrapper `.evt` (negrito, igual a `evt-fonte-caps`) e `lib/secoes.ts` (copy externalizada) já existem e são genéricos.

**Tech Stack:** Next 16 (App Router, client component), React 19, TypeScript strict, Tailwind v4, Zod, Vitest, Prisma 6 (MySQL `sc-mysql`), pnpm.

## Global Constraints

- **Eventos existentes não podem mudar de aparência.** Todo campo novo é opcional com default igual ao comportamento de hoje: `programacao` ligada, `negrito` desligado, textos do mural iguais aos chumbados.
- **JSON limpo:** só o que foge do default entra no `customization` (padrão de `togglesParaCustomization`).
- **Nada de peso falso:** proibido `font-synthesis` para simular negrito. Onde a fonte não tem peso forte, avisar.
- **Copy em pt-BR**, com acento, no tom do editor ("Deixa os títulos e os textos com o traço mais forte").
- **Não commitar sem o João ver na tela** (preferência registrada do dono). Cada task termina em "mostrar", e o commit vem depois do "pode".
- Verificação de cada task: `./node_modules/.bin/tsc --noEmit`, `./node_modules/.bin/eslint .`, `pnpm test --run`.

---

### Task 1: Programação liga/desliga

**Files:**
- Modify: `app/(dashboard)/painel/criar/CriarConvite.tsx` (State + INICIAL + `montarRascunho` + `estruturalDoEditor` + acordeão `a.kind === "programacao"`)
- Modify: `app/(dashboard)/painel/criar/acoes.ts` (schema do payload + gravação do toggle)
- Test: `lib/previewEvento.test.ts`

**Interfaces:**
- Consumes: `RecursoSite` de `lib/recursos.ts` (já inclui `"programacao"`), `Toggle` local do `CriarConvite.tsx`.
- Produces: campo `prog: boolean` no `State` do editor; string `"programacao"` dentro de `recursosOff` no rascunho.

- [ ] **Step 1: Escrever o teste que falha**

Em `lib/previewEvento.test.ts`, junto dos testes de `recursosOff`:

```ts
it("recursosOff com programacao -> toggle desligado no evento do preview", () => {
  const r = eventoDoRascunho(
    lerRascunho(JSON.stringify({ type: "QUINZE_ANOS", title: "Maria", recursosOff: ["programacao"] })),
  );
  expect(r.recursos.programacao).toBe(false);
});

it("sem recursosOff -> programacao ligada (default)", () => {
  const r = eventoDoRascunho(lerRascunho(JSON.stringify({ type: "QUINZE_ANOS", title: "Maria" })));
  expect(r.recursos.programacao).toBe(true);
});
```

> Exports reais de `lib/previewEvento.ts`: `lerRascunho(s: string | undefined): RascunhoPreview`,
> `eventoDoRascunho(r: RascunhoPreview): EventoParaConteudo`, `rascunhoDoEvento(event)`. Conferir no
> arquivo como `recursos` sai de `eventoDoRascunho` (nome do campo) antes de fixar o assert.

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run lib/previewEvento.test.ts`
Expected: FAIL — hoje `recursosOff` nunca recebe `"programacao"` vindo do editor, mas a conversão é genérica; se já passar, registrar que a camada de preview está pronta e seguir (o teste vira regressão).

- [ ] **Step 3: Estado + toggle no editor**

Em `CriarConvite.tsx`:

```ts
// type State — junto de `programacao: ItemProgramacao[];`
prog: boolean;
```
```ts
// const INICIAL — junto de `programacao: programacaoSugerida("QUINZE_ANOS"),`
prog: true,
```

No acordeão, trocar o cabeçalho de `a.kind === "programacao"` para incluir o toggle e recolher a lista quando desligado:

```tsx
{a.kind === "programacao" && (
  <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] font-semibold">Mostrar a programação no convite</span>
      <Toggle on={S.prog} onClick={() => upd({ prog: !S.prog })} />
    </div>
    {S.prog && (
      <>
        {/* … o conteúdo atual do acordeão, sem alteração … */}
      </>
    )}
  </div>
)}
```

- [ ] **Step 4: Ligar no rascunho e no reload da prévia**

Em `montarRascunho()`, dentro de `recursosOff`:

```ts
!S.prog ? "programacao" : null,
```

Em `estruturalDoEditor()`, junto de `S.gal, S.rec,`:

```ts
S.prog,
```

- [ ] **Step 5: Persistir**

Em `criar/acoes.ts`, onde o schema aceita os toggles do payload, aceitar `programacao` como recurso desligável e gravar via o mesmo caminho de `rsvp/presentes/galeria/recados` (`togglesParaCustomization`). Ler o arquivo antes: o formato exato do campo (`recursosOff: z.array(...)` ou flags soltas) manda.

- [ ] **Step 6: Rodar tudo**

Run: `./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/eslint . && pnpm test --run`
Expected: verde.

- [ ] **Step 7: Mostrar**

Com `pnpm dev` no ar: abrir `http://app.localhost:3000` → editor → passo Conteúdo → acordeão Programação. Desligar e confirmar que a seção some da prévia; ligar e confirmar que volta. Mostrar ao João **antes** de commitar.

---

### Task 2: Letra em negrito

**Files:**
- Modify: `app/globals.css` (regra `.evt.evt-negrito`, perto de `.evt.evt-fonte-caps` na linha ~807)
- Modify: `lib/fontes.ts` (`fonteTemNegritoNoNome`)
- Modify: `lib/eventoFesta.ts` (tipo + zod + default de `negrito`)
- Modify: `lib/previewEvento.ts` (schema + serialize + deserialize)
- Modify: `app/_sites/[sub]/layout.tsx` e `app/(dashboard)/preview-evento/page.tsx` (classe no wrapper)
- Modify: `app/(dashboard)/painel/criar/CriarConvite.tsx` (State, INICIAL, UI, rascunho, estrutural)
- Modify: `app/(dashboard)/painel/criar/acoes.ts` (persistência)
- Test: `lib/fontes.test.ts`

**Interfaces:**
- Consumes: `FONTES` e `fonteDupla()` de `lib/fontes.ts`; padrão de flag booleana no `customization` idêntico a `animacoes` (`lib/eventoFesta.ts:78,117,239`).
- Produces: `export function fonteTemNegritoNoNome(key?: string | null, custom?: FontesCustom | null): boolean`; campo `negrito: boolean` em `EventoFesta` e no rascunho do preview; classe CSS `evt-negrito`.

- [ ] **Step 1: Escrever o teste que falha**

Em `lib/fontes.test.ts`:

```ts
import { fonteTemNegritoNoNome } from "./fontes";

describe("fonteTemNegritoNoNome", () => {
  it("dupla de letra manuscrita não tem negrito no nome da capa", () => {
    expect(fonteTemNegritoNoNome("romantica")).toBe(false);
  });

  it("dupla de versal/serifada tem negrito no nome da capa", () => {
    expect(fonteTemNegritoNoNome("moderna")).toBe(true);
  });

  it("chave desconhecida cai no default (classica)", () => {
    expect(fonteTemNegritoNoNome("nao-existe")).toBe(fonteTemNegritoNoNome("classica"));
  });
});
```

> Antes de fixar `"romantica"`/`"moderna"` nos asserts, conferir em `lib/fontes.ts` qual fonte cada dupla usa no slot `--ev-font-script` e em `app/evt-fonts.ts` quais pesos ela carrega. O assert tem que refletir o que o Google publica, não um chute.

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run lib/fontes.test.ts`
Expected: FAIL — `fonteTemNegritoNoNome is not a function`.

- [ ] **Step 3: Implementar a consulta de peso**

Em `lib/fontes.ts`, marcar as duplas cuja script não tem peso forte e expor a consulta:

```ts
/**
 * A fonte do NOME (slot script) tem peso forte publicado? As manuscritas
 * (Dancing Script, Great Vibes, Pacifico, Allura, Parisienne, Sacramento) e as
 * locais só existem no traço fino — nelas o negrito não se aplica ao nome.
 */
export function fonteTemNegritoNoNome(key?: string | null, custom?: FontesCustom | null): boolean {
  if (customValido(custom ?? undefined)) return !!FONTE_HEADS[custom!.head].negritoNoNome;
  return !!fonteDupla(key).negritoNoNome;
}
```

Adicionar `negritoNoNome?: boolean` em `FonteDupla` (e no tipo dos `FONTE_HEADS`) e marcá-lo `true` só nas duplas cuja script carrega 600 em `app/evt-fonts.ts`.

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm exec vitest run lib/fontes.test.ts`
Expected: PASS.

- [ ] **Step 5: CSS do negrito**

Em `app/globals.css`, logo abaixo do bloco `.evt.evt-fonte-caps` (~linha 807):

```css
/* Letra em negrito (opção do editor): engrossa títulos, corpo e utilitários.
   O slot script (nome da capa) fica de fora — nas manuscritas não existe peso
   forte publicado, e sintetizar deixa o traço sujo. */
.evt.evt-negrito .font-evt-display,
.evt.evt-negrito .font-evt-body,
.evt.evt-negrito .font-evt-util {
  font-weight: 600;
}
.evt.evt-negrito.evt-negrito-nome .font-evt-script {
  font-weight: 600;
}
```

- [ ] **Step 6: Flag ponta a ponta (copiar o caminho de `animacoes`)**

1. `lib/eventoFesta.ts`: `negrito: boolean` no tipo (perto da linha 78), no zod dos extras (117) e default `extras.negrito ?? false` (239).
2. `lib/previewEvento.ts`: `negrito: z.boolean()` no schema (perto de 69), serialize (182) e deserialize (254).
3. `app/_sites/[sub]/layout.tsx` e `app/(dashboard)/preview-evento/page.tsx`: montar a classe junto de `fonteCaps` —

```ts
const neg = dados.negrito
  ? ` evt-negrito${fonteTemNegritoNoNome(fonteKey, fontesCustom) ? " evt-negrito-nome" : ""}`
  : "";
```
e concatenar `${neg}` no `className` do wrapper `.evt`.

- [ ] **Step 7: Controle no editor**

`CriarConvite.tsx`: `negrito: boolean` no `State`, `negrito: false` no `INICIAL`, `negrito: S.negrito` em `montarRascunho()`, `S.negrito` em `estruturalDoEditor()`. No passo 1, depois do bloco `data-foco="livre"` das "Letras do convite", um card no molde do "Escurecer a foto da capa":

```tsx
<div className="my-5 h-px bg-[#F0F0F3]" />
<div data-foco="livre" className="flex items-center justify-between rounded-xl border border-[#ECECF0] bg-[#F4F4F6] px-4 py-3">
  <div>
    <div className="text-[13px] font-semibold">Letra em negrito</div>
    <div className="text-[12px] text-[#6e6e76]">
      Deixa os títulos e os textos do convite com o traço mais forte.
      {!fonteTemNegritoNoNome(S.fonte) && " A letra escolhida não tem negrito no nome da capa."}
    </div>
  </div>
  <Toggle on={S.negrito} onClick={() => upd({ negrito: !S.negrito })} />
</div>
```

- [ ] **Step 8: Persistir**

Em `criar/acoes.ts`: `negrito: z.boolean().optional()` no schema (junto de `animacoes`, linha ~80) e `negrito: d.negrito` na gravação (~266).

- [ ] **Step 9: Rodar tudo**

Run: `./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/eslint . && pnpm test --run`
Expected: verde.

- [ ] **Step 10: Mostrar**

Ligar o negrito no editor com a dupla **clássica** (default) e com uma **manuscrita**; conferir na prévia que títulos/corpo engrossam nas duas e que o aviso aparece na manuscrita. Mostrar ao João antes de commitar.

---

### Task 3: Presentes — três caixas, reordenar e campos que salvam

**Files:**
- Create: `lib/presentesOrdem.ts`
- Create: `lib/presentesOrdem.test.ts`
- Modify: `app/(dashboard)/painel/criar/CriarConvite.tsx` (bloco `S.step === 4`, linhas ~1521-1763; State + INICIAL + `montarRascunho` + `estruturalDoEditor`)
- Modify: `app/(dashboard)/painel/criar/acoes.ts` (campos do valor livre)
- Modify: `lib/previewEvento.ts` (campos do valor livre no schema)

**Interfaces:**
- Consumes: `GiftRow` (já definido no topo de `CriarConvite.tsx`).
- Produces: `export function moverItem<T>(lista: T[], de: number, para: number): T[]`; campos `freeTitulo: string` e `freeValores: string` no `State` e no rascunho.

- [ ] **Step 1: Escrever o teste que falha**

`lib/presentesOrdem.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { moverItem } from "./presentesOrdem";

describe("moverItem", () => {
  it("sobe um item uma posição", () => {
    expect(moverItem(["a", "b", "c"], 1, 0)).toEqual(["b", "a", "c"]);
  });

  it("desce um item uma posição", () => {
    expect(moverItem(["a", "b", "c"], 1, 2)).toEqual(["a", "c", "b"]);
  });

  it("índice fora da lista devolve a lista intacta", () => {
    expect(moverItem(["a", "b"], 0, 5)).toEqual(["a", "b"]);
    expect(moverItem(["a", "b"], -1, 0)).toEqual(["a", "b"]);
  });

  it("não perde nem duplica itens", () => {
    const fora = moverItem(["a", "b", "c", "d"], 3, 1);
    expect([...fora].sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("não muta a lista original", () => {
    const orig = ["a", "b"];
    moverItem(orig, 0, 1);
    expect(orig).toEqual(["a", "b"]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run lib/presentesOrdem.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

`lib/presentesOrdem.ts`:

```ts
/**
 * Move um item de posição numa lista (usado pelas setas ↑ ↓ da lista de
 * presentes do editor). PURO: devolve uma lista nova, nunca muta a original.
 * Índice fora da faixa = lista intacta (a UI já esconde a seta das pontas,
 * isto é a rede de segurança).
 */
export function moverItem<T>(lista: T[], de: number, para: number): T[] {
  if (de < 0 || para < 0 || de >= lista.length || para >= lista.length || de === para) {
    return [...lista];
  }
  const out = [...lista];
  const [item] = out.splice(de, 1);
  out.splice(para, 0, item);
  return out;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm exec vitest run lib/presentesOrdem.test.ts`
Expected: PASS.

- [ ] **Step 5: Quebrar o passo 4 em três caixas**

Reescrever o bloco `{S.step === 4 && (…)}`. O liga/desliga geral sobe para um cabeçalho fora das caixas; o resto vira três `<div className={cardCls}>` com título próprio, **sem mudar nenhum campo de lugar dentro do seu grupo**:

```tsx
{S.step === 4 && (
  <>
    <div className={cardCls}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[18px] font-bold tracking-[-0.02em]">Presentes e Pix</div>
          <div className="mt-1.5 text-[13.5px] text-[#6e6e76]">Sua lista de presentes e onde o dinheiro cai.</div>
        </div>
        <Toggle on={S.gifts} onClick={() => upd({ gifts: !S.gifts })} size="lg" />
      </div>
    </div>
    {S.gifts && (
      <>
        <div className={cardCls}>
          <div className="mb-4 text-[15.5px] font-bold">Como a lista aparece</div>
          {/* Modelo da lista (Painel/Vitrine, com o cadeado de plano) + Texto de apresentação — código atual, sem mudança */}
        </div>
        <div className={cardCls}>
          <div className="mb-4 text-[15.5px] font-bold">Seus presentes</div>
          {/* Adicionar rápido + lista (com as setas do Step 6) + "Adicionar presente em branco" */}
        </div>
        <div className={cardCls}>
          <div className="mb-4 text-[15.5px] font-bold">Dinheiro</div>
          {/* Contribuição com valor livre + "Onde cai o dinheiro" — código atual */}
        </div>
      </>
    )}
  </>
)}
```

- [ ] **Step 6: Setas de ordenar em cada presente**

No cabeçalho de cada linha de presente (onde hoje fica o número `{i + 1}`), ao lado do índice:

```tsx
<div className="flex flex-none flex-col">
  <button
    type="button"
    aria-label="Subir presente"
    disabled={i === 0}
    onClick={() => upd({ giftList: moverItem(S.giftList, i, i - 1) })}
    className="cursor-pointer px-1 text-[11px] leading-none text-[#A6A6AE] hover:text-[#7C3AED] disabled:cursor-default disabled:opacity-30"
  >
    ▲
  </button>
  <button
    type="button"
    aria-label="Descer presente"
    disabled={i === S.giftList.length - 1}
    onClick={() => upd({ giftList: moverItem(S.giftList, i, i + 1) })}
    className="cursor-pointer px-1 text-[11px] leading-none text-[#A6A6AE] hover:text-[#7C3AED] disabled:cursor-default disabled:opacity-30"
  >
    ▼
  </button>
</div>
```

Importar `moverItem` de `@/lib/presentesOrdem`. A `key={i}` do `.map` passa a atrapalhar ao reordenar (React reaproveita o input errado) — trocar por uma chave estável derivada da linha, p.ex. `key={`${i}-${g.n}`}` só se a lista não tiver nomes repetidos; caso contrário, adicionar um `id` gerado ao criar a linha. Decidir lendo o código e deixar comentado o porquê.

- [ ] **Step 7: Campos mortos do valor livre**

No `State`: `freeTitulo: string; freeValores: string;`. No `INICIAL`: `freeTitulo: "Contribua com o valor que desejar", freeValores: "R$ 50 · R$ 100 · R$ 200",`. Trocar os dois `defaultValue` por `value`/`onChange`:

```tsx
<input value={S.freeTitulo} onChange={inp("freeTitulo")} … />
<input value={S.freeValores} onChange={inp("freeValores")} … />
```

Levar ao rascunho (`montarRascunho`: `freeTitulo`/`freeValores` só quando `S.gifts && S.free`), ao `estruturalDoEditor()`, ao schema de `lib/previewEvento.ts` e à gravação em `criar/acoes.ts`.

- [ ] **Step 8: Rodar tudo**

Run: `./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/eslint . && pnpm test --run`
Expected: verde.

- [ ] **Step 9: Mostrar**

No passo Presentes: reordenar dois presentes e ver a prévia trocar a ordem; digitar no "Título" do valor livre, sair do passo e voltar, e conferir que o texto continua lá. Mostrar ao João antes de commitar.

---

### Task 4: Recados — textos editáveis com prévia ao vivo

**Files:**
- Modify: `lib/secoes.ts` (subseção `recados`)
- Modify: `lib/secoes.test.ts`
- Modify: `lib/textos.ts` (defaults por nicho)
- Modify: `components/evt/paginas/PaginaRecados.tsx` (consumir a copy + `data-live`)
- Modify: `app/(dashboard)/painel/criar/CriarConvite.tsx` (State, INICIAL, UI no passo 5, `liveMapa`, `montarRascunho`, `focoDoPasso`)
- Modify: `lib/previewEvento.ts` (campos no schema/serialize/deserialize)
- Modify: `app/(dashboard)/painel/criar/acoes.ts` (persistência em `customization.secoes`)

**Interfaces:**
- Consumes: `secoesDoConvite()` / shape `SecoesConvite` de `lib/secoes.ts`; `liveMapa()` + `data-live` do `PreviewSite`.
- Produces: `SecoesConvite["recados"] = { eyebrow: string; titulo: string; convite: string; muralTitulo: string }` — sempre preenchido (default do nicho quando o cliente não mexeu).

- [ ] **Step 1: Escrever o teste que falha**

Em `lib/secoes.test.ts`:

```ts
it("recados: sem override cai nos textos padrão", () => {
  const s = lerSecoes(undefined, "QUINZE_ANOS");
  expect(s.recados.eyebrow).toBe("Mural de recados");
  expect(s.recados.titulo).toBe("Deixe seu carinho");
  expect(s.recados.muralTitulo).toBe("Recados de quem ama");
});

it("recados: override do cliente vence", () => {
  const s = lerSecoes({ secoes: { recados: { titulo: "Mande um beijo" } } }, "QUINZE_ANOS");
  expect(s.recados.titulo).toBe("Mande um beijo");
  expect(s.recados.eyebrow).toBe("Mural de recados"); // o resto continua no default
});

it("recados: texto em branco cai no default (não deixa a seção sem título)", () => {
  const s = lerSecoes({ secoes: { recados: { titulo: "   " } } }, "QUINZE_ANOS");
  expect(s.recados.titulo).toBe("Deixe seu carinho");
});

it("recados: JSON malformado não quebra", () => {
  const s = lerSecoes({ secoes: { recados: "nada disso" } }, "QUINZE_ANOS");
  expect(s.recados.titulo).toBe("Deixe seu carinho");
});
```

> Assinatura real: `lerSecoes(customization: unknown, nicho: NichoEvento | string): SecoesConvite`
> (`lib/secoes.ts:71`). Os defaults novos entram em `TextosEvento` (`lib/textos.ts:12`) como campos
> `recadosEyebrow`, `recadosTitulo`, `recadosConvite`, `recadosMural` — o tipo é plano (sem objetos
> aninhados), então seguir o padrão de nomes achatados dos campos existentes (`teaserRecados` etc.)
> e preencher os **quatro nichos** de `TEXTOS`, não só `QUINZE_ANOS`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm exec vitest run lib/secoes.test.ts`
Expected: FAIL — `s.recados` é `undefined`.

- [ ] **Step 3: Implementar a subseção**

Em `lib/secoes.ts`: adicionar ao tipo `SecoesConvite`

```ts
  /** Página /recados: cabeçalho, convite do formulário e título do mural. */
  recados: {
    eyebrow: string;
    titulo: string;
    /** Linha que convida a escrever; `{nome}` é trocado pelo nome da debutante. */
    convite: string;
    muralTitulo: string;
  };
```

no `secoesSchema` a chave `recados: z.object({ eyebrow: z.string(), titulo: z.string(), convite: z.string(), muralTitulo: z.string() }).partial()`, e na resolução usar o helper `texto()` que já existe (branco → default). Os defaults vão para `lib/textos.ts`, no molde das copies de nicho já existentes:

```ts
// lib/textos.ts — campos planos em TextosEvento, preenchidos nos QUATRO nichos.
// (Abaixo, os valores de QUINZE_ANOS; os demais nichos adaptam o gênero/tom.)
recadosEyebrow: "Mural de recados",
recadosTitulo: "Deixe seu carinho",
recadosConvite: "Escreva um recado de carinho para {nome}. Ela vai amar ler cada palavra.",
recadosMural: "Recados de quem ama",
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm exec vitest run lib/secoes.test.ts`
Expected: PASS.

- [ ] **Step 5: Página consumir a copy**

Em `components/evt/paginas/PaginaRecados.tsx`, trocar os literais pelos campos resolvidos e marcar para o patch ao vivo:

```tsx
<SectionHeading eyebrow={secoes.recados.eyebrow} title={secoes.recados.titulo} />
```
```tsx
<p data-live="recados-convite" className="mx-auto mt-6 max-w-md text-center font-evt-body text-lg text-evt-ink-soft">
  {secoes.recados.convite.replace("{nome}", nome)}
</p>
```
```tsx
<p data-live="recados-mural" className="text-center font-evt-script …">
  {secoes.recados.muralTitulo}
</p>
```

Conferir em `SectionHeading` se `eyebrow`/`title` já carregam `data-live` (o padrão das outras seções); se não, passar os atributos como as demais páginas fazem. Onde a copy vem: ler de `evento` (o `EventoFesta` já carrega `secoes`) — não buscar banco aqui.

- [ ] **Step 6: Bloco de textos no editor**

No `State`: `recEyebrow: string; recTitulo: string; recConvite: string; recMural: string;`, com o `INICIAL` igual aos defaults acima. No passo 5, dentro da caixa "Mural de recados", acima da lista de aprovação e só quando `S.rec`:

```tsx
<div className="mb-4 flex flex-col gap-3 rounded-[13px] border border-[#ECECF0] bg-[#FAFAFC] p-3.5">
  <div className="text-[13px] font-semibold">Textos da página</div>
  <div>
    <Label>Chapéu</Label>
    <input value={S.recEyebrow} onChange={inp("recEyebrow")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
  </div>
  <div>
    <Label>Título</Label>
    <input value={S.recTitulo} onChange={inp("recTitulo")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
  </div>
  <div>
    <Label>Convite</Label>
    <input value={S.recConvite} onChange={inp("recConvite")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
  </div>
  <div>
    <Label>Título do mural</Label>
    <input value={S.recMural} onChange={inp("recMural")} style={{ borderColor: "#E4E4EA" }} className={inputCls} />
  </div>
</div>
```

- [ ] **Step 7: Prévia ao vivo + foco**

Em `liveMapa()`, adicionar as chaves (batendo com os `data-live` do Step 5):

```ts
"recados-eyebrow": S.recEyebrow,
"recados-titulo": S.recTitulo,
"recados-convite": S.recConvite.replace("{nome}", S.nome.trim().split(/\s+/)[0] ?? ""),
"recados-mural": S.recMural,
```

Em `focoDoPasso()`, o passo 5 passa a devolver `"recados"` quando o cliente está mexendo nesse bloco (o card já tem `data-foco="recados"`, e `paginaDoPasso(5, "recados")` já leva a prévia para `/recados`). Como esses textos vão ao vivo, **não** entram em `estruturalDoEditor()` — mexer neles não pode recarregar o iframe.

- [ ] **Step 8: Rascunho e persistência**

`montarRascunho()` leva os quatro textos (só os que diferem do default, mantendo o JSON limpo); `lib/previewEvento.ts` ganha os campos no schema/serialize/deserialize; `criar/acoes.ts` grava em `customization.secoes.recados`.

- [ ] **Step 9: Rodar tudo**

Run: `./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/eslint . && pnpm test --run`
Expected: verde.

- [ ] **Step 10: Mostrar**

No passo Galeria e recados: digitar no "Título" e ver a prévia trocar **sem recarregar**; conferir que a página `/recados` de um convite já publicado (`http://maria-clara.localhost:3000/recados`) continua com os textos originais. Mostrar ao João antes de commitar.

---

## Fechamento

- [ ] `pnpm build` verde (se acusar erro de fonte do Google, `rm -rf .next` antes — cache velho, não é regressão).
- [ ] As quatro entregas vistas na tela pelo João.
- [ ] Commits só depois do "pode": um por task, mensagem no padrão do repo (`feat(editor): …`).
