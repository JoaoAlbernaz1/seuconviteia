# Fluxo de Criação estilo iCasei — Plano de Implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: `superpowers:subagent-driven-development` ou `superpowers:executing-plans`. Passos com checkbox (`- [ ]`).

**Spec:** `docs/superpowers/specs/2026-07-10-fluxo-criacao-icasei-design.md` (commit `87d8386`)

**Goal:** Substituir o wizard atual por um fluxo guiado estilo iCasei que, logo após o login de quem não tem evento, coleta o essencial (nome, data, clima, capa, endereço) e faz o site de 15 anos **nascer publicado**, terminando no reveal "já está no ar".

**Architecture:** Duas fases. **Fase 1 (lógica)** — módulos puros e plumbing, testáveis agora, independentes do visual: derivação de passos a partir do registro de templates, validações, `criarRascunho` publicando, checagem de slug, redirect de entrada. **Fase 2 (visual)** — os componentes de tela, portados dos mockups do Stitch **depois** que o dono aprovar cada um. Um portão explícito separa as fases.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4, Vitest, pnpm. Sem API externa.

## Global Constraints

- **Nasce publicado** (FR8), não rascunho. Decisão do dono.
- **Só 15 anos** por ora (FR11): sem tela de "Ocasião". Mas o fluxo **lê do registro** `lib/templates.ts` (NFR1) — a tela de Ocasião/Modelo reaparece sozinha quando houver mais de uma ocasião/template. Adicionar template = dados, não tela.
- **Marca clara/amarela** (NFR2): roxo `#7A40ED`, amarelo `#F5FF63` (só como fundo, tinta preta), preto `#19171C`. Sem herança "DARK".
- **A foto de capa tem "Escolher depois"** (FR6, §7.2): o fluxo nunca trava se o storage estiver quebrado. Sem foto → capa vira o gradiente do tema (`CapaEvento` já faz).
- **A data é obrigatória** neste ciclo (§7.1). "Ainda não definimos" fica fora.
- **Módulos de `lib/` com teste não importam `@/...`** — o Vitest não resolve o alias. Caminho relativo ou sem import de runtime. Os 24 testes atuais são puros; manter.
- **Sem API externa.** Só Server Actions + uma rota interna opcional (`/api/slug-disponivel`).
- PT-BR, tom acolhedor. Commits semânticos. **pnpm**.
- O hook do `impeccable` roda o detector a cada Edit/Write de UI; ler o que ele diz.

## Estrutura de arquivos

| Arquivo | Responsabilidade | Fase |
|---|---|---|
| `lib/fluxoCriacao.ts` | **Puro.** Deriva a sequência de passos do registro de templates (NFR1) | 1 |
| `lib/fluxoCriacao.test.ts` | Testa a derivação | 1 |
| `lib/validacaoCriacao.ts` | **Puro.** Valida nome, data e slug por passo | 1 |
| `lib/validacaoCriacao.test.ts` | Testa as validações | 1 |
| `app/(dashboard)/painel/acoes.ts` | `criarRascunho` lê `publicar` do FormData → `PUBLISHED` (FR8) | 1 |
| `lib/slug.ts` + `app/api/slug-disponivel/route.ts` | Checagem de disponibilidade do slug editado (FR7) | 1 |
| `app/(dashboard)/painel/page.tsx` | Zero eventos → redireciona ao fluxo (FR1) | 1 |
| `app/(dashboard)/painel/novo/_passos/Moldura.tsx` | Chassi comum: imagem/foco/progresso/voltar/microcopy | 2 |
| `app/(dashboard)/painel/novo/_passos/Passo*.tsx` | Uma tela por pergunta (Nome, Data, Clima, Capa, Endereço) | 2 |
| `app/(dashboard)/painel/novo/Revelacao.tsx` | Loading → reveal → "Acessar painel" | 2 |
| `app/(dashboard)/painel/novo/FluxoCriacao.tsx` | Orquestra passos, progresso, voltar, estado; substitui `Wizard.tsx` | 2 |

**Reaproveitar:** `gerarSlugUnico` (`lib/slug.ts`), `TEMPLATES`/`templatesPorOcasiao` (`lib/templates.ts`), `CapaEvento`, o preview (`/preview-evento`), os temas (`lib/temas.ts`: rose, dourado, azul, lavanda, verde, terracota).

