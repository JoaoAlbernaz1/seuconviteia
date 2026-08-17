# Assinatura do SaaS via Mercado Pago — plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cobrar de verdade a assinatura mensal do SaaS (Clássico R$ 59, Premium R$ 149) por cartão recorrente do Mercado Pago, e fazer o plano ser concedido só pelo gateway — nunca pelo clique.

**Architecture:** A conta ganha estado de assinatura (`mpPreapprovalId`, `assinaturaStatus`, `assinaturaAte`). O botão do painel cria um `preapproval` no MP **sem cartão** e redireciona para o `init_point` hospedado por eles; o cartão nunca passa pelo nosso site. O plano efetivo é **derivado na leitura** (`planoEfetivo`) a partir de status + vencimento, então não existe janela em que a linha diz PREMIUM e o direito já venceu. O webhook aplica os eventos de assinatura de forma idempotente, com `providerId` único como rede.

**Tech Stack:** Next.js 16 (App Router, server actions), Prisma 6 + PostgreSQL, Mercado Pago REST (`POST /preapproval`), Vitest.

## Global Constraints

- Preços vêm de `lib/plans.ts` (`PLANOS_INFO[].mensalidadeCents`): Básico 0, Clássico 5900, Premium 14900. **Nunca inventar valor.**
- O cartão é digitado **no Mercado Pago**. Não criar campo de cartão, não usar `card_token_id`.
- Nenhum caminho concede plano pago sem confirmação do gateway.
- Comentários em português, explicando **por quê**, no estilo do repo.
- `pnpm test`, `pnpm lint` e `npx tsc --noEmit` verdes antes de cada commit.
- Migrations: escrever o SQL à mão em `prisma/migrations/<timestamp>_<nome>/migration.sql` e aplicar com `npx prisma migrate deploy` (o `migrate dev` é interativo e trava neste ambiente).

---

### Task 1: Estado de assinatura no banco + plano efetivo derivado

**Files:**
- Modify: `prisma/schema.prisma` (model `Professional`, ~linha 75; novo model no fim)
- Create: `prisma/migrations/20260817040000_assinatura_saas/migration.sql`
- Modify: `lib/plans.ts` (adicionar `planoEfetivo`)
- Test: `lib/plans.test.ts`

**Interfaces:**
- Consumes: `Plan` de `lib/plans.ts`.
- Produces: `planoEfetivo(conta: ContaAssinatura, agora: Date): Plan`, onde
  `ContaAssinatura = { plan: Plan; assinaturaStatus: string | null; assinaturaAte: Date | null }`.
  Campos novos em `Professional`: `mpPreapprovalId`, `assinaturaStatus`, `assinaturaAte`.
  Novo model `CobrancaAssinatura`.

- [x] **Step 1: Escrever o teste que falha**

Em `lib/plans.test.ts`:

```ts
import { planoEfetivo } from "./plans";

const AGORA = new Date("2026-08-17T12:00:00Z");

describe("planoEfetivo — o plano vale enquanto estiver pago", () => {
  it("autorizado e dentro do prazo mantém o plano pago", () => {
    expect(planoEfetivo(
      { plan: "PREMIUM", assinaturaStatus: "authorized", assinaturaAte: new Date("2026-09-17T12:00:00Z") },
      AGORA,
    )).toBe("PREMIUM");
  });

  it("cancelado ainda dentro do prazo pago MANTÉM o plano (não corta no meio do mês)", () => {
    expect(planoEfetivo(
      { plan: "PREMIUM", assinaturaStatus: "cancelled", assinaturaAte: new Date("2026-09-17T12:00:00Z") },
      AGORA,
    )).toBe("PREMIUM");
  });

  it("prazo vencido cai para Básico, mesmo com PREMIUM gravado na linha", () => {
    expect(planoEfetivo(
      { plan: "PREMIUM", assinaturaStatus: "authorized", assinaturaAte: new Date("2026-08-01T12:00:00Z") },
      AGORA,
    )).toBe("BASICO");
  });

  it("sem assinatura nenhuma é Básico", () => {
    expect(planoEfetivo({ plan: "PREMIUM", assinaturaStatus: null, assinaturaAte: null }, AGORA)).toBe("BASICO");
  });

  it("Básico nunca depende de assinatura", () => {
    expect(planoEfetivo({ plan: "BASICO", assinaturaStatus: null, assinaturaAte: null }, AGORA)).toBe("BASICO");
  });
});
```

