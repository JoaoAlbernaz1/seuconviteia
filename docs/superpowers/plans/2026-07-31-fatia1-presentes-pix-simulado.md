# Fatia 1 — Convidado presenteia de verdade (Pix simulado) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No site publicado, o convidado presenteia um item da lista pagando um Pix (simulado); a plataforma retém a taxa de 5% e credita o líquido no cofre do convite.

**Architecture:** Modelo "conta única + carteira interna" (spec `2026-07-31-lista-presentes-split-pix-taxa-design.md`). Fundação (schema Prisma + adapter de pagamento com provider Fake + lógica pura de contribuição/taxa) sustenta uma server action e um modal no site do evento. O gateway real (Asaas) entra na Fatia 4 trocando só o provider.

**Tech Stack:** Next 16 (App Router, server actions), Prisma 6 (MySQL `sc-mysql`), Zod, Vitest, Tailwind v4. `pnpm` para tudo.

---

### Task 1: Schema Prisma — cotas, contribuição, payout

**Files:**
- Modify: `prisma/schema.prisma` (enums + GiftItem + Event + novos models GiftContribution/Payout)

- [ ] **Step 1: Adicionar enums e campos.** Em `prisma/schema.prisma`:

Depois de `enum GiftMode { PIX ITEM }` adicionar:
```prisma
enum GiftPricing {
  FIXO
  COTAS
  LIVRE
}

enum PayStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}
```

Em `model GiftItem`, adicionar (mantendo os campos atuais):
```prisma
  pricingMode GiftPricing @default(FIXO)
  quotaCount  Int?
  contributions GiftContribution[]
```

Em `model Event`, adicionar (dados de recebimento do dono — nunca expostos no site):
```prisma
  payoutPixKey  String?
  payoutPixName String?
  contributions GiftContribution[]
  payouts       Payout[]
```

Novos models (após `Transaction`):
```prisma
/// Uma contribuicao de um convidado a um item da lista (presente via Pix).
model GiftContribution {
  id              String    @id @default(cuid())
  eventId         String
  event           Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  giftItemId      String
  giftItem        GiftItem  @relation(fields: [giftItemId], references: [id], onDelete: Cascade)
  buyerName       String
  buyerContact    String?
  message         String?   @db.Text
  quotas          Int?
  grossCents      Int
  feeCents        Int
  netCents        Int
  status          PayStatus @default(PENDING)
  provider        String    @default("fake")
  providerChargeId String?
  pixCode         String?   @db.Text
  pixQrUrl        String?   @db.Text
  paidAt          DateTime?
  createdAt       DateTime  @default(now())

  @@index([eventId])
  @@index([giftItemId])
  @@index([status])
}

/// Resgate (saque) do saldo de um convite para a chave Pix do dono.
model Payout {
  id                 String    @id @default(cuid())
  eventId            String
  event              Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  amountCents        Int
  pixKey             String
  pixName            String?
  status             PayStatus @default(PENDING)
  provider           String    @default("fake")
  providerTransferId String?
  createdAt          DateTime  @default(now())
  paidAt             DateTime?

  @@index([eventId])
}
```

- [ ] **Step 2: Aplicar no banco.**

Run: `pnpm db:push`
Expected: "Your database is now in sync with your Prisma schema." + client regenerado.

- [ ] **Step 3: Sanidade do client.**

Run: `pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | head -20`
Expected: sem erros novos referentes a Prisma (`prisma.giftContribution`, `prisma.payout` passam a existir).

- [ ] **Step 4: Commit.**

```bash
git add prisma/schema.prisma
git commit -m "feat(presentes): schema de contribuicao, cotas e payout"
```

---

### Task 2: Cálculo da taxa (puro, TDD)

**Files:**
- Create: `lib/pagamentos/taxa.ts`
- Test: `lib/pagamentos/taxa.test.ts`