---

# FASE 1 — Lógica (testável agora, independente do visual)

## Tarefa 1: `lib/fluxoCriacao.ts` — quais passos aparecem

**Files:** Create `lib/fluxoCriacao.ts`, `lib/fluxoCriacao.test.ts`

**Interfaces:**
- Consome: `TemplateDefinition` de `lib/templates.ts` (import de tipo, relativo).
- Produz: `type PassoId = "OCASIAO" | "MODELO" | "NOME" | "DATA" | "CLIMA" | "CAPA" | "ENDERECO"`, e `passosDoFluxo(ocasioesHabilitadas: string[], templatesDaOcasiao: {id:string}[]): PassoId[]`, consumido pela Tarefa 8.

Por que existe: é o NFR1. A tela de Ocasião só aparece com mais de uma ocasião; a de Modelo, com mais de um template. Hoje some sozinha; amanhã reaparece com dados novos.

- [ ] **Passo 1: Teste que falha**

```ts
// lib/fluxoCriacao.test.ts
import { describe, expect, it } from "vitest";
import { passosDoFluxo } from "./fluxoCriacao";

const umTpl = [{ id: "quinze-anos-glamour-rose" }];
const doisTpl = [{ id: "a" }, { id: "b" }];

describe("passosDoFluxo", () => {
  it("uma ocasiao e um template: sem OCASIAO nem MODELO", () => {
    expect(passosDoFluxo(["quinze-anos"], umTpl)).toEqual([
      "NOME", "DATA", "CLIMA", "CAPA", "ENDERECO",
    ]);
  });

  it("varias ocasioes: inclui OCASIAO no comeco", () => {
    expect(passosDoFluxo(["quinze-anos", "casamento"], umTpl)[0]).toBe("OCASIAO");
  });

  it("varios templates na ocasiao: inclui MODELO", () => {
    expect(passosDoFluxo(["quinze-anos"], doisTpl)).toContain("MODELO");
  });

  it("MODELO vem depois de OCASIAO e antes de NOME", () => {
    const p = passosDoFluxo(["quinze-anos", "casamento"], doisTpl);
    expect(p.indexOf("MODELO")).toBeLessThan(p.indexOf("NOME"));
    expect(p.indexOf("OCASIAO")).toBeLessThan(p.indexOf("MODELO"));
  });
});
```

- [ ] **Passo 2: Rodar e falhar** — `pnpm exec vitest run lib/fluxoCriacao.test.ts` → FAIL "Cannot find module './fluxoCriacao'".

- [ ] **Passo 3: Implementar**

```ts
// lib/fluxoCriacao.ts
/**
 * Deriva a sequencia de passos do fluxo de criacao a partir do que existe no
 * registro de templates. PURO e testavel.
 *
 * NFR1 do spec: adicionar uma ocasiao/template faz a tela correspondente
 * reaparecer sozinha, sem reescrever o fluxo.
 */
export type PassoId =
  | "OCASIAO"
  | "MODELO"
  | "NOME"
  | "DATA"
  | "CLIMA"
  | "CAPA"
  | "ENDERECO";

/** Passos fixos, sempre presentes, na ordem do iCasei adaptado. */
const FIXOS: PassoId[] = ["NOME", "DATA", "CLIMA", "CAPA", "ENDERECO"];

export function passosDoFluxo(
  ocasioesHabilitadas: string[],
  templatesDaOcasiao: { id: string }[],
): PassoId[] {
  const inicio: PassoId[] = [];
  if (ocasioesHabilitadas.length > 1) inicio.push("OCASIAO");
  if (templatesDaOcasiao.length > 1) inicio.push("MODELO");
  return [...inicio, ...FIXOS];
}
```

- [ ] **Passo 4: Passar** — `pnpm exec vitest run lib/fluxoCriacao.test.ts` → PASS (4).

- [ ] **Passo 5: Commit**

```bash
git add lib/fluxoCriacao.ts lib/fluxoCriacao.test.ts
git commit -m "feat(criar): deriva passos do fluxo do registro de templates

NFR1: Ocasiao/Modelo aparecem sozinhos quando houver mais de um. Hoje (1 ocasiao,
1 template de 15 anos) o fluxo e so Nome/Data/Clima/Capa/Endereco."
```