- [x] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/plans.test.ts`
Expected: FAIL — `planoEfetivo is not a function`.

- [x] **Step 3: Implementar `planoEfetivo`**

Em `lib/plans.ts`:

```ts
export type ContaAssinatura = {
  plan: Plan;
  assinaturaStatus: string | null;
  assinaturaAte: Date | null;
};

/**
 * Plano que a conta REALMENTE tem agora.
 *
 * A coluna `plan` sozinha mente: ela guarda o plano contratado, e o direito
 * acaba quando o periodo pago vence. Derivar na leitura (em vez de rebaixar por
 * cron) elimina a janela em que o banco diz PREMIUM e o cliente ja nao pagou.
 *
 * Cancelar NAO corta na hora: quem cancelou ja pagou o mes, entao vale ate
 * `assinaturaAte`. O que corta e o vencimento.
 */
export function planoEfetivo(conta: ContaAssinatura, agora: Date): Plan {
  if (conta.plan === "BASICO") return "BASICO";
  if (!conta.assinaturaAte) return "BASICO";
  return conta.assinaturaAte.getTime() > agora.getTime() ? conta.plan : "BASICO";
}
```

- [x] **Step 4: Rodar e ver passar**

Run: `npx vitest run lib/plans.test.ts`
Expected: PASS.

- [x] **Step 5: Schema + migration**

Em `prisma/schema.prisma`, no model `Professional`, depois de `plan`:

```prisma
  /// Assinatura no Mercado Pago (`preapproval`). UNICO: duas contas nao podem
  /// apontar para a mesma assinatura.
  mpPreapprovalId  String?   @unique
  /// `pending` | `authorized` | `paused` | `cancelled` (espelha o MP).
  assinaturaStatus String?
  /// Ate quando o plano pago vale. E o que sustenta a carencia.
  assinaturaAte    DateTime?
```

E no fim do arquivo:

```prisma
/// Cobranca mensal da assinatura do SaaS. Nao reusa `Transaction` porque
/// aquela e amarrada a um `Event` por FK, e assinatura e da CONTA.
model CobrancaAssinatura {
  id             String       @id @default(cuid())
  professionalId String
  professional   Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  amountCents    Int
  status         String
  /// Id do pagamento no MP. UNICO: o webhook pode chegar duas vezes.
  providerId     String       @unique
  paidAt         DateTime?
  createdAt      DateTime     @default(now())

  @@index([professionalId])
}
```

Adicionar `cobrancas CobrancaAssinatura[]` nas relações de `Professional`.

`prisma/migrations/20260817040000_assinatura_saas/migration.sql`:

```sql
ALTER TABLE "Professional" ADD COLUMN "mpPreapprovalId" TEXT;
ALTER TABLE "Professional" ADD COLUMN "assinaturaStatus" TEXT;
ALTER TABLE "Professional" ADD COLUMN "assinaturaAte" TIMESTAMP(3);
CREATE UNIQUE INDEX "Professional_mpPreapprovalId_key" ON "Professional"("mpPreapprovalId");

CREATE TABLE "CobrancaAssinatura" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CobrancaAssinatura_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CobrancaAssinatura_providerId_key" ON "CobrancaAssinatura"("providerId");
CREATE INDEX "CobrancaAssinatura_professionalId_idx" ON "CobrancaAssinatura"("professionalId");
ALTER TABLE "CobrancaAssinatura" ADD CONSTRAINT "CobrancaAssinatura_professionalId_fkey"
  FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [x] **Step 6: Aplicar e gerar**

Run: `npx prisma migrate deploy && npx prisma generate && npx prisma migrate status`
Expected: "Database schema is up to date!".

- [x] **Step 7: Portão verde e commit**

```bash
pnpm test && pnpm lint && npx tsc --noEmit
git add prisma lib/plans.ts lib/plans.test.ts
git commit -m "feat(assinatura): estado da assinatura no banco + plano efetivo derivado do vencimento"
```

---

### Task 2: `trocarPlano` para de conceder plano pago

**Files:**
- Modify: `app/(dashboard)/actions.ts:270-283`
- Test: `lib/plans.test.ts` (função pura nova) e verificação manual da action

**Interfaces:**
- Consumes: `Plan`, `PLAN_ORDER` de `lib/plans.ts`.
- Produces: `ehDowngrade(de: Plan, para: Plan): boolean` em `lib/plans.ts`.

- [x] **Step 1: Escrever o teste que falha**