- [ ] **Step 1: Teste que falha.** Criar `lib/pagamentos/taxa.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { TAXA_BPS, calcularTaxaCents, calcularLiquidoCents } from "./taxa";

describe("taxa da plataforma", () => {
  it("TAXA_BPS = 500 (5%)", () => {
    expect(TAXA_BPS).toBe(500);
  });
  it("5% de R$100,00 = R$5,00", () => {
    expect(calcularTaxaCents(10_000)).toBe(500);
    expect(calcularLiquidoCents(10_000)).toBe(9_500);
  });
  it("arredonda para o centavo", () => {
    // 5% de 199 = 9.95 -> 10
    expect(calcularTaxaCents(199)).toBe(10);
  });
  it("valores invalidos -> taxa 0", () => {
    expect(calcularTaxaCents(0)).toBe(0);
    expect(calcularTaxaCents(-5)).toBe(0);
    expect(calcularTaxaCents(1.5)).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar.**

Run: `pnpm exec vitest run lib/pagamentos/taxa.test.ts`
Expected: FAIL ("Cannot find module './taxa'").

- [ ] **Step 3: Implementar.** Criar `lib/pagamentos/taxa.ts`:
```ts
// Taxa da plataforma sobre a lista de presentes. Fonte unica de verdade.
// Modelo: o dono assume a taxa (liquido = bruto - taxa). Gancho futuro:
// repassar ao convidado (bruto + taxa) fica na Fatia 4.
export const TAXA_BPS = 500; // 5,00% em basis points

/** Taxa em centavos sobre um bruto em centavos. Bruto invalido -> 0. */
export function calcularTaxaCents(brutoCents: number): number {
  if (!Number.isInteger(brutoCents) || brutoCents <= 0) return 0;
  return Math.round((brutoCents * TAXA_BPS) / 10_000);
}

/** Liquido que vai para o cofre do dono (bruto - taxa). */
export function calcularLiquidoCents(brutoCents: number): number {
  return brutoCents - calcularTaxaCents(brutoCents);
}
```

- [ ] **Step 4: Rodar e ver passar.**

Run: `pnpm exec vitest run lib/pagamentos/taxa.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit.**

```bash
git add lib/pagamentos/taxa.ts lib/pagamentos/taxa.test.ts
git commit -m "feat(pagamentos): calculo puro da taxa da plataforma"
```

---

### Task 3: Lógica de contribuição por modo de preço (puro, TDD)

**Files:**
- Create: `lib/pagamentos/contribuicao.ts`
- Test: `lib/pagamentos/contribuicao.test.ts`

- [ ] **Step 1: Teste que falha.** Criar `lib/pagamentos/contribuicao.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { valorDaContribuicao, saldoDoEvento } from "./contribuicao";

describe("valorDaContribuicao", () => {
  it("FIXO usa o preco do item", () => {
    const r = valorDaContribuicao({ pricingMode: "FIXO", priceCents: 15_000 }, {});
    expect(r).toEqual({ ok: true, brutoCents: 15_000, quotas: undefined });
  });
  it("COTAS: 2 cotas de R$100 (item R$1000 / 10) = R$200", () => {
    const r = valorDaContribuicao(
      { pricingMode: "COTAS", priceCents: 100_000, quotaCount: 10 },
      { quotas: 2 },
    );
    expect(r).toEqual({ ok: true, brutoCents: 20_000, quotas: 2 });
  });
  it("COTAS exige quotas >= 1", () => {
    const r = valorDaContribuicao(
      { pricingMode: "COTAS", priceCents: 100_000, quotaCount: 10 },
      { quotas: 0 },
    );
    expect(r.ok).toBe(false);
  });
  it("LIVRE: valor custom respeitando o minimo (= priceCents)", () => {
    expect(valorDaContribuicao({ pricingMode: "LIVRE", priceCents: 5_000 }, { valorCustomCents: 8_000 }))
      .toEqual({ ok: true, brutoCents: 8_000, quotas: undefined });
    expect(valorDaContribuicao({ pricingMode: "LIVRE", priceCents: 5_000 }, { valorCustomCents: 3_000 }).ok)
      .toBe(false);
  });
});

describe("saldoDoEvento", () => {
  it("soma liquidos PAGOS menos payouts (PAGO/PENDENTE)", () => {
    const saldo = saldoDoEvento(
      [
        { netCents: 9_500, status: "PAID" },
        { netCents: 9_500, status: "PENDING" }, // ignora (nao pago)
      ],
      [{ amountCents: 4_000, status: "PENDING" }],
    );
    expect(saldo).toBe(5_500);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar.**

Run: `pnpm exec vitest run lib/pagamentos/contribuicao.test.ts`
Expected: FAIL ("Cannot find module './contribuicao'").

- [ ] **Step 3: Implementar.** Criar `lib/pagamentos/contribuicao.ts`:
```ts
export type GiftPricing = "FIXO" | "COTAS" | "LIVRE";
export type PayStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface ItemConfig {
  pricingMode: GiftPricing;
  priceCents: number;
  quotaCount?: number | null;
}
export interface EscolhaConvidado {
  quotas?: number;
  valorCustomCents?: number;
}
export type ResultadoValor =
  | { ok: true; brutoCents: number; quotas: number | undefined }
  | { ok: false; erro: string };

