# Convite fechado + passe de edição — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Depois de publicado, o convite fica fechado para edição; para mexer no site é preciso uma janela liberada (cortesia de 1h, cota do plano ou passe de R$ 19,90 no Pix).

**Architecture:** Uma única pergunta governa tudo — `edicaoAberta(evento, agora)`, em `lib/edicao.ts` (puro, testável). O banco ganha três colunas em `Event` (`edicaoAte`, `passesGratis`, `foraDoAr`). As três portas do servidor (abrir o editor, salvar o documento, publicar) passam a consultar essa função; a UI só reflete o que o servidor já recusa. O passe pago reusa a infra de Pix que já existe (`Transaction` + webhook do Mercado Pago), com a regra de sempre: **quem concede é o webhook**.

**Tech Stack:** Next 16 (App Router, server actions), Prisma 6.19.3 + Postgres, Vitest (helpers puros), Playwright (e2e), Mercado Pago (Pix), Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-08-18-convite-fechado-passe-de-edicao-design.md`

## Global Constraints

- Gerenciador: **pnpm**. Prisma fixo em **6.19.3**.
- Migration **só** com `pnpm db:migrate --name <descricao>`. `pnpm db:push` está bloqueado no `package.json` de propósito.
- Testes unitários: `pnpm test` (vitest, `lib/**/*.test.ts` e `tests/**/*.test.ts`).
- Testes que precisam de banco ficam atrás de `PAGAMENTO_DB_TESTS=1` (padrão de `tests/webhook-assinatura.test.ts`).
- E2E **sempre contra build de produção** (`pnpm build && pnpm start`): o `next dev` não hidrata de forma confiável no Playwright deste projeto.
- Preço do passe: **R$ 19,90 (1990 centavos)**. Janela do passe: **48 horas**. Cortesia: **60 minutos**. Cotas incluídas por convite: **BASICO 0, CLASSICO 1, PREMIUM 3**.
- Copy em pt-BR, tom do painel: frase curta, sem jargão, sem "clique aqui". Nunca usar `window.confirm`/`alert` — confirmação é em **dois toques**, padrão já usado em `ListaConvites.tsx` e `ExcluirEvento.tsx`.
- O endereço (slug) **não muda** depois da primeira publicação.
- Commits em português, no estilo do repo (`feat(editor): ...`, `fix(painel): ...`).

---

### Task 1: A regra, pura e testada (`lib/edicao.ts`)

**Files:**
- Create: `lib/edicao.ts`
- Test: `lib/edicao.test.ts`

**Interfaces:**
- Consumes: `Plan` de `lib/plans.ts`.
- Produces: `PASSE_PRECO_CENTS`, `PASSE_HORAS`, `CORTESIA_MINUTOS`, `edicaoAberta(ev, agora)`, `fimDaCortesia(agora)`, `fimDoPasse(agora)`, `passesIncluidos(plan)`, `temPasseIncluido(plan, passesGratis)`. Todas as tarefas seguintes consomem daqui.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// lib/edicao.test.ts
import { describe, it, expect } from "vitest";
import {
  CORTESIA_MINUTOS,
  PASSE_HORAS,
  PASSE_PRECO_CENTS,
  edicaoAberta,
  fimDaCortesia,
  fimDoPasse,
  passesIncluidos,
  temPasseIncluido,
} from "./edicao";

const agora = new Date("2026-08-18T12:00:00Z");

describe("edicaoAberta", () => {
  it("rascunho edita sempre", () => {
    expect(edicaoAberta({ status: "DRAFT", edicaoAte: null }, agora)).toBe(true);
  });

  it("publicado sem janela nao edita", () => {
    expect(edicaoAberta({ status: "PUBLISHED", edicaoAte: null }, agora)).toBe(false);
  });

  it("publicado com janela vencida nao edita", () => {
    const ontem = new Date("2026-08-17T12:00:00Z");
    expect(edicaoAberta({ status: "PUBLISHED", edicaoAte: ontem }, agora)).toBe(false);
  });

  it("publicado com janela aberta edita", () => {
    const daqui = new Date("2026-08-18T12:30:00Z");
    expect(edicaoAberta({ status: "PUBLISHED", edicaoAte: daqui }, agora)).toBe(true);
  });

  it("convite expirado nao edita nem com janela aberta", () => {
    const daqui = new Date("2026-08-18T12:30:00Z");
    expect(edicaoAberta({ status: "EXPIRED", edicaoAte: daqui }, agora)).toBe(false);
  });
});

describe("janelas", () => {
  it("cortesia dura 60 minutos", () => {
    expect(CORTESIA_MINUTOS).toBe(60);
    expect(fimDaCortesia(agora).toISOString()).toBe("2026-08-18T13:00:00.000Z");
  });

  it("passe dura 48 horas e custa R$ 19,90", () => {
    expect(PASSE_HORAS).toBe(48);
    expect(PASSE_PRECO_CENTS).toBe(1990);
    expect(fimDoPasse(agora).toISOString()).toBe("2026-08-20T12:00:00.000Z");
  });
});

describe("cota incluida no plano", () => {
  it("Basico nao tem liberacao incluida", () => {
    expect(passesIncluidos("BASICO")).toBe(0);
    expect(temPasseIncluido("BASICO", 0)).toBe(false);
  });

  it("Profissional tem 1 por convite", () => {
    expect(passesIncluidos("CLASSICO")).toBe(1);
    expect(temPasseIncluido("CLASSICO", 0)).toBe(true);
    expect(temPasseIncluido("CLASSICO", 1)).toBe(false);
  });

  it("Estudio tem 3 por convite", () => {
    expect(passesIncluidos("PREMIUM")).toBe(3);
    expect(temPasseIncluido("PREMIUM", 2)).toBe(true);
    expect(temPasseIncluido("PREMIUM", 3)).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `pnpm test lib/edicao.test.ts`
Expected: FAIL — `Failed to resolve import "./edicao"`.

- [ ] **Step 3: Escrever a implementação mínima**

```ts
// lib/edicao.ts
/**
 * Quando o site de um convite pode ser MEXIDO.
 *
 * Decisao do Joao (18/08/2026): publicou, fecha. O que continua livre e o
 * movimento da festa (confirmacoes, recados, presentes recebidos) — o SITE em
 * si so reabre dentro de uma janela: a cortesia de 1h logo apos a primeira
 * publicacao, uma liberacao incluida no plano ou o passe pago.
 *
 * Helper PURO (recebe o "agora"), como `lib/event.ts`: a decisao mora aqui e as
 * tres portas do servidor (abrir editor, salvar documento, publicar) so
 * perguntam.
 */