```ts
import { ehDowngrade } from "./plans";

describe("ehDowngrade", () => {
  it("descer de plano é downgrade", () => {
    expect(ehDowngrade("PREMIUM", "BASICO")).toBe(true);
    expect(ehDowngrade("PREMIUM", "CLASSICO")).toBe(true);
  });
  it("subir e ficar não são", () => {
    expect(ehDowngrade("BASICO", "PREMIUM")).toBe(false);
    expect(ehDowngrade("CLASSICO", "CLASSICO")).toBe(false);
  });
});
```

- [x] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/plans.test.ts`
Expected: FAIL — `ehDowngrade is not a function`.

- [x] **Step 3: Implementar**

```ts
/** Descer de plano (inclui cancelar para o Basico). */
export function ehDowngrade(de: Plan, para: Plan): boolean {
  return PLAN_ORDER.indexOf(para) < PLAN_ORDER.indexOf(de);
}
```

- [x] **Step 4: Rodar e ver passar**

Run: `npx vitest run lib/plans.test.ts` → PASS.

- [x] **Step 5: Trancar a action**

Em `app/(dashboard)/actions.ts`, substituir o corpo de `trocarPlano` depois da validação:

```ts
  const prof = await prisma.professional.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  if (!prof) return;
  const destino = planRaw as Plan;

  // SUBIR de plano exige pagamento — quem concede e o webhook do Mercado Pago
  // (`aplicarEventoAssinatura`), nunca este clique. Antes daqui saia um
  // `update({ plan })` seco: qualquer conta virava PREMIUM de graca.
  if (!ehDowngrade(prof.plan, destino)) return;

  await prisma.professional.update({
    where: { id: session.user.id },
    data: { plan: destino },
  });
  revalidatePath("/painel/plano");
  revalidatePath("/painel");
```

Importar `ehDowngrade` e `type Plan` de `@/lib/plans`.

- [x] **Step 6: Verificar no navegador**

Subir o dev (`pnpm dev`), entrar com a conta demo, ir em `/painel/plano`, clicar em "Fazer upgrade" no Premium.
Expected: o plano **não** muda. Clicar em "Mudar para este" no Básico: muda.

- [x] **Step 7: Portão verde e commit**

```bash
pnpm test && pnpm lint && npx tsc --noEmit
git add app/\(dashboard\)/actions.ts lib/plans.ts lib/plans.test.ts
git commit -m "fix(assinatura): upgrade deixa de ser gratis — subir de plano exige o gateway"
```

---

### Task 3: Criar a assinatura no Mercado Pago (sem cartão)

**Files:**
- Create: `lib/pagamentos/assinatura.ts`
- Test: `lib/pagamentos/assinatura.test.ts`

**Interfaces:**
- Consumes: `Plan`, `PLANOS_INFO` de `lib/plans.ts`.
- Produces:
  `criarAssinaturaMp(input: { plano: Plan; email: string; professionalId: string; backUrl: string }): Promise<{ preapprovalId: string; initPoint: string }>`

- [x] **Step 1: Escrever o teste que falha**

```ts
import { describe, expect, it, vi, afterEach } from "vitest";
import { criarAssinaturaMp } from "./assinatura";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => { fetchMock.mockReset(); delete process.env.MERCADO_PAGO_ACCESS_TOKEN; });

describe("criarAssinaturaMp", () => {
  it("manda o preço do plano, mensal, SEM cartão, e devolve o link do MP", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "pre-123", init_point: "https://mp.com/checkout/pre-123" }),
    });

    const r = await criarAssinaturaMp({
      plano: "CLASSICO",
      email: "pro@exemplo.com",
      professionalId: "prof-1",
      backUrl: "https://seuconvite.orivya.com.br/painel/plano?assinatura=ok",
    });

    expect(r).toEqual({ preapprovalId: "pre-123", initPoint: "https://mp.com/checkout/pre-123" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.mercadopago.com/preapproval");
    expect(init.headers.Authorization).toBe("Bearer APP_USR-teste");
    const body = JSON.parse(init.body);
    expect(body.auto_recurring).toMatchObject({
      frequency: 1, frequency_type: "months", transaction_amount: 59, currency_id: "BRL",
    });
    expect(body.payer_email).toBe("pro@exemplo.com");
    expect(body.external_reference).toBe("prof-1");
    // O cartao e digitado no MP: nunca mandamos token.
    expect(body).not.toHaveProperty("card_token_id");
  });

  it("recusa plano sem mensalidade (Básico não se assina)", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    await expect(criarAssinaturaMp({
      plano: "BASICO", email: "a@b.com", professionalId: "p", backUrl: "https://x/y",
    })).rejects.toThrow(/Básico/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sem token configurado, falha alto em vez de fingir", async () => {
    await expect(criarAssinaturaMp({
      plano: "CLASSICO", email: "a@b.com", professionalId: "p", backUrl: "https://x/y",
    })).rejects.toThrow(/MERCADO_PAGO_ACCESS_TOKEN/);
  });
});
```

- [x] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/pagamentos/assinatura.test.ts`
Expected: FAIL — módulo não existe.

