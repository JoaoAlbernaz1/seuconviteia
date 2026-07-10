# Template 15 anos idêntico à festa — Plano de Implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: `superpowers:subagent-driven-development` ou `superpowers:executing-plans`. Passos com checkbox (`- [ ]`).

**Spec:** `docs/superpowers/specs/2026-07-10-template-15anos-festa-design.md` (commit `aa9f400`)
**Referência visual:** `docs/referencia-template-festa.md` + prints em `scratchpad/festa-<pagina>.png` (festa, alvo) e `scratchpad/atual-<pagina>.png` (glamour-rose de hoje).

**Goal:** Deixar o template `quinze-anos/glamour-rose` pixel-fiel ao `festa-15-maria-clara.vercel.app`, tela por tela, com todo o conteúdo editável pelo painel.

**Architecture:** Duas naturezas de tarefa. **Concreta** (Tarefa 1) — o campo `pais`, pré-escrevível com código exato. **Visual** (Tarefas 2–7) — alinhar cada página do `glamour-rose` ao print da festa; não é JSX pré-escrevível pixel a pixel, é iterar contra a referência: capturar o sistema, comparar com o print, ajustar, recapturar, até bater. Cada tarefa visual termina com um screenshot lado a lado aprovado.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind v4, Vitest, pnpm, Playwright (verificação).

## Global Constraints

- **Pixel-fiel à festa** (NFR1): o alvo de cada página é `scratchpad/festa-<pagina>.png`. Aceite = idêntico, verificado por screenshot lado a lado + aprovação do dono.
- **Tudo editável** (NFR2): nenhum texto/foto hardcoded no template. Um único campo novo (`pais`); o resto sai dos campos que já existem.
- **Não mexer na paleta:** o preset de tema `rose` já tem os valores exatos da festa (`lib/temas.ts:14`).
- **Reaproveitar** `components/evt/*` e o modelo de dados. Só a camada de layout do `glamour-rose` muda.
- **Fontes custom → fallback Google** (`milton`→Pinyon Script, `vogue`→Cormorant), como já é.
- `prefers-reduced-motion` no Ken Burns da capa.
- Módulo de teste puro não importa `@/...` (Vitest). PT-BR. Commits semânticos. **pnpm**.
- O hook do `impeccable` roda a cada Edit/Write de UI; ler os achados.

## Estrutura de arquivos

| Arquivo | Papel | Tarefa |
|---|---|---|
| `lib/convite.ts` | `pais` no tipo `ConviteConteudo`, no schema e em `lerConteudo` | 1 |
| `lib/convite.test.ts` | teste do `pais` (presente/ausente) | 1 |
| `app/(dashboard)/painel/[id]/detalhes/*` | campo `pais` no form | 1 |
| `app/(dashboard)/painel/[id]/acoes.ts` ou `acoes.ts` do detalhes | persistir `pais` no `customization` | 1 |
| `components/templates/quinze-anos/glamour-rose/Capa.tsx` | capa escura cinematográfica | 2 |
| `.../glamour-rose/Home.tsx` | seções da home (convite/quando-onde/CTA/traje/cards) | 3 |
| `.../glamour-rose/Evento.tsx` | alinhar | 4 |
| `.../glamour-rose/Presentes.tsx` | card dividido + lista de categorias + QR | 5 |
| `.../glamour-rose/Galeria.tsx` | conferir contra o print | 6 |
| `app/%5Fsites/[sub]/recados/*` | conferir contra o print | 7 |

---

## Tarefa 1: Campo `pais` editável (concreta)

**Files:**
- Modify: `lib/convite.ts` (tipo, schema, `lerConteudo`), `lib/convite.test.ts`
- Modify: o form de `app/(dashboard)/painel/[id]/detalhes/` e a action que persiste

**Interfaces:**
- Produz: `ConviteConteudo.pais?: string`, consumido pelas Tarefas 2 e 3 (a assinatura do convite).

- [ ] **Passo 1: Teste que falha**

Em `lib/convite.test.ts`, adicionar (usa o helper de montar evento que o arquivo já tem; se o teste montar `customization` inline, seguir o padrão existente):

```ts
it("le o campo pais quando presente", () => {
  const c = lerConteudo(eventoComCustom({ pais: "Adalberto e Ivânia" }));
  expect(c.pais).toBe("Adalberto e Ivânia");
});

it("pais ausente vira undefined", () => {
  const c = lerConteudo(eventoComCustom({}));
  expect(c.pais).toBeUndefined();
});
```