import type { Plan } from "./plans";

/** Preco do passe de edicao, em centavos. */
export const PASSE_PRECO_CENTS = 1990;
/** Quanto tempo o passe pago mantem a edicao aberta. */
export const PASSE_HORAS = 48;
/** Cortesia logo depois da PRIMEIRA publicacao — a rede do erro de digitacao. */
export const CORTESIA_MINUTOS = 60;

/** Subconjunto do Event necessario para decidir a edicao. */
export type EventoEdicao = {
  status: string;
  edicaoAte: Date | null;
};

/** O site deste convite pode ser mexido agora? */
export function edicaoAberta(ev: EventoEdicao, agora: Date): boolean {
  if (ev.status === "EXPIRED") return false;
  if (ev.status === "DRAFT") return true;
  return ev.edicaoAte !== null && ev.edicaoAte.getTime() > agora.getTime();
}

export function fimDaCortesia(agora: Date): Date {
  return new Date(agora.getTime() + CORTESIA_MINUTOS * 60_000);
}

export function fimDoPasse(agora: Date): Date {
  return new Date(agora.getTime() + PASSE_HORAS * 60 * 60_000);
}

/** Liberacoes incluidas no plano, POR CONVITE (decisao do Joao: assinante tem teto). */
export function passesIncluidos(plan: Plan): number {
  switch (plan) {
    case "PREMIUM":
      return 3;
    case "CLASSICO":
      return 1;
    default:
      return 0;
  }
}