---

## Tarefa 2: `lib/validacaoCriacao.ts` — validação por passo

**Files:** Create `lib/validacaoCriacao.ts`, `lib/validacaoCriacao.test.ts`

**Interfaces:**
- Produz: `nomeValido(s: string): boolean`, `dataValida(iso: string, hoje: Date): { ok: true } | { ok: false; erro: string }`, `slugValido(s: string): boolean`. Consumidos pelas Tarefas 8–10.

A validação sai do componente para ser testada. `dataValida` recebe `hoje` por parâmetro (nada de `new Date()` escondido).

- [ ] **Passo 1: Teste que falha**

```ts
// lib/validacaoCriacao.test.ts
import { describe, expect, it } from "vitest";
import { nomeValido, dataValida, slugValido } from "./validacaoCriacao";

const HOJE = new Date("2026-07-10T12:00:00-03:00");

describe("nomeValido", () => {
  it("aceita nome com 2+ caracteres", () => {
    expect(nomeValido("Maria Clara")).toBe(true);
  });
  it("rejeita vazio ou so espaco", () => {
    expect(nomeValido("  ")).toBe(false);
    expect(nomeValido("")).toBe(false);
  });
});

describe("dataValida", () => {
  it("aceita data futura", () => {
    expect(dataValida("2026-09-07", HOJE).ok).toBe(true);
  });
  it("rejeita formato invalido", () => {
    expect(dataValida("07/09/2026", HOJE)).toEqual({ ok: false, erro: "Informe uma data válida." });
  });
  it("rejeita data no passado", () => {
    const r = dataValida("2026-06-01", HOJE);
    expect(r.ok).toBe(false);
  });
});

describe("slugValido", () => {
  it("aceita minusculas, numeros e hifen", () => {
    expect(slugValido("maria-clara-15")).toBe(true);
  });
  it("rejeita espaco, maiuscula ou vazio", () => {
    expect(slugValido("Maria Clara")).toBe(false);
    expect(slugValido("")).toBe(false);
  });
});
```

- [ ] **Passo 2: Rodar e falhar.**

- [ ] **Passo 3: Implementar**

```ts
// lib/validacaoCriacao.ts
/** Validacoes puras do fluxo de criacao. Sem import de runtime (Vitest testa). */

export function nomeValido(s: string): boolean {
  return s.trim().length >= 2;
}

export function slugValido(s: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
}

/** `hoje` entra por parametro para o teste nao depender do relogio. */
export function dataValida(
  iso: string,
  hoje: Date,
): { ok: true } | { ok: false; erro: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return { ok: false, erro: "Informe uma data válida." };
  }
  // Meia-noite de Sao Paulo, como o resto do app (acoes.ts usa -03:00).
  const d = new Date(`${iso}T00:00:00-03:00`);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, erro: "Informe uma data válida." };
  }
  if (d.getTime() < hoje.getTime() - 24 * 60 * 60 * 1000) {
    return { ok: false, erro: "A data já passou." };
  }
  return { ok: true };
}
```

- [ ] **Passo 4: Passar** (8 testes).

- [ ] **Passo 5: Commit**

```bash
git add lib/validacaoCriacao.ts lib/validacaoCriacao.test.ts
git commit -m "feat(criar): validacoes puras de nome, data e slug"
```

---

## Tarefa 3: `criarRascunho` publica quando pedido

**Files:** Modify `app/(dashboard)/painel/acoes.ts` (a `create` do evento, ~linha 232-243, e o `rascunhoSchema`)

**Interfaces:**
- Consome: nada novo.
- Produz: o mesmo `criarRascunho`, agora sensível a um campo `publicar` do `FormData`.

FR8: o site nasce `PUBLISHED`. `criarRascunho` mantém a assinatura `useActionState`; lê um campo novo.

- [ ] **Passo 1: Ler o campo `publicar`**

No corpo de `criarRascunho`, após validar o schema e antes do `prisma.event.create`:

```ts
  const publicar = formData.get("publicar") === "1";
```

- [ ] **Passo 2: Usar no `create`**

Trocar `status: "DRAFT",` por:

```ts
      status: publicar ? "PUBLISHED" : "DRAFT",
```