(Se não existir `eventoComCustom`, olhar como os outros testes de `lerConteudo` montam o evento e replicar o padrão — não inventar helper novo.)

- [ ] **Passo 2: Rodar e falhar** — `pnpm exec vitest run lib/convite.test.ts` → FAIL (`pais` não existe).

- [ ] **Passo 3: Adicionar ao tipo** (`ConviteConteudo`, após `traje?`):

```ts
  traje?: string;
  /** Nomes dos pais/organizadores para a linha do convite e a assinatura. */
  pais?: string;
```

- [ ] **Passo 4: Adicionar ao schema** (`customizationSchema`, junto de `traje`):

```ts
    traje: z.string(),
    pais: z.string(),
```

- [ ] **Passo 5: Adicionar ao `lerConteudo`** (no `return`, junto de `traje`):

```ts
    traje: texto(custom.traje),
    pais: texto(custom.pais),
```

- [ ] **Passo 6: Rodar e passar** — `pnpm exec vitest run lib/convite.test.ts` → PASS.

- [ ] **Passo 7: Campo no editor `detalhes`**

Localizar o form (`grep -rn 'name="traje"' "app/(dashboard)/painel/[id]/detalhes/"`). Acrescentar um campo de texto `pais` **imediatamente após** o de `traje`, no mesmo padrão de markup dos outros (label + input com `name="pais"`, valor inicial do `event.customization.pais`), com placeholder tipo `Ex.: Adalberto e Ivânia`.

- [ ] **Passo 8: Persistir no action**

Na action que salva os detalhes (a mesma que grava `traje` no `customization` — achar com `grep -rn "traje" "app/(dashboard)/painel/[id]"`), ler `formData.get("pais")` e incluí-la no objeto de `customization` mesclado, exatamente como `traje` é tratado.

- [ ] **Passo 9: Typecheck, testes, commit**

```bash
pnpm exec tsc --noEmit && pnpm test
git add lib/convite.ts lib/convite.test.ts "app/(dashboard)/painel/[id]/detalhes" "app/(dashboard)/painel/[id]/acoes.ts" 2>/dev/null || git add -A "app/(dashboard)/painel/[id]"
git commit -m "feat(evt): campo 'pais' editavel para a linha do convite e assinatura"
```

---

## Tarefas 2–7: alinhamento visual (iterar contra o print)

> Cada tarefa segue o **mesmo ritual**, porque fidelidade pixel a pixel não se escreve às cegas — se compara e ajusta:
>
> 1. Abrir o print alvo da festa (`scratchpad/festa-<pagina>.png`) e o atual (`scratchpad/atual-<pagina>.png`).
> 2. Editar o componente do `glamour-rose` para aproximar do alvo (layout, tipografia, espaçamento, cor — a paleta já é a certa).
> 3. Recapturar a página do sistema (script abaixo) e comparar lado a lado com o print da festa.
> 4. Repetir 2–3 até idêntico. Mostrar ao dono; seguir com o "pode".
> 5. `pnpm exec tsc --noEmit` limpo; commit.
>
> Script de recaptura (já existe em `scratchpad/atual_extrair.py`; rodar com o dev no ar):
> ```bash
> docker start sc-postgres && pnpm dev   # se ainda não estiver no ar
> python scratchpad/atual_extrair.py
> ```

### Tarefa 2: Capa — clara → escura cinematográfica

**Files:** Modify `components/templates/quinze-anos/glamour-rose/Capa.tsx`

Alvo: `festa-home.png` (topo). Hoje (`atual-home.png`): capa **clara** (`bg-evt-ivory`), foto centralizada em arco. Festa: foto **escura full-bleed** (`min-h-100svh`), scrim/vinheta, **nome em manuscrita à esquerda**, "15 ANOS" em display, monograma + nav no topo.

- [ ] Reescrever a `<section>` da capa: fundo full-bleed com a `fotoUrl`, camada de scrim escuro (para o texto creme ter contraste), lockup à esquerda (nome em `--ev-font-script`, "15 ANOS" em `--ev-font-display`).
- [ ] Sem foto → gradiente escuro do tema (não o blush claro atual). O `--ev-ink` da festa é `#160C12`.
- [ ] Ken Burns + fade com `prefers-reduced-motion: reduce` desligando o movimento.
- [ ] Mobile: foto "presa na base" (a festa faz isso). Conferir no viewport de celular.
- [ ] Recapturar, comparar com `festa-home.png`, iterar. Commit: `feat(evt): capa cinematografica escura no glamour-rose (fiel a festa)`.