/** Ainda sobra liberacao incluida neste convite? */
export function temPasseIncluido(plan: Plan, passesGratis: number): boolean {
  return passesGratis < passesIncluidos(plan);
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `pnpm test lib/edicao.test.ts`
Expected: PASS (10 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/edicao.ts lib/edicao.test.ts
git commit -m "feat(edicao): a regra de quando o convite publicado pode ser mexido"
```

---

### Task 2: As três colunas e o "fora do ar" que não destrava

**Files:**
- Modify: `prisma/schema.prisma` (model `Event`)
- Create: `prisma/migrations/<gerada>/migration.sql` (pelo `prisma migrate dev`)
- Modify: `lib/event.ts:20-60` (`EventoVisivel`, `MotivoIndisponivel`, `eventoPublico`)
- Modify: `lib/event.test.ts`
- Modify: `components/SiteIndisponivel.tsx:6-22` (novo motivo)
- Modify: `app/(dashboard)/actions.ts:207-213` (`tirarDoAr`) e criar `voltarAoAr`

**Interfaces:**
- Consumes: nada da Task 1.
- Produces: colunas `Event.edicaoAte`, `Event.passesGratis`, `Event.foraDoAr`; motivo `"fora-do-ar"`; server action `voltarAoAr(formData)`.

- [ ] **Step 1: Escrever o teste que falha**

Acrescentar em `lib/event.test.ts`:

```ts
it("fora do ar -> fora-do-ar (mesmo publicado e no prazo)", () => {
  expect(
    eventoPublico({ status: "PUBLISHED", expiresAt: futuro, foraDoAr: true }, agora),
  ).toEqual({ ok: false, motivo: "fora-do-ar" });
});

it("publicado, no prazo e no ar -> ok", () => {
  expect(
    eventoPublico({ status: "PUBLISHED", expiresAt: futuro, foraDoAr: false }, agora),
  ).toEqual({ ok: true });
});
```

E acrescentar `foraDoAr: false` nos objetos dos testes já existentes desse arquivo.

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm test lib/event.test.ts`
Expected: FAIL — o objeto com `foraDoAr: true` devolve `{ ok: true }`.

- [ ] **Step 3: Migrar o banco**

Em `prisma/schema.prisma`, dentro de `model Event`, logo depois de `publishedAt`:

```prisma
  /// Ate quando a edicao do SITE esta liberada (cortesia, cota do plano ou
  /// passe pago). Nulo = fechado. E a unica pergunta do sistema: `> agora`?
  edicaoAte      DateTime?
  /// Quantas liberacoes INCLUIDAS no plano ja foram usadas NESTE convite.
  passesGratis   Int         @default(0)
  /// Tirado do ar pelo dono. Nao volta para DRAFT — sair do ar nao pode ser um
  /// destravamento gratuito da edicao.
  foraDoAr       Boolean     @default(false)
```

Run: `pnpm db:migrate --name convite_fechado_passe_edicao`
Expected: migration criada e aplicada; `prisma generate` roda junto.

- [ ] **Step 4: Implementar a visibilidade**

Em `lib/event.ts`: acrescentar `"fora-do-ar"` ao union `MotivoIndisponivel`, acrescentar `foraDoAr: boolean` ao type `EventoVisivel`, e em `eventoPublico`, **depois** da checagem de `DRAFT` e **antes** da de expiração:

```ts
  if (ev.foraDoAr) return { ok: false, motivo: "fora-do-ar" };
```

Em `components/SiteIndisponivel.tsx`, acrescentar ao `CONTEUDO`:

```ts
  "fora-do-ar": {
    titulo: "Convite fora do ar",
    texto:
      "Quem organiza a festa tirou este convite do ar por enquanto. Volte mais tarde ou fale com quem te convidou.",
  },
```

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm test lib/event.test.ts`
Expected: PASS.

- [ ] **Step 6: Trocar o "tirar do ar" e criar o "voltar ao ar"**

Em `app/(dashboard)/actions.ts`, substituir o corpo de `tirarDoAr` e acrescentar a ação irmã:

```ts
/** Tira o site do ar SEM destravar a edicao (status continua PUBLISHED). */
export async function tirarDoAr(formData: FormData) {
  const id = await eventoDoDono(formData.get("eventId"));
  if (!id) redirect("/entrar");
  await prisma.event.update({ where: { id }, data: { foraDoAr: true } });
  revalidatePath("/painel");
}

/** Coloca de volta no ar. */
export async function voltarAoAr(formData: FormData) {
  const id = await eventoDoDono(formData.get("eventId"));
  if (!id) redirect("/entrar");
  await prisma.event.update({ where: { id }, data: { foraDoAr: false } });
  revalidatePath("/painel");
}
```

- [ ] **Step 7: Portão verde e commit**

Run: `pnpm test && pnpm lint`
Expected: PASS.

```bash
git add prisma/schema.prisma prisma/migrations lib/event.ts lib/event.test.ts components/SiteIndisponivel.tsx "app/(dashboard)/actions.ts"
git commit -m "feat(convite): colunas da janela de edicao e 'fora do ar' que nao destrava"
```

---

### Task 3: As três portas do servidor

**Files:**
- Modify: `app/(dashboard)/painel/criar/page.tsx:41-70` (abrir o editor)
- Modify: `app/(dashboard)/painel/criar/acoes.ts:501-560` (`salvarDocumentoConvite`)
- Modify: `app/(dashboard)/painel/criar/acoes.ts:596-660` (`publicarDocumentoConvite`)

**Interfaces:**
- Consumes: `edicaoAberta`, `fimDaCortesia` (Task 1); coluna `edicaoAte` (Task 2).
- Produces: `SalvarDocumentoResult` e `PublicarDocumentoResult` ganham o `kind: "fechado"`. A Task 8 (editor) trata esse `kind`.

- [ ] **Step 1: Fechar a porta de abrir o editor**

Em `app/(dashboard)/painel/criar/page.tsx`, dentro do `if (id) { ... }`, logo depois de carregar `event` e **antes** de montar `initialDocument`:

```tsx
      if (event && !edicaoAberta(event, new Date())) {
        redirect(`/painel/${event.id}/liberar`);
      }
```

Importar `edicaoAberta` de `@/lib/edicao` e `redirect` de `next/navigation` (já importado).

- [ ] **Step 2: Fechar a porta de salvar**

Em `salvarDocumentoConvite`, no ponto em que o evento do dono já foi carregado (junto da checagem `conviteEncerrado`), acrescentar:

```ts
  if (!edicaoAberta(owned, new Date())) {
    return { ok: false, kind: "fechado", error: "Este convite está publicado. Libere a edição para mexer no site." };
  }
```

Incluir `edicaoAte: true` e `status: true` no `select` da consulta desse evento, e acrescentar `"fechado"` ao union de `kind` do `SalvarDocumentoResult`.

- [ ] **Step 3: Fechar a porta de publicar e travar o slug**

Em `publicarDocumentoConvite`:

1. acrescentar `edicaoAte: true` e `publishedVersion: true` ao `select`;
2. depois da checagem `conviteEncerrado`, acrescentar:

```ts
  if (!edicaoAberta(event, new Date())) {
    return { ok: false, kind: "fechado", error: "Este convite está publicado. Libere a edição para mexer no site." };
  }
```

3. o slug só é calculado na **primeira** publicação:

```ts
  const primeiraPublicacao = event.status !== "PUBLISHED";
  const subdomain = primeiraPublicacao
    ? await gerarSlugUnico(document.data.basic.slug || document.data.basic.name || "convite", async (slug) =>
        slug !== event.subdomain && Boolean(await prisma.event.findUnique({ where: { subdomain: slug } })),
      )
    : event.subdomain;
```

4. no `data` do `updateMany`, a cortesia entra **só** na primeira publicação:

```ts
      ...(primeiraPublicacao ? { edicaoAte: fimDaCortesia(publishedAt) } : {}),
```

- [ ] **Step 4: Provar as três portas no e2e**

Em `e2e/editor-foundation.spec.ts`, acrescentar um teste: publica um convite novo, força o fim da janela pelo Prisma (`prisma.event.update({ where: { id }, data: { edicaoAte: new Date(Date.now() - 1000) } })`), e então:

```ts
await page.goto(`/painel/criar?id=${eventId}`);
await expect(page).toHaveURL(new RegExp(`/painel/${eventId}/liberar`));
```

Run: `pnpm build && pnpm start` num terminal e `E2E_BASE_URL=http://127.0.0.1:3000 E2E_DATABASE_READY=1 pnpm test:e2e` no outro.
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/painel/criar" e2e/editor-foundation.spec.ts
git commit -m "feat(editor): publicado nao abre, nao salva e nao republica sem janela"
```

---

### Task 4: Comprar o passe (Pix)

**Files:**
- Create: `app/(dashboard)/painel/[id]/liberar/acoes.ts`
- Test: `tests/passe-edicao.test.ts` (atrás de `PAGAMENTO_DB_TESTS=1`)

**Interfaces:**
- Consumes: `PASSE_PRECO_CENTS` (Task 1); `getPaymentProvider()` de `@/lib/pagamentos`.
- Produces: `comprarPasseEdicao(eventId: string): Promise<{ ok: true; pixCode: string; pixQrUrl: string; transactionId: string } | { ok: false; erro: string }>`. A Task 5 (webhook) casa pelo `Transaction.providerId`; a Task 7 (tela) chama esta action.

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/passe-edicao.test.ts
// Prova que comprar o passe NAO libera nada sozinho: nasce PENDING e a janela
// continua fechada. Quem abre e o webhook (Task 5).
//
//   PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:...@127.0.0.1:5433/seuconviteia \
//     npx vitest run tests/passe-edicao.test.ts
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;
const MARCA = "passe-edicao-teste";

/** A action le a sessao do Auth.js; aqui ela e fixada na conta do teste. */
const sessionMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: sessionMock }));

const { comprarPasseEdicao } = await import("@/app/(dashboard)/painel/[id]/liberar/acoes");

/** Conta + convite PUBLICADO com a janela ja vencida (o caso real da tela). */
async function conviteFechado(db: PrismaClient, plan: "BASICO" | "CLASSICO" | "PREMIUM" = "BASICO") {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const prof = await db.professional.create({
    data: { name: "Dono", email: `${MARCA}-${sufixo}@exemplo.test`, passwordHash: "x", plan },
  });
  const event = await db.event.create({
    data: {
      professionalId: prof.id,
      type: "QUINZE_ANOS",
      subdomain: `${MARCA}-${sufixo}`,
      title: "Festa de teste",
      eventDate: new Date("2030-01-01T00:00:00Z"),
      expiresAt: new Date("2030-02-01T00:00:00Z"),
      status: "PUBLISHED",
      plan,
      edicaoAte: new Date(Date.now() - 60_000), // venceu ha um minuto
    },
  });
  sessionMock.mockResolvedValue({ user: { id: prof.id, email: prof.email } });
  return { prof, event };
}

beforeEach(() => {
  sessionMock.mockReset();
});

describe("passe de edicao", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.event.deleteMany({ where: { subdomain: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
    await prisma.$disconnect();
  });

  it.skipIf(!enabled)("comprar cria EDIT_PASS PENDING de 1990 e NAO abre a janela", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);

    const r = await comprarPasseEdicao(event.id);
    expect(r.ok).toBe(true);

    const tx = await db.transaction.findFirstOrThrow({ where: { eventId: event.id } });
    expect(tx.kind).toBe("EDIT_PASS");
    expect(tx.amountCents).toBe(1990);
    expect(tx.status).toBe("PENDING");

    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.edicaoAte!.getTime()).toBeLessThan(Date.now());
  });

  it.skipIf(!enabled)("com a janela ja aberta, recusa a compra", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);
    await db.event.update({ where: { id: event.id }, data: { edicaoAte: new Date(Date.now() + 3_600_000) } });

    const r = await comprarPasseEdicao(event.id);
    expect(r).toEqual({ ok: false, erro: "A edição deste convite já está liberada." });
    expect(await db.transaction.count({ where: { eventId: event.id } })).toBe(0);
  });
});
```

Sem `MERCADO_PAGO_ACCESS_TOKEN` no ambiente, `getPaymentProvider()` devolve o `FakePaymentProvider` — o teste não fala com o Mercado Pago de verdade.

- [ ] **Step 2: Rodar e ver falhar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm test tests/passe-edicao.test.ts`
Expected: FAIL — módulo `liberar/acoes` não existe.

- [ ] **Step 3: Implementar a action**

```ts
"use server";

// Passe de edicao: o convite publicado reabre por 48h. Espelha `lib/presentear.ts`
// — cria a linha PENDING primeiro (o id vira a referencia da cobranca) e NUNCA
// concede: quem abre a janela e o webhook, depois de re-consultar o MP.
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/pagamentos";
import { PASSE_PRECO_CENTS, edicaoAberta } from "@/lib/edicao";

export async function comprarPasseEdicao(eventId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, erro: "Sua sessão expirou. Entre de novo." };

  const event = await prisma.event.findFirst({
    where: { id: eventId, professionalId: session.user.id },
    select: { id: true, title: true, status: true, edicaoAte: true },
  });
  if (!event) return { ok: false as const, erro: "Convite não encontrado." };
  if (edicaoAberta(event, new Date())) {
    return { ok: false as const, erro: "A edição deste convite já está liberada." };
  }

  const provider = getPaymentProvider();
  const tx = await prisma.transaction.create({
    data: { eventId: event.id, amountCents: PASSE_PRECO_CENTS, kind: "EDIT_PASS", status: "PENDING" },
  });

  try {
    const cobranca = await provider.criarCobrancaPix({
      valorCents: PASSE_PRECO_CENTS,
      descricao: `Liberar edição — ${event.title}`,
      referencia: tx.id,
      pagador: { email: session.user.email ?? undefined },
    });
    await prisma.transaction.update({ where: { id: tx.id }, data: { providerId: cobranca.chargeId } });
    return { ok: true as const, pixCode: cobranca.pixCode, pixQrUrl: cobranca.pixQrUrl, transactionId: tx.id };
  } catch (err) {
    console.error("[passe-edicao] falha ao criar cobrança Pix:", err);
    await prisma.transaction.update({ where: { id: tx.id }, data: { status: "FAILED" } });
    return { ok: false as const, erro: "Não foi possível gerar o Pix agora. Tente de novo." };
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm test tests/passe-edicao.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/painel/[id]/liberar" tests/passe-edicao.test.ts
git commit -m "feat(passe): cobranca Pix do passe de edicao (nasce PENDING, nao libera nada)"
```

---

### Task 5: O webhook é quem abre a janela

**Files:**
- Modify: `app/api/webhooks/mercadopago/route.ts:84-92` (ramo `pagamento`)
- Create: `lib/passeEdicao.ts`
- Test: `lib/passeEdicao.test.ts` + acrescentar caso em `tests/passe-edicao.test.ts`

**Interfaces:**
- Consumes: `fimDoPasse` (Task 1); `Transaction` `kind: "EDIT_PASS"` (Task 4).
- Produces: `confirmarPasseEdicao(transactionId: string, agora: Date): Promise<void>`.

- [ ] **Step 1: Escrever o teste que falha**

Acrescentar em `tests/passe-edicao.test.ts` (copiando de `tests/webhook-assinatura.test.ts` a constante `SEGREDO`, os helpers `notificacao()` e `respostaMp()` — que assinam a notificação como o MP assina — e o `import { POST } from "@/app/api/webhooks/mercadopago/route"`):

```ts
  it.skipIf(!enabled)("Pix aprovado abre 48h — e a reentrega nao abre de novo", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db);
    const r = await comprarPasseEdicao(event.id);
    expect(r.ok).toBe(true);
    const tx = await db.transaction.findFirstOrThrow({ where: { eventId: event.id } });

    // O webhook re-consulta o MP: aqui ele responde "aprovado".
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaMp({ id: tx.providerId, status: "approved" })));
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = SEGREDO;

    expect((await POST(notificacao("payment", tx.providerId!))).status).toBe(200);

    const aberto = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(aberto.edicaoAte!.getTime()).toBeGreaterThan(Date.now() + 47 * 60 * 60 * 1000);
    expect((await db.transaction.findUniqueOrThrow({ where: { id: tx.id } })).status).toBe("PAID");

    // Reentrega da MESMA notificacao: 200 e a janela nao anda de novo.
    const antes = aberto.edicaoAte!.toISOString();
    expect((await POST(notificacao("payment", tx.providerId!))).status).toBe(200);
    expect(
      (await db.event.findUniqueOrThrow({ where: { id: event.id } })).edicaoAte!.toISOString(),
    ).toBe(antes);
  });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm test tests/passe-edicao.test.ts`
Expected: FAIL — `edicaoAte` continua no passado.

- [ ] **Step 3: Implementar**

```ts
// lib/passeEdicao.ts
import "server-only";
import { prisma } from "./db";
import { fimDoPasse } from "./edicao";