- [x] **Step 3: Implementar**

`lib/pagamentos/assinatura.ts`:

```ts
// Assinatura mensal do SaaS no Mercado Pago (`preapproval`).
//
// Criamos SEM `card_token_id`: o MP devolve um `init_point` e o profissional
// digita o cartao la. Nenhum dado de cartao encosta no nosso servidor, o que
// nos mantem fora do escopo PCI.
import { PLANOS_INFO, type Plan } from "@/lib/plans";

const MP_API = "https://api.mercadopago.com";

export async function criarAssinaturaMp(input: {
  plano: Plan;
  email: string;
  professionalId: string;
  backUrl: string;
}): Promise<{ preapprovalId: string; initPoint: string }> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN ausente.");

  const info = PLANOS_INFO.find((p) => p.key === input.plano);
  if (!info || info.mensalidadeCents <= 0) {
    throw new Error("O plano Básico não se assina — ele é grátis.");
  }

  const res = await fetch(`${MP_API}/preapproval`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      reason: `seuconvite — plano ${info.label}`,
      external_reference: input.professionalId,
      payer_email: input.email,
      back_url: input.backUrl,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: info.mensalidadeCents / 100,
        currency_id: "BRL",
      },
    }),
  });

  if (!res.ok) throw new Error(`Mercado Pago recusou a assinatura (${res.status}).`);
  const data = (await res.json()) as { id?: string; init_point?: string };
  if (!data.id || !data.init_point) throw new Error("Resposta do Mercado Pago sem id/init_point.");
  return { preapprovalId: data.id, initPoint: data.init_point };
}
```

- [x] **Step 4: Rodar e ver passar**

Run: `npx vitest run lib/pagamentos/assinatura.test.ts` → PASS (3 testes).

- [x] **Step 5: Portão verde e commit**

```bash
pnpm test && pnpm lint && npx tsc --noEmit
git add lib/pagamentos/assinatura.ts lib/pagamentos/assinatura.test.ts
git commit -m "feat(assinatura): cria preapproval mensal no Mercado Pago sem tocar em cartao"
```

---

### Task 4: Núcleo idempotente que aplica os eventos da assinatura

**Files:**
- Create: `lib/assinaturaCore.ts`
- Test: `lib/assinaturaCore.test.ts` (banco real, atrás de `PAGAMENTO_DB_TESTS=1`, no molde de `lib/presentearCore.test.ts`)

**Interfaces:**
- Consumes: `prisma` de `@/lib/db`.
- Produces:
  - `aplicarStatusAssinatura(preapprovalId: string, status: string): Promise<boolean>`
  - `registrarCobrancaAssinatura(input: { preapprovalId: string; providerId: string; amountCents: number; pagoEm: Date }): Promise<boolean>`

- [x] **Step 1: Escrever o teste que falha**