### Tarefa 3: Home — seções

**Files:** Modify `.../glamour-rose/Home.tsx` (e componentes de seção que ele usa)

Alvo: `festa-home.png` (abaixo da capa). Seções, na ordem: **O Convite** (kicker → "Vem comemorar comigo" manuscrita → divisória → linha do convite dos pais em rosa, usando `pais` → parágrafos de `mensagem` → "Com carinho," + assinatura com `pais` + `titulo` → botão outline); **Quando/Onde** (card branco duas colunas); **CTA** "Faça parte dessa noite" + botão preenchido rosa; **Traje** (usa `traje`); **dois cards** Presentes/Recados.

- [ ] Alinhar cada seção ao print. A linha do convite e a assinatura usam o `pais` da Tarefa 1; se `pais` vazio, a linha some sem quebrar.
- [ ] Recapturar, comparar, iterar. Commit: `feat(evt): home do glamour-rose fiel a festa (convite/quando-onde/traje/cards)`.

### Tarefa 4: Evento

**Files:** Modify `.../glamour-rose/Evento.tsx`. Alvo: `festa-evento.png`.

- [ ] Alinhar ao print. Recapturar, comparar, iterar. Commit: `feat(evt): pagina Evento fiel a festa`.

### Tarefa 5: Presentes — card dividido + categorias + QR

**Files:** Modify `.../glamour-rose/Presentes.tsx`. Alvo: `festa-presentes.png`.

Divergência real (não só cor): a festa é **card dividido** (foto à esquerda; **lista de categorias com detalhe** à direita: "Roupas — tam P", "Calçados — nº 36") + "OU, SE PREFERIR" + **QR code** do Pix + recebedor. O atual é foto centralizada + **cards com preço** + chave Pix com botão copiar.

- [ ] Layout: card dividido (foto + lista). A lista renderiza os `presentes` como **categoria + detalhe** (título + descrição), sem o preço em destaque — fiel à festa. Se um presente tiver `priceCents`, decidir com o dono se mostra ou omite (a festa não mostra preço).
- [ ] Pix por **QR code** gerado do `pixPayload`/`pixChave` (ver se há util de QR no repo; senão, gerar o QR client-side de forma leve). Manter o `PixCard` se ele já fizer QR; senão, ajustar.
- [ ] Recebedor = `pixNome`. Recapturar, comparar com `festa-presentes.png`, iterar. Commit: `feat(evt): Presentes fiel a festa (card dividido, categorias, QR)`.

### Tarefa 6: Galeria

**Files:** Modify `.../glamour-rose/Galeria.tsx`. Alvo: `festa-galeria.png`.

- [ ] Conferir a grade + lightbox contra o print; ajustar espaçamento/moldura se divergir. Commit se mudar: `feat(evt): Galeria fiel a festa`.

### Tarefa 7: Recados

**Files:** Modify `app/%5Fsites/[sub]/recados/*` (não há componente de template próprio). Alvo: `festa-recados.png`.

- [ ] Conferir o mural (form + listagem) contra o print; ajustar. Commit se mudar: `feat(evt): Recados fiel a festa`.

---

## Tarefa 8: Verificação final

**Files:** nenhum.

- [ ] `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build` verdes.
- [ ] `python scratchpad/atual_extrair.py` e comparar cada `atual-<pagina>.png` com `festa-<pagina>.png` — todas idênticas.
- [ ] Editar `pais` no painel (`detalhes`) e ver a linha do convite e a assinatura mudarem no site.
- [ ] Capa sem foto → gradiente escuro; `prefers-reduced-motion` respeitado.
- [ ] `npx impeccable detect "components/templates/quinze-anos/"` → zero anti-padrões.
- [ ] Mobile: capa e seções no viewport de celular.
- [ ] Mostrar ao dono, página por página. Só fechar com o "pode subir".

## Fora deste plano

- Fluxo de criação (D5), storage, dashboard — ciclos próprios.
- Templates de casamento/aniversário — o registro já suporta; entram quando existirem.
- Se a festa usar preço nos presentes no futuro — hoje ela não mostra; manter simples (YAGNI).