/**
 * Confirma o passe pago e ABRE a janela. Idempotente pelo compare-and-set no
 * status: a segunda notificacao do mesmo pagamento nao empurra `edicaoAte` de
 * novo (o MP reenvia a mesma notificacao mais de uma vez, por contrato).
 */
export async function confirmarPasseEdicao(transactionId: string, agora: Date): Promise<void> {
  const marcada = await prisma.transaction.updateMany({
    where: { id: transactionId, kind: "EDIT_PASS", status: "PENDING" },
    data: { status: "PAID" },
  });
  if (marcada.count !== 1) return;
  const tx = await prisma.transaction.findUnique({ where: { id: transactionId }, select: { eventId: true } });
  if (!tx) return;
  await prisma.event.update({ where: { id: tx.eventId }, data: { edicaoAte: fimDoPasse(agora) } });
}
```

No webhook, dentro de `if (tipo === "pagamento") { ... if (status === "PAID") { ... } }`, depois da busca por `giftContribution`:

```ts
        if (contrib) {
          await confirmarContribuicaoPaga(contrib.id);
        } else {
          // Nao e presente de convidado: pode ser o passe de edicao do dono.
          const passe = await prisma.transaction.findFirst({
            where: { providerId: dataId, kind: "EDIT_PASS" },
            select: { id: true },
          });
          if (passe) await confirmarPasseEdicao(passe.id, new Date());
        }