```ts
// PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:seuconvite@127.0.0.1:5433/seuconviteia \
//   npx vitest run lib/assinaturaCore.test.ts
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { aplicarStatusAssinatura, registrarCobrancaAssinatura } from "./assinaturaCore";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;
const MARCA = "assinatura-teste";

async function conta(db: PrismaClient, pre: string) {
  return db.professional.create({
    data: {
      name: "Assinante", email: `${MARCA}-${pre}@exemplo.test`, passwordHash: "x",
      plan: "CLASSICO", mpPreapprovalId: pre, assinaturaStatus: "pending",
    },
  });
}

describe("eventos de assinatura", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.cobrancaAssinatura.deleteMany({ where: { providerId: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
    await prisma.$disconnect();
  });

  it.skipIf(!enabled)("authorized empurra o vencimento um mês à frente", async () => {
    const db = prisma!;
    const pre = `${MARCA}-a${Date.now()}`;
    const p = await conta(db, pre);

    expect(await aplicarStatusAssinatura(pre, "authorized")).toBe(true);

    const depois = await db.professional.findUniqueOrThrow({ where: { id: p.id } });
    expect(depois.assinaturaStatus).toBe("authorized");
    expect(depois.assinaturaAte).not.toBeNull();
    expect(depois.assinaturaAte!.getTime()).toBeGreaterThan(Date.now());
  });

  it.skipIf(!enabled)("cancelled NÃO apaga o vencimento já pago", async () => {
    const db = prisma!;
    const pre = `${MARCA}-c${Date.now()}`;
    const p = await conta(db, pre);
    await aplicarStatusAssinatura(pre, "authorized");
    const ateAntes = (await db.professional.findUniqueOrThrow({ where: { id: p.id } })).assinaturaAte;

    await aplicarStatusAssinatura(pre, "cancelled");

    const depois = await db.professional.findUniqueOrThrow({ where: { id: p.id } });
    expect(depois.assinaturaStatus).toBe("cancelled");
    expect(depois.assinaturaAte?.getTime()).toBe(ateAntes?.getTime());
  });

  it.skipIf(!enabled)("a mesma cobrança entregue duas vezes grava UMA linha", async () => {
    const db = prisma!;
    const pre = `${MARCA}-d${Date.now()}`;
    const p = await conta(db, pre);
    const cobranca = { preapprovalId: pre, providerId: `${MARCA}-pay-${Date.now()}`, amountCents: 5900, pagoEm: new Date() };

    const [x, y] = await Promise.all([
      registrarCobrancaAssinatura(cobranca),
      registrarCobrancaAssinatura(cobranca),
    ]);

    expect(x || y).toBe(true);
    expect(await db.cobrancaAssinatura.count({ where: { providerId: cobranca.providerId } })).toBe(1);
    expect((await db.professional.findUniqueOrThrow({ where: { id: p.id } })).assinaturaAte).not.toBeNull();
  });

  it.skipIf(!enabled)("assinatura desconhecida não explode", async () => {
    expect(await aplicarStatusAssinatura(`${MARCA}-nao-existe`, "authorized")).toBe(false);
  });
});
```

- [x] **Step 2: Rodar e ver falhar**

Run: `PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:seuconvite@127.0.0.1:5433/seuconviteia npx vitest run lib/assinaturaCore.test.ts`
Expected: FAIL — módulo não existe.

- [x] **Step 3: Implementar**

`lib/assinaturaCore.ts`:

```ts
// Nucleo (server-only, SEM "use server") dos eventos de assinatura do SaaS.
// Chamado pelo webhook do Mercado Pago. Idempotente: a mesma notificacao
// entregue duas vezes nao cobra nem credita duas vezes.
import { prisma } from "@/lib/db";

/** Um mes a frente da data dada (o MP cobra mensalmente). */
function umMesDepois(de: Date): Date {
  const d = new Date(de);
  d.setMonth(d.getMonth() + 1);
  return d;
}

/**
 * Espelha o status da assinatura na conta.
 *
 * `cancelled`/`paused` NAO mexem em `assinaturaAte`: quem cancelou ja pagou o
 * mes corrente e continua com o plano ate o vencimento — quem corta o direito e
 * `planoEfetivo`, na leitura.
 */
export async function aplicarStatusAssinatura(preapprovalId: string, status: string): Promise<boolean> {
  const conta = await prisma.professional.findUnique({ where: { mpPreapprovalId: preapprovalId } });
  if (!conta) return false;

  const data: { assinaturaStatus: string; assinaturaAte?: Date } = { assinaturaStatus: status };
  // Autorizou e ainda nao havia prazo: garante o primeiro mes mesmo se a
  // notificacao de pagamento demorar.
  if (status === "authorized" && !conta.assinaturaAte) data.assinaturaAte = umMesDepois(new Date());

  await prisma.professional.update({ where: { id: conta.id }, data });
  return true;
}

/**
 * Registra a cobranca mensal e empurra o vencimento.
 *
 * O `providerId` e UNICO no banco: se duas entregas da mesma notificacao
 * correrem juntas, a segunda falha no `create` e nada e contado em dobro.
 */
export async function registrarCobrancaAssinatura(input: {
  preapprovalId: string;
  providerId: string;
  amountCents: number;
  pagoEm: Date;
}): Promise<boolean> {
  const conta = await prisma.professional.findUnique({ where: { mpPreapprovalId: input.preapprovalId } });
  if (!conta) return false;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.cobrancaAssinatura.create({
        data: {
          professionalId: conta.id,
          amountCents: input.amountCents,
          status: "PAID",
          providerId: input.providerId,
          paidAt: input.pagoEm,
        },
      });
      const base = conta.assinaturaAte && conta.assinaturaAte > input.pagoEm ? conta.assinaturaAte : input.pagoEm;
      await tx.professional.update({
        where: { id: conta.id },
        data: { assinaturaAte: umMesDepois(base), assinaturaStatus: "authorized" },
      });
    });
    return true;
  } catch {
    // Ja registrada (indice unico) — idempotente, nao e erro.
    return false;
  }
}
```