- [ ] **Passo 3: Redirecionar conforme o caso**

Hoje `criarRascunho` leva ao passo Publicar. Quando `publicar` é `true`, o destino é a revelação. Localizar o `redirect` final da action e ajustar:

```ts
  // Nasce publicado -> revelacao; senao, fluxo antigo de publicar.
  redirect(publicar ? `/painel/${event.id}/pronto` : `/painel/${event.id}/publicar`);
```

(A rota `/pronto` é a `Revelacao`, criada na Tarefa 12.)

- [ ] **Passo 4: Typecheck e testes**

```bash
pnpm exec tsc --noEmit && pnpm test
```
Esperado: verde. A mudança não quebra o caminho antigo (sem `publicar`, continua `DRAFT` + `/publicar`).

- [ ] **Passo 5: Commit**

```bash
git add "app/(dashboard)/painel/acoes.ts"
git commit -m "feat(criar): criarRascunho publica na hora quando FormData tem publicar=1"
```

---

## Tarefa 4: `/api/slug-disponivel` — checagem ao editar o endereço

**Files:** Create `app/api/slug-disponivel/route.ts`

**Interfaces:**
- Consome: `slugValido` (Tarefa 2), `prisma`, `ehReservado` de `lib/slug.ts` (verificar o nome exportado; se não houver, usar `gerarSlugUnico`'s guard).
- Produz: `GET /api/slug-disponivel?s=<slug>` → `{ disponivel: boolean }`.

FR7. Só é chamada quando o usuário **edita** o slug (a sugestão do `gerarSlugUnico` já nasce livre).

- [ ] **Passo 1: Implementar**

```ts
// app/api/slug-disponivel/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugValido } from "@/lib/validacaoCriacao";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const s = new URL(request.url).searchParams.get("s")?.trim().toLowerCase() ?? "";
  if (!slugValido(s)) {
    return NextResponse.json({ disponivel: false, motivo: "invalido" });
  }
  const existe = await prisma.event.findUnique({
    where: { subdomain: s },
    select: { id: true },
  });
  return NextResponse.json({ disponivel: !existe });
}
```

- [ ] **Passo 2: Verificar reservados**

Conferir se `lib/slug.ts` exporta `ehReservado` (o `gerarSlugUnico` usa). Se sim, incluir na checagem:

```bash
grep -n "ehReservado\|RESERVAD" lib/slug.ts lib/tenant.ts
```
Se existir e for exportável, importar e negar slug reservado antes do banco. Se não for exportável, deixar a nota e seguir — o `create` final ainda passa por `gerarSlugUnico`, que trata reservados.

- [ ] **Passo 3: Testar a rota à mão**

```bash
docker start sc-postgres && pnpm dev
curl -s "http://app.localhost:3000/api/slug-disponivel?s=maria-clara" ; echo
curl -s "http://app.localhost:3000/api/slug-disponivel?s=Maria%20Clara" ; echo
```
Esperado: `{"disponivel":false}` para `maria-clara` (existe no seed) e `{"disponivel":false,"motivo":"invalido"}` para o com espaço/maiúscula.

- [ ] **Passo 4: Commit**

```bash
git add app/api/slug-disponivel/route.ts
git commit -m "feat(criar): rota interna de disponibilidade de slug (edicao livre)"
```

---

## Tarefa 5: Entrada automática — zero eventos vai ao fluxo (FR1)

**Files:** Modify `app/(dashboard)/painel/page.tsx`

**Interfaces:** consome a contagem de eventos que a página já carrega.

- [ ] **Passo 1: Redirecionar quando vazio**

No `MeusEventosPage`, após carregar `events`, antes de montar o resto:

```ts
  if (events.length === 0) redirect("/painel/novo");
```

O `EstadoVazio` deixa de ser o destino de quem tem zero eventos — ele agora só aparece se o usuário voltar ao `/painel` de propósito. Manter o componente (não apagar): ele ainda serve como fallback e é referenciado no teste.

- [ ] **Passo 2: Verificar**

```bash
# Com a conta vazio@ (0 eventos): abrir /painel deve levar a /painel/novo.
```
Feito no screenshot da Tarefa 13.

- [ ] **Passo 3: Typecheck, testes, commit**

```bash
pnpm exec tsc --noEmit && pnpm test
git add "app/(dashboard)/painel/page.tsx"
git commit -m "feat(criar): quem nao tem evento entra direto no fluxo (FR1)"
```

---

# PORTÃO — Mockups do Stitch

> **Não comece a Fase 2 sem isto.** O visual das telas vem dos mockups aprovados, não de JSX inventado.

- [ ] **Gerar no Stitch** as telas do fluxo, a partir do design system já criado (`assets/15422681558507635724`) e das 11 telas do iCasei como referência de UX: Nome, Data, Clima, Capa, Endereço, Loading, Reveal. Layout dividido (imagem à esquerda, foco à direita), progresso, voltar, microcopy.
- [ ] **Capturar** cada tela e **mostrar ao dono**. Ele aprova ou corrige contra o iCasei. Iterar até o "pode portar".
- [ ] Só então seguir para a Fase 2, **portando** o visual aprovado.

---

# FASE 2 — Telas (portadas do Stitch aprovado)

> Cada tarefa abaixo define a **estrutura, as props e a fiação** — o que a tela recebe, o que ela emite, e para onde o dado vai. As `className` (cores, espaçamento, tipografia) vêm do mockup aprovado. A fiação é fixa; o estilo é porte.

## Tarefa 6: `Moldura` — o chassi comum

**Files:** Create `app/(dashboard)/painel/novo/_passos/Moldura.tsx`

**Interfaces:**
- Produz: `<Moldura imagem={url} progresso={0..1} podeVoltar onVoltar emoji titulo subtitulo>{campo}</Moldura>`, consumido pelas Tarefas 7–11.

Estrutura fixa (o estilo é do mockup): coluna esquerda com `imagem` (some no mobile); coluna direita com barra de progresso no topo, seta de voltar (se `podeVoltar`), `emoji`, `titulo`, `subtitulo`, o `children` (o campo do passo), e o rodapé de ações que cada passo injeta.

- [ ] **Passo 1: Esqueleto com a fiação** (className do mockup aprovado)

```tsx
// app/(dashboard)/painel/novo/_passos/Moldura.tsx
import type { ReactNode } from "react";

export function Moldura({
  imagem,
  progresso,
  podeVoltar,
  onVoltar,
  emoji,
  titulo,
  subtitulo,
  children,
}: {
  imagem: string;
  progresso: number; // 0..1
  podeVoltar: boolean;
  onVoltar?: () => void;
  emoji: string;
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* imagem inspiradora — some no mobile */}
      <div
        className="hidden bg-cover bg-center lg:block"
        style={{ backgroundImage: `url(${imagem})` }}
        aria-hidden
      />
      <div className="relative flex flex-col px-6 py-8 sm:px-10">
        {/* progresso */}
        <div className="absolute inset-x-0 top-0 h-1 bg-scv-soft">
          <div
            className="h-full bg-violeta transition-[width]"
            style={{ width: `${Math.round(progresso * 100)}%` }}
          />
        </div>
        {podeVoltar ? (
          <button type="button" onClick={onVoltar} aria-label="Voltar" className="mt-4 w-9 text-scv-muted">
            <i className="bi bi-chevron-left" aria-hidden />
          </button>
        ) : (
          <span className="mt-4 block h-9" aria-hidden />
        )}
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-5 text-center">
          <div className="text-2xl" aria-hidden>{emoji}</div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-scv-ink">{titulo}</h1>
          {subtitulo ? <p className="text-[14px] text-scv-muted">{subtitulo}</p> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Passo 2: Typecheck** — `pnpm exec tsc --noEmit`.
- [ ] **Passo 3: Commit** — `git commit -m "feat(criar): Moldura (chassi comum do fluxo guiado)"`.

## Tarefa 7–11: os cinco passos

Cada passo é um componente dentro da `Moldura`, com o mesmo contrato: recebe `valor` + `onChange` + `onAvancar` (+ dados que precise), valida com as funções da Tarefa 2, e habilita/desabilita "Próximo passo". As `className` vêm do mockup.

- **Tarefa 7 — `PassoNome`**: um `input` de texto. Título "Qual o nome da debutante?", subtítulo curto, exemplo no placeholder, microcopy "Você pode mudar depois". `onAvancar` liberado quando `nomeValido`.
- **Tarefa 8 — `PassoData`**: seletor de data (FR4). Título "Quando será o grande dia?". Libera quando `dataValida(..., new Date()).ok`. Erro inline com a mensagem da validação.
- **Tarefa 9 — `PassoClima`**: os temas de `lib/temas.ts` como opções (rose, dourado, azul, lavanda, verde, terracota), cada um mostrando o nome digitado no tema; opção "Me surpreenda" (sorteia um tema — `Math.random()` é normal aqui, é componente client no navegador). Libera ao escolher.
- **Tarefa 10 — `PassoCapa`**: dropzone que sobe via `/api/upload` (já existe); mostra formatos/limite; link **"Escolher depois"** que avança sem foto (FR6, §7.2). Se o upload falhar (storage quebrado), a mensagem de erro é amigável e o "Escolher depois" continua funcionando.
- **Tarefa 11 — `PassoEndereco`**: `input` de slug pré-preenchido (a Tarefa 12 injeta a sugestão do `gerarSlugUnico`); ao editar, chama `/api/slug-disponivel` (debounced) e mostra o check verde / aviso. Botão final "Criar meu site".

Cada uma: esqueleto com a fiação → typecheck → commit. O corpo de cada passo é curto; a fiação (validação, onAvancar, estado) é o que importa e está fixada acima.

## Tarefa 12: `FluxoCriacao` + `Revelacao`

**Files:** Rewrite `app/(dashboard)/painel/novo/Wizard.tsx` → `FluxoCriacao.tsx`; Create `app/(dashboard)/painel/novo/Revelacao.tsx` e a rota `/painel/[id]/pronto`.

- `FluxoCriacao` (client): usa `passosDoFluxo` (Tarefa 1) para saber a ordem; mantém o estado (nome, data, tema, fontes, capaUrl, slug); renderiza o passo atual dentro da `Moldura`; no último passo, monta um `FormData` com `publicar=1` e chama `criarRascunho`. Pré-preenche o slug com `gerarSlugUnico` no carregamento.
- `Revelacao` (a rota `/painel/[id]/pronto`): loading ("Preparando um site incrível…") → reveal ("Uau! Já está no ar!") com o preview real do site → "Acessar painel".
- Ajustar `app/(dashboard)/painel/novo/page.tsx` para renderizar `FluxoCriacao` no lugar do `Wizard`.

Fiação fixa; visual do mockup. Typecheck + build + commit.

---

## Tarefa 13: Verificação ponta a ponta

**Files:** nenhum.

- [ ] `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build` verdes.
- [ ] `docker start sc-postgres && pnpm dev`. Login como `vazio@seuconviteia.com` / `demo12345`.
- [ ] **FR1:** abrir `/painel` com a conta vazia redireciona ao fluxo.
- [ ] Percorrer: Nome → Data → Clima → (Capa: testar o "Escolher depois") → Endereço → "Criar meu site".
- [ ] **FR8:** confirmar no banco que o evento nasceu `PUBLISHED`:
  ```bash
  docker exec sc-postgres psql -U postgres -d seuconviteia -t -A -c "SELECT title, status FROM \"Event\" ORDER BY \"createdAt\" DESC LIMIT 1;"
  ```
  Esperado: `PUBLISHED`.
- [ ] **FR9:** a revelação aparece e o site público responde na hora (`curl` no subdomínio).
- [ ] **§7.2:** sem foto, a capa é o gradiente do tema; sem erro no log.
- [ ] Screenshot autenticado (CDP) de cada passo, comparado com as telas do iCasei; mostrar ao dono.
- [ ] `npx impeccable detect "app/(dashboard)/painel/novo/"` → zero anti-padrões.
- [ ] Limpar o evento de teste do banco no fim.

---

## Fora deste plano

- **Storage (Vercel Blob).** Paralelo; a `PassoCapa` funciona de verdade só quando ele existir. O "Escolher depois" cobre o intervalo.
- **"Ainda não definimos" a data** (§7.1) — exige schema nulável.
- **Checklist "Comece por aqui"** do painel (tela 11 do iCasei).
- **Editor (D7)** — onde a foto realmente importa.
- **Ocasião "Casamento"/"Aniversário"** — habilitar no registro; o fluxo já está pronto (NFR1).