```

- [ ] **Step 4: Rodar e ver passar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm test tests/passe-edicao.test.ts`
Expected: PASS (incluindo o caso de idempotência).

- [ ] **Step 5: Commit**

```bash
git add lib/passeEdicao.ts app/api/webhooks/mercadopago/route.ts tests/passe-edicao.test.ts
git commit -m "feat(passe): so o webhook abre a janela de edicao"
```

---

### Task 6: A liberação incluída no plano

**Files:**
- Modify: `app/(dashboard)/painel/[id]/liberar/acoes.ts`
- Test: acrescentar em `tests/passe-edicao.test.ts`

**Interfaces:**
- Consumes: `temPasseIncluido`, `fimDoPasse` (Task 1); `planoEfetivo`, `SELECT_ASSINATURA` de `@/lib/plans`.
- Produces: `usarPasseIncluido(eventId: string): Promise<{ ok: true } | { ok: false; erro: string }>`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
  it.skipIf(!enabled)("Profissional usa 1 liberacao por convite — a segunda e recusada", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db, "CLASSICO");

    expect(await usarPasseIncluido(event.id)).toEqual({ ok: true });
    const depois = await db.event.findUniqueOrThrow({ where: { id: event.id } });
    expect(depois.passesGratis).toBe(1);
    expect(depois.edicaoAte!.getTime()).toBeGreaterThan(Date.now() + 47 * 60 * 60 * 1000);

    // Fecha a janela na mao para pedir a SEGUNDA liberacao do mesmo convite.
    await db.event.update({ where: { id: event.id }, data: { edicaoAte: new Date(Date.now() - 1000) } });
    expect(await usarPasseIncluido(event.id)).toEqual({
      ok: false,
      erro: "Você já usou as liberações incluídas neste convite.",
    });
    expect((await db.event.findUniqueOrThrow({ where: { id: event.id } })).passesGratis).toBe(1);
  });

  it.skipIf(!enabled)("Basico nao tem liberacao incluida", async () => {
    const db = prisma!;
    const { event } = await conviteFechado(db, "BASICO");
    expect(await usarPasseIncluido(event.id)).toEqual({
      ok: false,
      erro: "Você já usou as liberações incluídas neste convite.",
    });
  });