/** Valor da cota (item COTAS): preco total / nº de cotas, arredondado ao centavo. */
export function valorDaCotaCents(priceCents: number, quotaCount: number): number {
  return Math.round(priceCents / quotaCount);
}

/** Deriva o bruto (em centavos) de uma contribuicao conforme o modo do item. */
export function valorDaContribuicao(item: ItemConfig, escolha: EscolhaConvidado): ResultadoValor {
  if (item.pricingMode === "FIXO") {
    if (item.priceCents <= 0) return { ok: false, erro: "Item sem preco." };
    return { ok: true, brutoCents: item.priceCents, quotas: undefined };
  }
  if (item.pricingMode === "COTAS") {
    const total = item.quotaCount ?? 0;
    const q = escolha.quotas ?? 0;
    if (total < 1) return { ok: false, erro: "Item sem cotas configuradas." };
    if (!Number.isInteger(q) || q < 1 || q > total) return { ok: false, erro: "Escolha 1 ou mais cotas." };
    return { ok: true, brutoCents: valorDaCotaCents(item.priceCents, total) * q, quotas: q };
  }
  // LIVRE
  const v = escolha.valorCustomCents ?? 0;
  if (!Number.isInteger(v) || v < item.priceCents) {
    return { ok: false, erro: "Valor abaixo do minimo." };
  }
  return { ok: true, brutoCents: v, quotas: undefined };
}

/** Saldo do convite = Σ liquidos PAGOS − Σ payouts (PAGO ou PENDENTE, ja reservados). */
export function saldoDoEvento(
  contribs: { netCents: number; status: PayStatus }[],
  payouts: { amountCents: number; status: PayStatus }[],
): number {
  const entrou = contribs.filter((c) => c.status === "PAID").reduce((s, c) => s + c.netCents, 0);
  const saiu = payouts
    .filter((p) => p.status === "PAID" || p.status === "PENDING")
    .reduce((s, p) => s + p.amountCents, 0);
  return entrou - saiu;
}
```

- [ ] **Step 4: Rodar e ver passar.**

Run: `pnpm exec vitest run lib/pagamentos/contribuicao.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add lib/pagamentos/contribuicao.ts lib/pagamentos/contribuicao.test.ts
git commit -m "feat(pagamentos): logica pura de contribuicao (fixo/cotas/livre) e saldo"
```

---

### Task 4: Adapter de pagamento (interface + provider Fake + stub Asaas)

**Files:**
- Create: `lib/pagamentos/index.ts`
- Test: `lib/pagamentos/index.test.ts`

- [ ] **Step 1: Teste que falha.** Criar `lib/pagamentos/index.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { FakePaymentProvider } from "./index";