- [x] **Step 4: Rodar e ver passar**

Run: `PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:seuconvite@127.0.0.1:5433/seuconviteia npx vitest run lib/assinaturaCore.test.ts`
Expected: 4 testes PASS.

- [x] **Step 5: Portão verde e commit**

```bash
pnpm test && pnpm lint && npx tsc --noEmit
git add lib/assinaturaCore.ts lib/assinaturaCore.test.ts
git commit -m "feat(assinatura): nucleo idempotente dos eventos de assinatura"
```

---

### Task 5: Webhook trata os eventos de assinatura

**Files:**
- Modify: `app/api/webhooks/mercadopago/route.ts`
- Test: `lib/pagamentos/mercadopago.test.ts` (roteamento por `type`, função pura nova)

**Interfaces:**
- Consumes: `aplicarStatusAssinatura`, `registrarCobrancaAssinatura` (Task 4); `verificarAssinaturaMp` (já existe).
- Produces: `tipoDeNotificacao(body: unknown): "pagamento" | "assinatura" | "cobranca-assinatura" | "desconhecido"` em `lib/pagamentos/mercadopago.ts`.

- [x] **Step 1: Escrever o teste que falha**

Em `lib/pagamentos/mercadopago.test.ts`:

```ts
import { tipoDeNotificacao } from "./mercadopago";

describe("tipoDeNotificacao", () => {
  it("separa pagamento avulso de assinatura", () => {
    expect(tipoDeNotificacao({ type: "payment", data: { id: "1" } })).toBe("pagamento");
    expect(tipoDeNotificacao({ type: "subscription_preapproval", data: { id: "pre-1" } })).toBe("assinatura");
    expect(tipoDeNotificacao({ type: "subscription_authorized_payment", data: { id: "pay-1" } })).toBe("cobranca-assinatura");
  });
  it("o que não conhecemos é ignorado explicitamente", () => {
    expect(tipoDeNotificacao({ type: "plan", data: { id: "x" } })).toBe("desconhecido");
    expect(tipoDeNotificacao(null)).toBe("desconhecido");
  });
});
```

- [x] **Step 2: Rodar e ver falhar**

Run: `npx vitest run lib/pagamentos/mercadopago.test.ts`
Expected: FAIL — `tipoDeNotificacao is not a function`.

- [x] **Step 3: Implementar a função pura**

Em `lib/pagamentos/mercadopago.ts`:

```ts
/**
 * Que tipo de notificacao o MP mandou. O mesmo endpoint recebe pagamento
 * avulso (presente do convidado) e os eventos de assinatura do SaaS.
 */
export function tipoDeNotificacao(
  body: unknown,
): "pagamento" | "assinatura" | "cobranca-assinatura" | "desconhecido" {
  const tipo = (body as { type?: unknown } | null)?.type;
  if (tipo === "payment") return "pagamento";
  if (tipo === "subscription_preapproval") return "assinatura";
  if (tipo === "subscription_authorized_payment") return "cobranca-assinatura";
  return "desconhecido";
}
```

- [x] **Step 4: Rodar e ver passar**

Run: `npx vitest run lib/pagamentos/mercadopago.test.ts` → PASS.

- [x] **Step 5: Ligar no webhook**

Em `app/api/webhooks/mercadopago/route.ts`, **depois** da validação de assinatura já existente (não antes — a segurança continua sendo o HMAC), rotear por tipo. Para `assinatura`, consultar `GET /preapproval/{id}` e aplicar o `status`; para `cobranca-assinatura`, consultar `GET /authorized_payments/{id}` e chamar `registrarCobrancaAssinatura` com `preapproval_id`, `id`, `transaction_amount * 100` e a data. Manter o caminho de `pagamento` exatamente como está.

Regra: **nunca confiar no payload** — reconsultar o MP antes de conceder, igual ao que o fluxo de presente já faz.

- [x] **Step 6: Verificar o roteamento sem gateway**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "content-type: application/json" \
  -d '{"type":"subscription_preapproval","data":{"id":"x"}}' \
  http://127.0.0.1:3000/api/webhooks/mercadopago