```

Acrescentar `usarPasseIncluido` ao `import` do topo do arquivo de teste.

- [ ] **Step 2: Rodar e ver falhar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm test tests/passe-edicao.test.ts`
Expected: FAIL — `usarPasseIncluido` não existe.

- [ ] **Step 3: Implementar**

```ts
/**
 * Usa uma liberacao INCLUIDA no plano. O teto e por convite (Profissional 1,
 * Estudio 3) — sem teto, "editar de graca" viraria edicao infinita e o passe
 * pago nao existiria para quem assina.
 *
 * O `updateMany` com `passesGratis` no WHERE e o compare-and-set: dois cliques
 * simultaneos nao consomem duas cotas.
 */
export async function usarPasseIncluido(eventId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, erro: "Sua sessão expirou. Entre de novo." };

  const [event, prof] = await Promise.all([
    prisma.event.findFirst({
      where: { id: eventId, professionalId: session.user.id },
      select: { id: true, status: true, edicaoAte: true, passesGratis: true },
    }),
    prisma.professional.findUnique({ where: { id: session.user.id }, select: SELECT_ASSINATURA }),
  ]);
  if (!event || !prof) return { ok: false as const, erro: "Convite não encontrado." };

  const agora = new Date();
  if (edicaoAberta(event, agora)) return { ok: false as const, erro: "A edição já está liberada." };
  if (!temPasseIncluido(planoEfetivo(prof, agora), event.passesGratis)) {
    return { ok: false as const, erro: "Você já usou as liberações incluídas neste convite." };
  }

  const aplicado = await prisma.event.updateMany({
    where: { id: event.id, passesGratis: event.passesGratis },
    data: { passesGratis: event.passesGratis + 1, edicaoAte: fimDoPasse(agora) },
  });
  if (aplicado.count !== 1) return { ok: false as const, erro: "Tente de novo." };
  return { ok: true as const };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm test tests/passe-edicao.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/painel/[id]/liberar/acoes.ts" tests/passe-edicao.test.ts
git commit -m "feat(passe): liberacao incluida no plano, com teto por convite"
```

---

### Task 7: A tela de liberar

**Files:**
- Create: `app/(dashboard)/painel/[id]/liberar/page.tsx`
- Create: `app/(dashboard)/painel/[id]/liberar/LiberarCliente.tsx`

**Interfaces:**
- Consumes: `comprarPasseEdicao`, `usarPasseIncluido` (Tasks 4 e 6); `edicaoAberta`, `PASSE_PRECO_CENTS`, `PASSE_HORAS`, `passesIncluidos` (Task 1); `CapaEvento` de `../../_ui/CapaEvento`; `CARD`, `BTN_PRIMARIO`, `BTN_VOLTAR`, `COLUNA`, `TITULO`, `SUB` de `../../_ui/estilos`.
- Produces: rota `/painel/[id]/liberar` (destino dos redirects da Task 3 e dos botões das Tasks 9, 10 e 11).

- [ ] **Step 1: A página (server)**

Carrega o evento pelo `carregarEventoDono` (`../_carregar`) e o plano efetivo. Se `edicaoAberta(event, new Date())` já for `true`, redireciona direto para `/painel/criar?id=<id>` — quem já tem janela aberta não precisa de tela de venda. Passa para o cliente: `eventId`, `titulo`, `capa` (tema/fontes/fotoUrl), `host`, `publicadoEm`, `temIncluido` (booleano de `temPasseIncluido`), `incluidosRestantes`, `precoCents`, `horas`.

- [ ] **Step 2: O cliente**

Um cartão único, sem barulho, com:

- chapéu: **"Convite publicado"**; título: **"Liberar edição do site"**;
- a capa do convite + o endereço + "publicado em <data>";
- a lista do que abre: *"Textos, data, local, capa, template, cores e as seções do site."*;
- a garantia, em destaque: **"O site atual continua no ar até você publicar as alterações."**;
- o prazo: **"Vale 48 horas. Compra única, sem assinatura e sem renovação."**;
- se `temIncluido`: botão primário **"Usar a liberação do meu plano"** (chama `usarPasseIncluido`) e, abaixo, em texto pequeno, quantas restam naquele convite;
- se não: botão primário **"Liberar por R$ 19,90 no Pix"** (chama `comprarPasseEdicao`), que troca o cartão pelo QR + copia-e-cola, com a linha **"Assim que o Pix cair, a edição abre sozinha — pode deixar esta tela aberta."**;
- em ambos os casos, ao voltar `{ ok: true }`, `router.push(\`/painel/criar?id=${eventId}\`)`.

Reusar o padrão de QR/copia-e-cola que já existe no fluxo de presente (`app/%5Fsites/[sub]/presentes`) para não inventar componente novo.

- [ ] **Step 3: Ver com os próprios olhos**

Run: `pnpm build && pnpm start`, abrir `/painel/<id>/liberar` num convite publicado e fechado.
Expected: a tela abre, o botão gera o Pix (no dev, o `FakePaymentProvider`), e a janela **não** abre sozinha.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/painel/[id]/liberar"
git commit -m "feat(painel): tela de liberar a edicao do convite publicado"
```

---

### Task 8: O aviso no fim da criação (e a faixa da janela)

**Files:**
- Modify: `app/(dashboard)/painel/criar/CriarConvite.tsx:2329-2395` (passo 6)
- Modify: `app/(dashboard)/painel/criar/CriarConvite.tsx:2427-2445` (rodapé/botão publicar)

**Interfaces:**
- Consumes: `kind: "fechado"` das actions (Task 3); rota `/painel/[id]/liberar` (Task 7).
- Produces: nada para tarefas seguintes.

- [ ] **Step 1: O cartão de aviso**

No passo 6, **depois** do cartão "Antes de publicar" e **antes** do cartão da marca, um cartão com fundo de atenção (borda `#F0D9A8`, fundo `#FDF8EF`, mesma família visual dos avisos do painel):