describe("FakePaymentProvider", () => {
  const p = new FakePaymentProvider();
  it("cria cobranca Pix com codigo e QR", async () => {
    const c = await p.criarCobrancaPix({ valorCents: 10_000, descricao: "Presente", referencia: "abc123" });
    expect(c.chargeId).toContain("abc123");
    expect(c.pixCode.length).toBeGreaterThan(10);
    expect(c.pixQrUrl.startsWith("data:image/svg+xml")).toBe(true);
    expect(c.status).toBe("PENDING");
  });
  it("transferir (payout) resolve PAID", async () => {
    const t = await p.transferir({ valorCents: 9_500, pixKey: "chave@ex.com", referencia: "pay1" });
    expect(t.status).toBe("PAID");
    expect(t.transferId).toContain("pay1");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar.**

Run: `pnpm exec vitest run lib/pagamentos/index.test.ts`
Expected: FAIL ("Cannot find module './index'" ou export ausente).

- [ ] **Step 3: Implementar.** Criar `lib/pagamentos/index.ts`:
```ts
// Adapter de pagamento (seam de produção, espelha lib/storage/index.ts):
//   - ASAAS_API_KEY setado -> AsaasPaymentProvider (Fatia 4, ainda stub)
//   - sem chave (dev)       -> FakePaymentProvider (Pix simulado)
import type { PayStatus } from "./contribuicao";

export interface CobrancaPixInput {
  valorCents: number;
  descricao: string;
  referencia: string; // ex.: id da contribuicao
  pagador?: { nome?: string };
}
export interface CobrancaPix {
  chargeId: string;
  pixCode: string; // copia-e-cola
  pixQrUrl: string; // data URI ou URL
  status: PayStatus;
}
export interface TransferirInput {
  valorCents: number;
  pixKey: string;
  referencia: string;
}
export interface Transferencia {
  transferId: string;
  status: PayStatus;
}

export interface PaymentProvider {
  readonly nome: string;
  criarCobrancaPix(input: CobrancaPixInput): Promise<CobrancaPix>;
  consultarCobranca(chargeId: string): Promise<{ status: PayStatus }>;
  transferir(input: TransferirInput): Promise<Transferencia>;
}

/** QR de mentira (SVG) só p/ o fluxo simulado parecer real. */
function fakeQrDataUri(seed: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="196" height="196" viewBox="0 0 196 196">` +
    `<rect width="196" height="196" fill="#fff"/>` +
    `<rect x="16" y="16" width="164" height="164" fill="none" stroke="#2e1a20" stroke-width="6"/>` +
    `<text x="98" y="104" text-anchor="middle" font-family="monospace" font-size="12" fill="#93264a">PIX ${seed.slice(0, 6)}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Pix simulado: cobrança nasce PENDING; a confirmação vem da nossa action (webhook fake). */
export class FakePaymentProvider implements PaymentProvider {
  readonly nome = "fake";
  async criarCobrancaPix(input: CobrancaPixInput): Promise<CobrancaPix> {
    const chargeId = `fake_${input.referencia}`;
    const pixCode = `00020126FAKE-${input.referencia}-${input.valorCents}5204000053039865802BR6009SEUCONVITE`;
    return { chargeId, pixCode, pixQrUrl: fakeQrDataUri(input.referencia), status: "PENDING" };
  }
  async consultarCobranca(): Promise<{ status: PayStatus }> {
    return { status: "PENDING" }; // no fake, quem confirma é a action confirmarPresente
  }
  async transferir(input: TransferirInput): Promise<Transferencia> {
    return { transferId: `faketransfer_${input.referencia}`, status: "PAID" };
  }
}

/** Stub — implementado na Fatia 4 (igual VercelBlobStorage). */
export class AsaasPaymentProvider implements PaymentProvider {
  readonly nome = "asaas";
  async criarCobrancaPix(): Promise<CobrancaPix> {
    throw new Error("Asaas ainda nao implementado — rode sem ASAAS_API_KEY (Pix simulado) em dev.");
  }
  async consultarCobranca(): Promise<{ status: PayStatus }> {
    throw new Error("Asaas ainda nao implementado.");
  }
  async transferir(): Promise<Transferencia> {
    throw new Error("Asaas ainda nao implementado.");
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (process.env.ASAAS_API_KEY) return new AsaasPaymentProvider();
  return new FakePaymentProvider();
}
```

- [ ] **Step 4: Rodar e ver passar.**

Run: `pnpm exec vitest run lib/pagamentos/index.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add lib/pagamentos/index.ts lib/pagamentos/index.test.ts
git commit -m "feat(pagamentos): adapter PaymentProvider (Fake + stub Asaas)"
```

---

### Task 5: Server actions — iniciar e confirmar presente

**Files:**
- Create: `app/%5Fsites/[sub]/presentes/acoes.ts`
- Read primeiro: `lib/event.ts` (`eventoPublico`), `lib/db.ts` (singleton `prisma`), `lib/tenant.ts` (resolução de subdomínio se necessário), `app/%5Fsites/[sub]/confirmar/` (padrão de server action já existente no site do evento — copiar o estilo de `"use server"`, Zod, `revalidatePath`).

**Contrato (deve casar com Task 3/4):**
- `iniciarPresente(input): Promise<{ ok: true; contributionId: string; pixCode: string; pixQrUrl: string } | { ok: false; erro: string }>`
- `confirmarPresente(contributionId: string): Promise<{ ok: boolean }>`

- [ ] **Step 1: Escrever `iniciarPresente`.** Zod valida `{ sub, giftItemId, buyerName (1..80), buyerContact? , message? (<=500), quotas?, valorCustomCents? }`. Fluxo:
  1. Resolver `event` por `sub` (mesmo caminho de `carregarEventoFesta`/`eventoPublico`); rejeitar se não publicado.
  2. Buscar `giftItem` por id **e** `eventId` (isolamento por tenant); rejeitar se de outro evento.
  3. `valorDaContribuicao({pricingMode, priceCents, quotaCount}, {quotas, valorCustomCents})` → se `!ok`, retornar `{ ok:false, erro }`.
  4. Para COTAS: recomputar arrecadado (`prisma.giftContribution.aggregate` `_sum.quotas` onde `giftItemId` e `status=PAID`) e rejeitar se `arrecadado + quotas > quotaCount` (erro "Esse presente já foi completado.").
  5. `feeCents = calcularTaxaCents(bruto)`, `netCents = calcularLiquidoCents(bruto)`.
  6. Criar `GiftContribution` (status PENDING, provider = `getPaymentProvider().nome`).
  7. `getPaymentProvider().criarCobrancaPix({ valorCents: bruto, descricao: item.title, referencia: contribution.id, pagador:{nome} })`.
  8. `prisma.giftContribution.update` gravando `providerChargeId/pixCode/pixQrUrl`.
  9. Retornar `{ ok:true, contributionId, pixCode, pixQrUrl }`.

- [ ] **Step 2: Escrever `confirmarPresente`** (o "webhook fake" disparado pelo botão do convidado). Fluxo idempotente:
  1. Buscar contribuição por id; se já `PAID`, retornar `{ ok:true }`.
  2. `update` → `status: PAID`, `paidAt: new Date()`.
  3. Criar `Transaction { eventId, amountCents: grossCents, kind: "GIFT_PIX", status: "PAID", providerId: providerChargeId }`.
  4. Se o item COTAS/FIXO ficou completo (arrecadado >= total), marcar `giftItem.purchased = true`.
  5. `revalidatePath` da página `/presentes` do subdomínio.
  6. Retornar `{ ok:true }`.

- [ ] **Step 3: Teste manual rápido (curl não serve p/ server action).** Deixar a verificação real p/ Task 7 (Playwright). Aqui só garantir build: `pnpm exec tsc --noEmit 2>&1 | grep -i "presentes/acoes" || echo "sem erro de tipo na action"`.

- [ ] **Step 4: Commit.**

```bash
git add "app/%5Fsites/[sub]/presentes/acoes.ts"
git commit -m "feat(presentes): server actions iniciar/confirmar presente (Pix simulado)"
```

---

### Task 6: UI — modal de presentear + itens clicáveis

**Files:**
- Modify: `lib/eventoFesta.ts` — `PresenteItem` passa a carregar `id`, `pricingMode`, `priceCents`, `quotaCount`, `arrecadadoCents`/`cotasVendidas` (para a barra de progresso). Ajustar o mapeamento `event.gifts -> presentes` (perto da linha 226-232 e onde `PresenteItem` é definido em `lib/textos.ts`/tipo).
- Create: `components/evt/PresentearModal.tsx` (client) — recebe o item (id, modo, preço, cotas restantes), renderiza o passo-a-passo: valor/cota → nome + recado (+ consentimento LGPD) → chama `iniciarPresente` → mostra QR + copia-e-cola + botão "Confirmar pagamento" → chama `confirmarPresente` → tela de obrigada.
- Modify: `components/evt/PainelPresentes.tsx` — os botões "Presentear" e "Copiar chave" passam a abrir o `PresentearModal` do item (mantendo o visual atual). O bloco "Ou, se preferir / Pix direto" só aparece se **não** houver gateway/itens pagáveis (fallback do modelo antigo).
- Modify: `components/templates/quinze-anos/glamour-rose/Presentes.tsx` — passar os itens completos (com id/modo) ao `PainelPresentes`.

- [ ] **Step 1: Estender `PresenteItem` e o mapeamento** em `lib/eventoFesta.ts` (e o tipo em `lib/textos.ts` se for lá). Cada `gift` vira `{ id, titulo, descricao, valorLabel, pricingMode, priceCents, quotaCount, cotasVendidas }`. `cotasVendidas`/`arrecadadoCents` vêm de um aggregate por item (status PAID) — buscar junto no `carregarEventoFesta` (já faz `include: { gifts: ... }`; adicionar `contributions` agregadas ou uma query extra).

- [ ] **Step 2: Criar `PresentearModal.tsx`** (client). Estados: `etapa` (`valor` | `pix` | `ok`), `pixCode`, `pixQrUrl`, `contributionId`, `erro`, `enviando`. Usa `startTransition`. Copiar chave com feedback (reaproveitar o padrão de `PainelPresentes`). Visual com tokens `--ev-*`/`font-evt-*` (respeitar reduced-motion). Acessível (foco no modal, ESC fecha, `aria-modal`).

- [ ] **Step 3: Ligar no `PainelPresentes`** — cada `li` de item ganha `onClick`/botão que abre o modal daquele item (precisa `"use client"`, que o componente já é). Barra de progresso p/ COTAS ("cota 3 de 10") e p/ item comprado ("Presente já realizado 🎉", botão desabilitado).

- [ ] **Step 4: Verificar build + lint.**

Run: `pnpm exec tsc --noEmit 2>&1 | grep -iE "presentear|painelpresentes|eventoFesta" || echo "tipos ok"`
Run: `pnpm run build 2>&1 | tail -5`
Expected: build limpo.

- [ ] **Step 5: Commit.**

```bash
git add lib/eventoFesta.ts lib/textos.ts components/evt/PresentearModal.tsx components/evt/PainelPresentes.tsx "components/templates/quinze-anos/glamour-rose/Presentes.tsx"
git commit -m "feat(presentes): modal de presentear com Pix simulado e progresso de cotas"
```

---

### Task 7: Verificação E2E (Playwright) + prova no banco

**Files:**
- Usar o harness Playwright do scratchpad (chromium já instalado em sessões anteriores: `scratchpad/node_modules`).

- [ ] **Step 1: Preparar dados.** Garantir que o evento demo `maria-clara` (ou criar um evento de teste publicado, 15 anos, glamour-rose) tenha ao menos 1 gift FIXO e 1 gift COTAS (setar `pricingMode`/`quotaCount` via `prisma` ou `mcp` SQL).

- [ ] **Step 2: Rodar o fluxo** headless em `http://<slug>.localhost:3000/presentes`: abrir, clicar "Presentear" num item → preencher nome/recado → "Gerar Pix" → ver QR/código → "Confirmar pagamento" → ver tela de obrigada. Screenshot em `scratchpad/presente-*.png`.

- [ ] **Step 3: Provar no banco** que subiu: `prisma.giftContribution` com `status=PAID`, `feeCents`/`netCents` corretos, e `saldoDoEvento` = líquido. Query via `pnpm exec tsx` script no scratchpad ou MCP SQL.

- [ ] **Step 4: Abrir no navegador do João** (`open http://<slug>.localhost:3000/presentes`) — ele valida vendo ao vivo (regra do projeto: decide vendo, não por screenshot headless).

- [ ] **Step 5: Commit** (se algum ajuste de dados de seed for durável) e reportar o resultado.

---

## Notas de execução
- **Sem migração destrutiva:** `db:push` no `sc-mysql` (dev). Campos novos são nullable/opcionais → dados existentes seguem válidos.
- **Fuso:** `paidAt`/datas em -03:00 (regra do projeto; usar o mesmo helper das outras actions).
- **Cache do dev:** para conferir dado novo no site, `?cb=$RANDOM` (fura o cache por-URL do dev server).
- **Regra do João:** mostrar/commitar em fatias; ele valida vendo ao vivo. Ao fim da Fatia 1, `open` no navegador dele antes de seguir p/ Fatia 2 (painel do dono).