```
Expected: 401 em produção (sem assinatura válida). Em dev sem segredo, 200 e log do tipo reconhecido.

- [x] **Step 7: Portão verde e commit**

```bash
pnpm test && pnpm lint && npx tsc --noEmit
git add app/api/webhooks/mercadopago/route.ts lib/pagamentos/mercadopago.ts lib/pagamentos/mercadopago.test.ts
git commit -m "feat(assinatura): webhook trata preapproval e cobranca mensal"
```

---

### Task 6: Botão do painel leva ao checkout, e a landing carrega o plano escolhido

**Files:**
- Modify: `app/(dashboard)/actions.ts` (nova action `assinarPlano`)
- Modify: `app/(dashboard)/painel/plano/page.tsx:89-104`
- Modify: `app/(marketing)/page.tsx:332` (CTA dos cards)
- Modify: `app/(dashboard)/painel/layout.tsx` e demais leituras de plano → usar `planoEfetivo`

**Interfaces:**
- Consumes: `criarAssinaturaMp` (Task 3), `planoEfetivo` (Task 1).
- Produces: server action `assinarPlano(formData: FormData): Promise<void>` (redireciona para o `init_point`).

- [x] **Step 1: Implementar a action**

Em `app/(dashboard)/actions.ts`:

```ts
export async function assinarPlano(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  const planRaw = formData.get("plan");
  if (typeof planRaw !== "string" || !PLAN_VALUES.includes(planRaw as Plan)) return;

  const prof = await prisma.professional.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (!prof) return;

  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
  const proto = protocoloDe(root);
  const { preapprovalId, initPoint } = await criarAssinaturaMp({
    plano: planRaw as Plan,
    email: prof.email,
    professionalId: session.user.id,
    backUrl: `${proto}://${root}/painel/plano?assinatura=ok`,
  });

  // Guardamos o id ANTES de mandar para o MP: e por ele que o webhook acha a
  // conta. Sem isso, uma assinatura autorizada chegaria sem dono.
  await prisma.professional.update({
    where: { id: session.user.id },
    data: { mpPreapprovalId: preapprovalId, assinaturaStatus: "pending" },
  });

  redirect(initPoint);
}
```

- [x] **Step 2: Trocar o formulário do painel**

Em `app/(dashboard)/painel/plano/page.tsx`, o `<form action={trocarPlano}>` passa a escolher a action pelo sentido da mudança: subir → `assinarPlano`; descer → `trocarPlano`. Usar `ehDowngrade(atual, p.key)`. Quando `?assinatura=ok` estiver na URL, mostrar acima dos cards: "Recebemos sua assinatura. O plano libera assim que o Mercado Pago confirmar o pagamento."

- [x] **Step 3: Usar o plano efetivo nas leituras**

Trocar `prof.plan` por `planoEfetivo(prof, new Date())` onde o plano decide direito: `app/(dashboard)/painel/layout.tsx`, `app/(dashboard)/painel/plano/page.tsx` e a criação de evento (`limiteEventos`). Os `select` do Prisma precisam passar a trazer `assinaturaStatus` e `assinaturaAte`.

- [x] **Step 4: Landing leva o plano escolhido**

Em `app/(marketing)/page.tsx:332`, o `href` dos cards pagos passa a ser `` `${CADASTRO}?plano=${p.key.toLowerCase()}` ``. O Básico continua como está.

- [x] **Step 5: Verificar no navegador**

Com `MERCADO_PAGO_ACCESS_TOKEN` de teste no `.env`, subir o dev, entrar, ir em `/painel/plano` e clicar em "Fazer upgrade" no Clássico.
Expected: redireciona para o checkout do Mercado Pago; ao voltar, o plano **ainda é o antigo** e aparece o aviso de "aguardando confirmação"; a conta tem `mpPreapprovalId` gravado.

- [x] **Step 6: Portão verde e commit**

```bash
pnpm test && pnpm lint && npx tsc --noEmit
git add app/\(dashboard\) app/\(marketing\)/page.tsx
git commit -m "feat(assinatura): botao do painel abre o checkout do MP e landing leva o plano escolhido"
```

---

## Onde a execução saiu do plano (tarefas 4–6, 17/08)

Tudo o que o plano pedia foi feito. O que ficou **diferente ou a mais**, e por quê:

1. **`registrarCobrancaAssinatura` só engole a duplicata.** O plano tinha
   `catch { return false }`, que transformaria banco fora do ar em "já registrada" —
   200 para o MP e uma cobrança perdida para sempre. Agora só `P2002` vira `false`;
   o resto sobe e o webhook devolve 5xx para o MP reenviar.
2. **As consultas ao MP viraram funções testáveis** (`consultarAssinaturaMp`,
   `consultarCobrancaAssinaturaMp` em `lib/pagamentos/assinatura.ts`), em vez de
   `fetch` solto dentro da rota. O ledger guarda o id da **cobrança**
   (`authorized_payment`), não o do pagamento: com `recycling` o MP gera pagamento
   novo para a mesma cobrança, e o mês tem de continuar sendo um só.
3. **`tests/webhook-assinatura.test.ts` (novo).** O plano mandava conferir o
   roteamento com um `curl`, que não prova gravação. O teste manda a notificação
   **assinada** na rota e confere o banco: credita, não credita duas vezes, recusa
   assinatura inválida antes de consultar, e devolve 5xx quando a consulta falha.
4. **Cancelar passou a cancelar no gateway** (`cancelarAssinaturaMp`). Isto não
   estava no plano e é um buraco de dinheiro: sem ele a pessoa cancela no painel e
   o Mercado Pago segue cobrando todo mês. Se o MP recusar, nada muda aqui.
5. **`assinarPlano` grava `plan: destino`.** Sem isso, quem assina saindo do Básico
   nunca receberia o plano — o webhook só escreve status e vencimento, e
   `planoEfetivo` leria o contratado antigo. Gravar é seguro: sem `assinaturaAte`
   no futuro, não libera nada.
6. **A UI ficou "Básico = cancelar, pago = assinar".** Trocar entre dois planos
   pagos é uma assinatura nova no novo preço (a antiga é cancelada antes), e não
   uma troca local de linha.
7. **`planoEfetivo` foi além dos 3 arquivos do plano**: entrou também na taxa do
   presente (`lib/presentear.ts`), no white-label do e-mail de RSVP
   (`lib/rsvp.ts`), na prévia e nas duas ações de criar convite. Deixar metade das
   leituras em `prof.plan` é o tipo de inconsistência que vira bug de direito.
8. **Seed:** a conta demo ganhou assinatura em dia, senão o dev local abre o painel
   sem RSVP/recados/galeria.

## Teste grátis de 7 dias (17/08, decisão do João depois do plano)

"Como os outros SaaS fazem": o cartão entra no começo e a cobrança só cai no 8º dia.
Isso mudou o **funil** e a **vitrine**, não só um parâmetro:

- **A vitrine da landing passou a mostrar só os planos PAGOS.** Um plano grátis ao lado de um
  teste com cartão faz todo mundo escolher o grátis. O Básico continua no produto — é onde a
  conta cai quando alguém cancela, e o convite já publicado segue no ar — só não é vendido.
- **Quem segura o prazo é o Mercado Pago** (`free_trial` no `preapproval`), não a gente. Não
  existe estado nosso "em teste" para dessincronizar do gateway.
- **O direito vale até a PRÓXIMA COBRANÇA que o MP informa** (`next_payment_date`): durante o
  teste, o fim dos 7 dias; depois, a renovação mensal. Sem essa data, liberamos no máximo o
  teste — errar para menos custa um pedido de suporte, errar para mais é um mês de graça.
- **Uma vez por conta:** conta que já tem `mpPreapprovalId` (mesmo cancelada) assina pagando
  desde o primeiro dia. Sem isso, cancelar e reassinar daria teste infinito.
- **Fluxo:** card da landing → `/assinar/<plano>` → (sem conta) cadastro que já sabe o plano →
  checkout do MP. A regra de criar assinatura virou `lib/assinarFluxo.ts`, compartilhada com o
  botão do painel.

## Depois do plano

- Aplicar a migration em produção (tabelas novas, sem dado a migrar) e subir.
- Teste no ar com a conta real: assinar o Clássico, ver o plano subir **só** depois do webhook, e cancelar.
- **Cadastrar o webhook no MP com os eventos de assinatura** (`subscription_preapproval`
  e `subscription_authorized_payment`) — sem isso o plano nunca sobe sozinho.
- O `?plano=` que a landing passa ainda **não é lido** pelo cadastro (que redireciona
  para `/entrar?criar=1` e sempre cria a conta no Básico). A pessoa escolhe de novo em
  `/painel/plano`. Fechar isso é uma tarefa própria.
- Fica pendente e registrado à parte: 3 dos 4 templates não têm fluxo de presentear.