> **Depois de publicar, o site fica fechado.**
> Confira nome, data, hora, endereço, textos e visual. Para mudar qualquer uma dessas coisas depois, é preciso liberar a edição. Confirmações, recados e presentes recebidos você continua acompanhando normalmente.

- [ ] **Step 2: Publicar em dois toques**

Trocar o botão "Publicar convite" por um estado local `confirmandoPub`:

- 1º toque: o botão vira **"Confirmar e publicar"** e aparece ao lado o link **"Voltar e revisar"** (limpa o estado);
- 2º toque: chama `enviar(true)`.

Nada de `window.confirm`. Mesmo padrão de `ListaConvites.tsx:60-70`.

- [ ] **Step 3: Endereço travado na republicação**

Quando `initialEventId` existir **e** o convite já estiver publicado, o campo do endereço vira somente leitura, com a nota: *"O endereço não muda depois de publicado — o link que você já enviou continua valendo."* (Passar um `slugTravado: boolean` do server para o componente.)

- [ ] **Step 4: A faixa da janela aberta**

Quando o editor abrir com o convite já publicado, uma faixa fixa no topo do painel de edição:

> Edição liberada até **20/08 às 18h40**. O público ainda vê a versão anterior.

E o botão final passa a se chamar **"Publicar alterações"**.

- [ ] **Step 5: Tratar o `kind: "fechado"`**

No `enviar`, se a action devolver `kind === "fechado"`, mandar para `/painel/${eventId}/liberar` em vez de mostrar erro solto.

- [ ] **Step 6: Ver e commitar**

Run: `pnpm build && pnpm start`, criar um convite até o passo 6.
Expected: o aviso aparece, o botão exige dois toques, publica.

```bash
git add "app/(dashboard)/painel/criar/CriarConvite.tsx"
git commit -m "feat(editor): o aviso de que publicar fecha o site, com dois toques"
```

---

### Task 9: "Meus convites" sem prometer edição

**Files:**
- Modify: `app/(dashboard)/painel/convites/page.tsx:60-98`
- Modify: `app/(dashboard)/painel/convites/ListaConvites.tsx:16-30` e `:170-215`

**Interfaces:**
- Consumes: rota `/painel/[id]/liberar` (Task 7).
- Produces: `ItemConvite` ganha `foraDoAr: boolean`.

- [ ] **Step 1: Ajustar os dados**

Em `convites/page.tsx`, incluir `foraDoAr` no `ItemConvite`. Trocar a linha de apoio do cabeçalho por: *"Acompanhe seus convites e continue os rascunhos."*

- [ ] **Step 2: Ajustar o card**

Em `ListaConvites.tsx`:

- o selo da capa passa a ter três estados: `Publicado` (verde), `Fora do ar` (cinza) e `Em criação` (roxo);
- publicado: botão primário **"Acompanhar"** (sem o ícone `IC.edit`, que promete edição — usar `IC.eye` no secundário e um ícone neutro no primário) + **"Ver"**;
- rascunho: botão **"Continuar"** → `/painel/criar?id=<id>`;
- abaixo dos botões, só no publicado, um link discreto (`text-[12.5px] text-[#6e6e76]`): **"Precisa mudar algo no site?"** → `/painel/<id>/liberar`.

- [ ] **Step 3: Ver e commitar**

Run: `pnpm build && pnpm start`, abrir `/painel/convites`.
Expected: nenhum botão de editar em convite publicado.

```bash
git add "app/(dashboard)/painel/convites"
git commit -m "refactor(convites): o card publicado nao promete mais edicao"
```

---

### Task 10: A tela do convite só com o que é vivo

**Files:**
- Modify: `app/(dashboard)/painel/[id]/page.tsx:88-100` (menu) e `:150-175` (ações do herói) e `:270-300` (zona de ajustes)

**Interfaces:**
- Consumes: `voltarAoAr` (Task 2); rota `/liberar` (Task 7); rota `/recados` (Task 12).
- Produces: nada.

- [ ] **Step 1: Herói**

Remover os botões **"Editar o site"** e **"Trocar o estilo"**. No lugar: **"Ver site ↗"** e **"Copiar link"** (já existem, sobem para a ação principal) e um botão secundário **"Liberar edição"** → `/painel/<id>/liberar`. Ao lado do selo "No ar", acrescentar um segundo selo: **"Edição fechada"**.

- [ ] **Step 2: Menu**

O array `menu` passa a ser só o que é vivo:

```tsx
  const menu = [
    { label: "Convidados", desc: "Lista e confirmações", href: `${base}/convidados`, icon: "bi-people" },
    { label: "Recados", desc: "O que os convidados escreveram", href: `${base}/recados`, icon: "bi-chat-heart" },
    { label: "Recebimentos", desc: "Presentes recebidos e resgate por Pix", href: `${base}/cofre`, icon: "bi-wallet2" },
  ];
```

E o subtítulo do cartão vira *"Acompanhe o que está acontecendo no seu convite"*.

- [ ] **Step 3: Zona de ajustes**

O botão "Tirar do ar" continua (agora grava `foraDoAr`). Quando `event.foraDoAr` for `true`, mostrar no lugar **"Voltar ao ar"** (action `voltarAoAr`) e trocar o selo do topo para **"Fora do ar"**.

- [ ] **Step 4: Ver e commitar**

Run: `pnpm build && pnpm start`, abrir `/painel/<id>` publicado.
Expected: sem "Editar o site", sem "Trocar o estilo"; tirar do ar e voltar funcionam sem destravar o editor.

```bash
git add "app/(dashboard)/painel/[id]/page.tsx"
git commit -m "refactor(painel): a tela do convite mostra so o que continua vivo"
```

---

### Task 11: "Recursos do site" honesto e a morte das telas legadas

**Files:**
- Modify: `app/(dashboard)/painel/[id]/recursos/page.tsx`
- Rewrite: `app/(dashboard)/painel/[id]/recursos/RecursosCliente.tsx` → vira `RecursosLeitura.tsx`
- Delete: `app/(dashboard)/painel/[id]/detalhes/`, `estilo/`, `fotos/`, `presentes/`, `programacao/`
- Modify: `app/(dashboard)/painel/acoes.ts` — remover `atualizarDetalhes`, `salvarEstilo`, `salvarRecursos`, `salvarFotos`, `salvarPresentes`, `salvarProgramacao`
- Modify: qualquer link remanescente para essas rotas (procurar com `grep -rn "/detalhes\|/estilo\|/programacao" app components`)

**Interfaces:**
- Consumes: `RECURSOS_SITE`, `lerToggles` de `@/lib/recursos`; `publishedEditorDocument` de `@/lib/event-editor/public-document`.
- Produces: nada.

- [ ] **Step 1: Ler do lugar certo**

A tela passa a ler o que **está no ar**: `publishedEditorDocument(event)` e, dele, `rsvp.enabled`, `gifts.enabled`, `schedule.program.enabled`, `messages.enabled`, `gallery.enabled` (contador é sempre ligado no render — mostrar como "Sempre ativo"). Se não houver documento publicado, cair para `lerToggles(event.customization)`.

- [ ] **Step 2: Só leitura**

Cada recurso vira uma linha com o rótulo **"Ativo no site"** (verde) ou **"Oculto no site"** (cinza) — sem `role="switch"`, sem formulário, sem botão "Salvar". No fim, um único botão: **"Liberar edição"** → `/painel/<id>/liberar`. Some o bloco de upsell tracejado inteiro (`bloqueados`, `planoLibera`, `PLAN_ORDER`, `rotuloPlano`), que hoje nunca renderiza.

O título da página passa a ser **"O que está no ar"**, e a linha de apoio: *"Isto é o que seus convidados veem hoje. Para mudar, libere a edição."*

- [ ] **Step 3: Apagar o que mente**

Apagar os cinco diretórios e as seis server actions listadas acima. Rodar `pnpm lint` e `npx tsc --noEmit -p tsconfig.json` para achar toda referência pendurada e limpar.

- [ ] **Step 4: Portão verde e commit**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: PASS.

```bash
git add -A "app/(dashboard)/painel"
git commit -m "refactor(recursos): a tela mostra o que esta no ar; morrem as telas que nao valiam mais"
```

---

### Task 12: Moderar recados (o lado vivo precisa existir)

**Files:**
- Create: `app/(dashboard)/painel/[id]/recados/page.tsx`
- Create: `app/(dashboard)/painel/[id]/recados/ListaRecados.tsx`
- Modify: `app/(dashboard)/painel/acoes.ts` (acrescentar `esconderRecado` / `mostrarRecado` / `excluirRecado`)
- Modify: `lib/recados.ts` (garantir que o site só sirva `approved: true`)

**Interfaces:**
- Consumes: `Recado.approved` (já existe no schema); `CARD`, `COLUNA`, `TITULO`, `BTN_VOLTAR` de `../../_ui/estilos`.
- Produces: rota `/painel/[id]/recados` (referenciada pelo menu da Task 10).

- [ ] **Step 1: Confirmar o filtro no site**

Ler `lib/recados.ts` e conferir se a consulta pública filtra `approved: true`. Se não filtrar, é o primeiro conserto — sem isso, esconder um recado no painel não o tira do site.

- [ ] **Step 2: A tela**

Lista simples: nome, mensagem, data, e por linha duas ações — **"Esconder do site"** (alterna `approved`) e **"Apagar"** (confirmação em dois toques, como `ExcluirEvento.tsx`). Recado escondido aparece esmaecido com o rótulo **"Oculto"**.

- [ ] **Step 3: Ver e commitar**

Run: `pnpm build && pnpm start`, deixar um recado pelo site e escondê-lo pelo painel.
Expected: o recado some do site sem passar por nenhuma janela de edição.

```bash
git add "app/(dashboard)/painel/[id]/recados" "app/(dashboard)/painel/acoes.ts" lib/recados.ts
git commit -m "feat(recados): moderar recado sem precisar liberar a edicao"
```

---

### Task 13: Portão verde final

- [ ] **Step 1: Unidade**

Run: `pnpm test`
Expected: PASS (incluindo `lib/edicao.test.ts` e `lib/event.test.ts`).

- [ ] **Step 2: Dinheiro (com banco)**

Run: `PAGAMENTO_DB_TESTS=1 DATABASE_URL=<postgres local> pnpm test tests/`
Expected: PASS, incluindo idempotência do passe.

- [ ] **Step 3: Lint, tipos e build**

Run: `pnpm lint && npx tsc --noEmit && pnpm build`
Expected: PASS.

- [ ] **Step 4: E2E contra o build**

Run: `pnpm start` num terminal; `E2E_BASE_URL=http://127.0.0.1:3000 E2E_DATABASE_READY=1 pnpm test:e2e` no outro.
Expected: PASS.

- [ ] **Step 5: Percurso manual, com os olhos**

1. Criar convite → passo 6 mostra o aviso → publicar em dois toques.
2. Dentro de 1h: `/painel/criar?id=<id>` abre (cortesia) e republica.
3. Forçar `edicaoAte` para o passado: o mesmo link redireciona para `/liberar`.
4. Numa conta `CLASSICO`: "Usar a liberação do meu plano" abre o editor; a segunda vez no mesmo convite não abre mais.
5. "Tirar do ar": o site mostra "Convite fora do ar" e o editor **continua** fechado.
