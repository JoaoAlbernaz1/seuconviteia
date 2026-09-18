# Crédito de convite avulso — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar ao plano Grátis uma saída paga para o segundo convite — R$ 29,90 por crédito, um crédito compra uma criação de convite — sem tocar no ilimitado dos planos pagos.

**Architecture:** Tabela `CreditoConvite` por conta, com o mesmo contrato do passe de edição: a action cria a linha `PENDING` e **quem concede é o webhook**. O saldo não é guardado — é derivado (créditos `PAID` com `eventId` nulo). Gastar é um compare-and-set que grava `eventId`, e o índice único nessa coluna é o que torna gasto duplo impossível no banco. A regra da vaga passa a ignorar convites que um crédito pagou.

**Tech Stack:** Next.js 16 (App Router, server actions) · Prisma + PostgreSQL · Mercado Pago (Pix) · Vitest · pnpm

**Spec:** `docs/superpowers/specs/2026-09-18-credito-de-convite-design.md`

## Global Constraints

- **Preço do crédito: `2990` centavos (R$ 29,90).** Valor exato, definido uma vez em `lib/credito.ts`.
- **Um crédito = uma criação de convite.** Nunca vaga permanente.
- **O crédito é gasto ao CRIAR**, nunca ao publicar.
- **O saldo NUNCA é guardado em coluna.** Sempre derivado por contagem.
- **Nenhuma action concede crédito.** Só `lib/creditoConvite.ts`, chamado pelo webhook.
- **O ilimitado de CLASSICO/PREMIUM não muda.** `limiteEventos` continua `null` neles.
- **`pnpm db:push` é proibido** no repo (o script recusa). Migrations por `pnpm db:migrate --name <descricao>`.
- **Testes de banco** rodam com `PAGAMENTO_DB_TESTS=1 pnpm test` e limpam o que criam por prefixo.
- **Portão de cada task:** `pnpm exec tsc --noEmit`, `pnpm lint`, `PAGAMENTO_DB_TESTS=1 pnpm test`.

## Decisão que este plano fecha (não estava na spec)

**Apagar o convite devolve o crédito.** O app apaga convites (`app/(dashboard)/painel/acoes.ts:53` e `:89`), então a relação precisa de uma resposta. `onDelete: SetNull` devolve o crédito ao saldo.

Não é exploit: quem apagou o convite não ficou com ele, e o teto de convites no ar continua o mesmo. A alternativa (`Restrict`) impediria a pessoa de apagar o próprio convite. A frase da spec "gasta e não volta" vale para o convite que CONTINUA existindo — vale corrigi-la depois do aval do João.

---

## File Structure

| Arquivo | Responsabilidade |
| --- | --- |
| `prisma/schema.prisma` (modificar) | Modelo `CreditoConvite` + relações em `Professional` e `Event` |
| `lib/credito.ts` (criar) | Preço, saldo derivado e o compare-and-set do gasto. Papel equivalente ao de `lib/edicao.ts` |
| `lib/credito.test.ts` (criar) | Testes de modelo, saldo e gasto, com banco |
| `lib/creditoConvite.ts` (criar) | Concessão idempotente pelo webhook + busca da linha. Espelha `lib/passeEdicao.ts` |
| `lib/creditoConvite.test.ts` (criar) | Idempotência, `FAILED`, reentrega |
| `app/(dashboard)/painel/criar/acoes.ts` (modificar) | As três portas da cota ignoram convite pago por crédito; a criação gasta o crédito |
| `app/(dashboard)/painel/creditos/acoes.ts` (criar) | `comprarCreditoConvite` — cria a linha `PENDING` e pede o Pix. Espelha `liberar/acoes.ts` |
| `app/api/webhooks/mercadopago/route.ts` (modificar) | Terceiro destino do pagamento aprovado |
| `tests/credito-de-convite.test.ts` (criar) | As três portas, o gasto na criação e a regeneração da vaga grátis |
| `components/plano/RecursoBloqueado.tsx` (modificar) | Slot opcional para um segundo caminho no popup |
| `app/(dashboard)/painel/criar/CriarConvite.tsx` (modificar) | Passa o "Comprar convite extra" ao popup do limite |
| `app/(dashboard)/painel/creditos/page.tsx` (criar) | Carrega o saldo derivado |
| `app/(dashboard)/painel/creditos/CreditosCliente.tsx` (criar) | O Pix da compra. Espelha `liberar/LiberarCliente.tsx` |

---

### Task 1: Modelo `CreditoConvite`

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_credito_de_convite/migration.sql` (gerada pelo Prisma)
- Test: `lib/credito.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: modelo Prisma `CreditoConvite` com os campos `id`, `professionalId`, `amountCents`, `status`, `providerId` (único, nulável), `paidAt`, `eventId` (único, nulável), `createdAt`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/credito.test.ts`:

```ts
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;

const MARCA = "credito-modelo-teste";

async function conta(db: PrismaClient) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return db.professional.create({
    data: { name: "Dono", email: `${MARCA}-${sufixo}@exemplo.test`, passwordHash: "x" },
  });
}

async function eventoDe(db: PrismaClient, professionalId: string) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return db.event.create({
    data: {
      professionalId,
      type: "QUINZE_ANOS",
      subdomain: `${MARCA}-${sufixo}`,
      title: "Festa",
      eventDate: new Date(Date.now() + 30 * 864e5),
      expiresAt: new Date(Date.now() + 60 * 864e5),
    },
  });
}

describe("modelo CreditoConvite", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.creditoConvite.deleteMany({
      where: { professional: { email: { contains: MARCA } } },
    });
    await prisma.event.deleteMany({ where: { subdomain: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
    await prisma.$disconnect();
  });

  it.skipIf(!enabled)("nasce PENDING, sem convite e sem cobranca", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const credito = await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990 },
    });
    expect(credito.status).toBe("PENDING");
    expect(credito.eventId).toBeNull();
    expect(credito.providerId).toBeNull();
    expect(credito.paidAt).toBeNull();
  });

  it.skipIf(!enabled)("DOIS creditos nao podem apontar para o MESMO convite", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const evento = await eventoDe(db, prof.id);
    await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990, status: "PAID", eventId: evento.id },
    });
    // O indice unico e a rede: gasto duplo tem de morrer NO BANCO, nao na aplicacao.
    await expect(
      db.creditoConvite.create({
        data: { professionalId: prof.id, amountCents: 2990, status: "PAID", eventId: evento.id },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it.skipIf(!enabled)("apagar o convite DEVOLVE o credito ao saldo", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const evento = await eventoDe(db, prof.id);
    const credito = await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990, status: "PAID", eventId: evento.id },
    });
    await db.event.delete({ where: { id: evento.id } });
    const depois = await db.creditoConvite.findUnique({ where: { id: credito.id } });
    expect(depois?.eventId).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm exec vitest run lib/credito.test.ts`
Expected: FAIL — `Property 'creditoConvite' does not exist on type 'PrismaClient'`.

- [ ] **Step 3: Acrescentar o modelo ao schema**

Em `prisma/schema.prisma`, acrescentar o modelo:

```prisma
/// Credito avulso que compra UMA criacao de convite no plano Gratis.
///
/// Mesmo contrato do passe de edicao: a action cria a linha PENDING e quem
/// concede e o webhook. O SALDO nao mora em coluna nenhuma — e a contagem de
/// linhas PAID com `eventId` nulo, pelo mesmo motivo que `planoEfetivo` deriva
/// o plano na leitura: contador guardado sai de sincronia.
model CreditoConvite {
  id             String       @id @default(cuid())
  professionalId String
  professional   Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  amountCents    Int
  status         String       @default("PENDING")
  /// Id da cobranca no gateway. UNICO: rede do ledger, como em `Transaction`.
  providerId     String?      @unique
  paidAt         DateTime?
  /// O convite que ESTE credito pagou. Nulo = credito na mao, nao gasto.
  /// UNICO: e o que torna gasto duplo impossivel NO BANCO.
  /// SetNull: apagar o convite devolve o credito — quem apagou nao ficou com ele.
  eventId        String?      @unique
  event          Event?       @relation(fields: [eventId], references: [id], onDelete: SetNull)
  createdAt      DateTime     @default(now())

  @@index([professionalId])
}
```

No modelo `Professional`, acrescentar junto das outras relações:

```prisma
  creditos      CreditoConvite[]
```

No modelo `Event`, acrescentar ao lado de `payouts`:

```prisma
  credito       CreditoConvite?
```

- [ ] **Step 4: Gerar e aplicar a migration**

Run: `pnpm db:migrate --name credito_de_convite`
Expected: migration criada em `prisma/migrations/` e aplicada no banco local. Não usar `pnpm db:push` — o script do repo o recusa de propósito, porque há histórico em `prisma/migrations`.

- [ ] **Step 5: Rodar o teste e ver passar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm exec vitest run lib/credito.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 6: Portão completo**

Run: `pnpm exec tsc --noEmit && pnpm lint && PAGAMENTO_DB_TESTS=1 pnpm test`
Expected: tsc sem saída, lint sem erro, suíte inteira verde.

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations lib/credito.test.ts
git commit -m "feat(credito): a tabela do credito de convite, com gasto duplo impossivel no banco"
```

---

### Task 2: Saldo derivado e o gasto por compare-and-set

**Files:**
- Create: `lib/credito.ts`
- Modify: `lib/credito.test.ts`

**Interfaces:**
- Consumes: modelo `CreditoConvite` (Task 1).
- Produces:
  - `export const CREDITO_PRECO_CENTS = 2990`
  - `export type PrismaLike = Pick<PrismaClient, "creditoConvite">`
  - `export async function saldoDeCreditos(db: PrismaLike, professionalId: string): Promise<number>`
  - `export async function gastarCredito(db: PrismaLike, professionalId: string, eventId: string): Promise<boolean>`

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar ao import do topo de `lib/credito.test.ts`:

```ts
import { CREDITO_PRECO_CENTS, gastarCredito, saldoDeCreditos } from "./credito";
```

E acrescentar ao fim do arquivo:

```ts
describe("saldo e gasto do credito", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.creditoConvite.deleteMany({
      where: { professional: { email: { contains: MARCA } } },
    });
    await prisma.event.deleteMany({ where: { subdomain: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
  });

  it.skipIf(!enabled)("o preco e R$ 29,90", () => {
    expect(CREDITO_PRECO_CENTS).toBe(2990);
  });

  it.skipIf(!enabled)("saldo conta so o que esta PAID e nao foi gasto", async () => {
    const db = prisma!;
    const prof = await conta(db);
    await db.creditoConvite.createMany({
      data: [
        { professionalId: prof.id, amountCents: 2990, status: "PAID" },
        { professionalId: prof.id, amountCents: 2990, status: "PAID" },
        { professionalId: prof.id, amountCents: 2990, status: "PENDING" },
        { professionalId: prof.id, amountCents: 2990, status: "FAILED" },
      ],
    });
    expect(await saldoDeCreditos(db, prof.id)).toBe(2);
  });

  it.skipIf(!enabled)("gastar marca o credito com o convite e derruba o saldo", async () => {
    const db = prisma!;
    const prof = await conta(db);
    await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990, status: "PAID" },
    });
    const evento = await eventoDe(db, prof.id);
    expect(await gastarCredito(db, prof.id, evento.id)).toBe(true);
    expect(await saldoDeCreditos(db, prof.id)).toBe(0);
  });

  it.skipIf(!enabled)("sem saldo, gastar devolve false e nao inventa linha", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const evento = await eventoDe(db, prof.id);
    expect(await gastarCredito(db, prof.id, evento.id)).toBe(false);
    expect(await db.creditoConvite.count({ where: { professionalId: prof.id } })).toBe(0);
  });

  it.skipIf(!enabled)("UM credito e DOIS convites: so o primeiro leva", async () => {
    const db = prisma!;
    const prof = await conta(db);
    await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990, status: "PAID" },
    });
    const a = await eventoDe(db, prof.id);
    const b = await eventoDe(db, prof.id);
    const resultados = await Promise.all([
      gastarCredito(db, prof.id, a.id),
      gastarCredito(db, prof.id, b.id),
    ]);
    expect(resultados.filter(Boolean)).toHaveLength(1);
  });

  it.skipIf(!enabled)("com DOIS creditos, dois convites concorrentes levam um cada", async () => {
    const db = prisma!;
    const prof = await conta(db);
    await db.creditoConvite.createMany({
      data: [
        { professionalId: prof.id, amountCents: 2990, status: "PAID" },
        { professionalId: prof.id, amountCents: 2990, status: "PAID" },
      ],
    });
    const a = await eventoDe(db, prof.id);
    const b = await eventoDe(db, prof.id);
    const resultados = await Promise.all([
      gastarCredito(db, prof.id, a.id),
      gastarCredito(db, prof.id, b.id),
    ]);
    // Sem a varredura de candidatos, os dois disputariam a MESMA primeira linha
    // e um perderia com saldo sobrando.
    expect(resultados).toEqual([true, true]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm exec vitest run lib/credito.test.ts`
Expected: FAIL — `Cannot find module './credito'`.

- [ ] **Step 3: Implementar `lib/credito.ts`**

```ts
/**
 * Credito avulso de convite: o preco, o saldo e o gasto.
 *
 * Papel equivalente ao de `lib/edicao.ts` para o passe. A CONCESSAO (virar
 * PENDING em PAID) nao mora aqui — mora em `lib/creditoConvite.ts`, chamado so
 * pelo webhook.
 */
import type { PrismaClient } from "@prisma/client";

/** Preco do credito de convite, em centavos. */
export const CREDITO_PRECO_CENTS = 2990;

/**
 * O minimo que estas funcoes precisam do Prisma.
 *
 * Existe para elas aceitarem tanto o `prisma` global quanto o `db` de dentro de
 * um `$transaction` — a criacao do convite gasta o credito na MESMA transacao, e
 * passar o cliente global ali deixaria o gasto FORA do rollback.
 */
export type PrismaLike = Pick<PrismaClient, "creditoConvite">;

/**
 * Quantos creditos a conta tem NA MAO.
 *
 * Contagem, nunca coluna: saldo guardado sai de sincronia no primeiro caminho
 * que esquece de decrementar. Mesmo principio de `planoEfetivo`, que deriva o
 * plano na leitura em vez de rebaixar por cron.
 */
export async function saldoDeCreditos(db: PrismaLike, professionalId: string): Promise<number> {
  return db.creditoConvite.count({
    where: { professionalId, status: "PAID", eventId: null },
  });
}

/**
 * Gasta UM credito da conta, amarrando-o a `eventId`. `true` se gastou.
 *
 * COMPARE-AND-SET, como `usarPasseIncluido`: o `eventId: null` entra no WHERE,
 * entao ninguem vira a mesma linha duas vezes. A varredura de candidatos existe
 * porque duas criacoes simultaneas escolhem o mesmo primeiro candidato: sem
 * tentar o proximo, uma delas seria recusada com saldo sobrando.
 *
 * O indice unico em `eventId` e a rede final: mesmo que dois caminhos escapem,
 * o banco recusa o segundo credito para o mesmo convite.
 */
export async function gastarCredito(
  db: PrismaLike,
  professionalId: string,
  eventId: string,
): Promise<boolean> {
  const candidatos = await db.creditoConvite.findMany({
    where: { professionalId, status: "PAID", eventId: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  for (const candidato of candidatos) {
    const gasto = await db.creditoConvite.updateMany({
      where: { id: candidato.id, eventId: null },
      data: { eventId },
    });
    if (gasto.count === 1) return true;
  }
  return false;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm exec vitest run lib/credito.test.ts`
Expected: PASS (9 testes).

- [ ] **Step 5: Portão completo**

Run: `pnpm exec tsc --noEmit && pnpm lint && PAGAMENTO_DB_TESTS=1 pnpm test`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add lib/credito.ts lib/credito.test.ts
git commit -m "feat(credito): saldo derivado e gasto por compare-and-set"
```

---

### Task 3: A vaga do Grátis ignora convite pago por crédito

**Files:**
- Modify: `app/(dashboard)/painel/criar/acoes.ts:62-73` (`vagaParaAtivar`) e `:174-177` (porta de criar)
- Create: `tests/credito-de-convite.test.ts`

**Interfaces:**
- Consumes: modelo `CreditoConvite` (Task 1).
- Produces: função interna `ocupamVaga(professionalId): Prisma.EventWhereInput`, usada pelas três portas. Nenhuma assinatura exportada muda.

- [ ] **Step 1: Escrever os testes que falham**

Criar `tests/credito-de-convite.test.ts`:

```ts
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { legacyEventToDocument } from "@/lib/event-editor/legacy";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;

const MARCA = "credito-portas-teste";
const DIA = 24 * 60 * 60 * 1000;

const sessionMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: sessionMock, signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { salvarDocumentoConvite, publicarDocumentoConvite } = await import(
  "@/app/(dashboard)/painel/criar/acoes"
);

async function conta(db: PrismaClient) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const prof = await db.professional.create({
    data: { name: "Dono", email: `${MARCA}-${sufixo}@exemplo.test`, passwordHash: "x" },
  });
  sessionMock.mockResolvedValue({ user: { id: prof.id, email: prof.email } });
  return prof;
}

/** Convite no ar (data futura), opcionalmente pago por um credito. */
async function convite(db: PrismaClient, professionalId: string, pagoPorCredito: boolean) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const event = await db.event.create({
    data: {
      professionalId,
      type: "QUINZE_ANOS",
      subdomain: `${MARCA}-${sufixo}`,
      title: "Festa de teste",
      status: "DRAFT",
      eventDate: new Date(Date.now() + 30 * DIA),
      expiresAt: new Date(Date.now() + 60 * DIA),
    },
  });
  if (pagoPorCredito) {
    await db.creditoConvite.create({
      data: { professionalId, amountCents: 2990, status: "PAID", eventId: event.id },
    });
  }
  return event;
}

/**
 * Documento válido para a action, tirado do próprio evento — o mesmo caminho que
 * o editor usa ao abrir um convite que já existe, então ele passa no Zod da
 * action sem fixture. Mesma técnica de `tests/limite-de-convites.test.ts`.
 */
function documentoDe(event: Awaited<ReturnType<typeof convite>>) {
  return legacyEventToDocument({ ...event, gifts: [], photos: [] });
}

beforeEach(() => {
  sessionMock.mockReset();
});

describe("a vaga do Gratis e o credito", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.creditoConvite.deleteMany({
      where: { professional: { email: { contains: MARCA } } },
    });
    await prisma.event.deleteMany({ where: { subdomain: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
    await prisma.$disconnect();
  });

  it.skipIf(!enabled)("convite pago por CREDITO nao ocupa a vaga gratuita", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const comprado = await convite(db, prof.id, true);
    // A vaga gratuita continua LIVRE: criar o convite do plano tem de passar.
    const criado = await salvarDocumentoConvite({
      expectedVersion: 0,
      document: documentoDe(comprado),
    });
    expect(criado).toMatchObject({ ok: true });
  });

  it.skipIf(!enabled)("convite GRATUITO no ar ocupa a vaga, e o segundo e recusado", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const gratuito = await convite(db, prof.id, false);
    const criado = await salvarDocumentoConvite({
      expectedVersion: 0,
      document: documentoDe(gratuito),
    });
    expect(criado).toMatchObject({ ok: false, kind: "limit" });
  });

  it.skipIf(!enabled)("a TERCEIRA porta: publicar o gratuito passa com um comprado no ar", async () => {
    const db = prisma!;
    const prof = await conta(db);
    await convite(db, prof.id, true); // comprado, nao disputa vaga

    // O convite gratuito, com rascunho pronto para publicar.
    const gratuito = await convite(db, prof.id, false);
    const comRascunho = await db.event.update({
      where: { id: gratuito.id },
      data: {
        draftData: documentoDe(gratuito) as unknown as object,
        draftVersion: 1,
        edicaoAte: new Date(Date.now() + DIA),
      },
    });

    const publicado = await publicarDocumentoConvite({
      id: comRascunho.id,
      expectedDraftVersion: 1,
    });

    // Sem a mudanca de `vagaParaAtivar`, o convite COMPRADO ocuparia a vaga e a
    // porta de publicar recusaria o unico convite do plano.
    expect(publicado).toMatchObject({ ok: true });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm exec vitest run tests/credito-de-convite.test.ts`
Expected: FAIL no primeiro teste — a contagem atual inclui o convite comprado, então a action responde `{ ok: false, kind: "limit" }`.

- [ ] **Step 3: Ensinar as portas a ignorar o convite comprado**

Em `app/(dashboard)/painel/criar/acoes.ts`, acrescentar o filtro compartilhado logo acima de `vagaParaAtivar` e trocar o corpo dela:

```ts
/**
 * Convites que DISPUTAM a vaga do plano.
 *
 * Convite pago por credito nao entra: o dono ja pagou por ele avulso, e conta-lo
 * faria o credito comprar uma vaga que ele mesmo ocupa — o segundo convite
 * nasceria e bloquearia o primeiro. `credito: { is: null }` e a pergunta
 * "nenhum credito aponta para este convite".
 *
 * `expiresAt > agora` continua sendo o resto da regra: festa que passou libera a
 * vaga (decisao do Joao, 12/08).
 */
function ocupamVaga(professionalId: string): Prisma.EventWhereInput {
  return {
    professionalId,
    expiresAt: { gt: new Date() },
    credito: { is: null },
  };
}

async function vagaParaAtivar(professionalId: string, plano: Plan, exceto: string): Promise<boolean> {
  const outrosAtivos = await prisma.event.count({
    where: { ...ocupamVaga(professionalId), id: { not: exceto } },
  });
  return podeCriarEvento(plano, outrosAtivos);
}
```

E na porta de criar (a contagem da linha 175), trocar por:

```ts
      const count = await prisma.event.count({ where: ocupamVaga(professionalId) });
```

`Prisma` já está importado em `app/(dashboard)/painel/criar/acoes.ts:16` — não acrescentar de novo.

- [ ] **Step 4: Rodar e ver passar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm exec vitest run tests/credito-de-convite.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Provar que o conserto de 24/08 continua de pé**

Run: `PAGAMENTO_DB_TESTS=1 pnpm exec vitest run tests/limite-de-convites.test.ts`
Expected: PASS (5 testes). Se algum falhar, a mudança quebrou as três portas da cota — parar e investigar antes de seguir.

- [ ] **Step 6: Portão completo**

Run: `pnpm exec tsc --noEmit && pnpm lint && PAGAMENTO_DB_TESTS=1 pnpm test`
Expected: tudo verde.

- [ ] **Step 7: Commit**

```bash
git add "app/(dashboard)/painel/criar/acoes.ts" tests/credito-de-convite.test.ts
git commit -m "feat(credito): convite pago por credito nao ocupa a vaga do plano"
```

---

### Task 4: Criar convite gasta o crédito quando a vaga está tomada

**Files:**
- Modify: `app/(dashboard)/painel/criar/acoes.ts:172-200` (porta de criar)
- Modify: `tests/credito-de-convite.test.ts`

**Interfaces:**
- Consumes: `gastarCredito` e `saldoDeCreditos` de `lib/credito.ts` (Task 2); `ocupamVaga` (Task 3).
- Produces: a criação passa a rodar dentro de um `$transaction`. `SalvarDocumentoResult` continua com a mesma forma — a recusa por falta de crédito sai como `{ ok: false, kind: "limit" }`.

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar ao `describe` de `tests/credito-de-convite.test.ts`:

```ts
  it.skipIf(!enabled)("com a vaga tomada e UM credito, o segundo convite nasce", async () => {
    const db = prisma!;
    const prof = await conta(db);
    await convite(db, prof.id, false); // ocupa a vaga gratuita
    await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990, status: "PAID" },
    });
    const modelo = await convite(db, prof.id, false);

    const criado = await salvarDocumentoConvite({ expectedVersion: 0, document: documentoDe(modelo) });

    expect(criado).toMatchObject({ ok: true });
    const gasto = await db.creditoConvite.findFirst({
      where: { professionalId: prof.id, eventId: (criado as { id: string }).id },
    });
    expect(gasto).not.toBeNull();
  });

  it.skipIf(!enabled)("credito PENDING nao serve: a vaga tomada continua recusando", async () => {
    const db = prisma!;
    const prof = await conta(db);
    await convite(db, prof.id, false);
    await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990, status: "PENDING" },
    });
    const modelo = await convite(db, prof.id, false);

    const criado = await salvarDocumentoConvite({ expectedVersion: 0, document: documentoDe(modelo) });

    expect(criado).toMatchObject({ ok: false, kind: "limit" });
  });

  it.skipIf(!enabled)("o credito e gasto UMA vez: o terceiro convite volta a ser recusado", async () => {
    const db = prisma!;
    const prof = await conta(db);
    await convite(db, prof.id, false);
    await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990, status: "PAID" },
    });
    const modelo = await convite(db, prof.id, false);

    const primeiro = await salvarDocumentoConvite({ expectedVersion: 0, document: documentoDe(modelo) });
    expect(primeiro).toMatchObject({ ok: true });

    const segundo = await salvarDocumentoConvite({ expectedVersion: 0, document: documentoDe(modelo) });
    expect(segundo).toMatchObject({ ok: false, kind: "limit" });
  });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm exec vitest run tests/credito-de-convite.test.ts`
Expected: FAIL — o primeiro dos três responde `{ ok: false, kind: "limit" }`, porque nada ainda gasta crédito.

- [ ] **Step 3: Declarar a recusa por corrida perdida**

Em `app/(dashboard)/painel/criar/acoes.ts`, logo acima de `salvarDocumentoConvite`:

```ts
/** Perdeu a corrida pelo ultimo credito: desfaz o convite e recusa por limite. */
class SemCredito extends Error {}
```

E acrescentar ao bloco de imports:

```ts
import { gastarCredito, saldoDeCreditos } from "@/lib/credito";
```

- [ ] **Step 4: Gastar o crédito na criação**

No bloco `if (!id) { ... }`, substituir a checagem de cota e a criação do evento por:

```ts
    // A PRIMEIRA porta da cota. Sem vaga, o credito avulso e a saida — e ele so
    // vale COMPRADO: `saldoDeCreditos` conta PAID, nunca PENDING. Quem esta com
    // o Pix aberto na tela ainda nao pagou.
    const limit = limiteEventos(planoDaConta);
    let gastarCreditoNaCriacao = false;
    if (limit !== null) {
      const count = await prisma.event.count({ where: ocupamVaga(professionalId) });
      if (count >= limit) {
        if ((await saldoDeCreditos(prisma, professionalId)) < 1) {
          return { ok: false, kind: "limit", error: mensagemLimite(planoDaConta) };
        }
        gastarCreditoNaCriacao = true;
      }
    }

    const subdomain = await gerarSlugUnico(document.basic.slug || document.basic.name || "convite", async (slug) =>
      Boolean(await prisma.event.findUnique({ where: { subdomain: slug } })),
    );

    // O convite e o gasto do credito vao na MESMA transacao. Separados, uma
    // falha no gasto deixaria no ar um convite que ninguem pagou — e o contrario
    // (gastar e falhar ao criar) queimaria o credito sem entregar nada.
    //
    // `gastarCredito` recebe o `db` da transacao, nao o `prisma` global: com o
    // global, o gasto ficaria FORA do rollback.
    let event;
    try {
      event = await prisma.$transaction(async (db) => {
        const criado = await db.event.create({
          data: {
            professionalId,
            type: "QUINZE_ANOS",
            templateId: null,
            title: document.basic.name || "Convite sem título",
            subdomain,
            eventDate,
            expiresAt,
            status: "DRAFT",
            plan: professional.plan,
            customization,
            draftData: jsonDoDocumento(document),
            draftVersion: 1,
            schemaVersion: document.schemaVersion,
          },
        });
        if (gastarCreditoNaCriacao && !(await gastarCredito(db, professionalId, criado.id))) {
          // Alguem gastou o ultimo credito entre a leitura do saldo e este ponto.
          // Lancar desfaz o convite junto, e a recusa sai como limite — que e a
          // verdade: nao havia vaga nem credito.
          throw new SemCredito();
        }
        return criado;
      });
    } catch (err) {
      if (err instanceof SemCredito) {
        return { ok: false, kind: "limit", error: mensagemLimite(planoDaConta) };
      }
      throw err;
    }
```

O restante do bloco (`sincronizarPresentesDoDocumento`, `enderecoPublico`, o `return`) continua igual — ele já usa `event`.

- [ ] **Step 5: Rodar e ver passar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm exec vitest run tests/credito-de-convite.test.ts`
Expected: PASS (6 testes).

- [ ] **Step 6: Portão completo**

Run: `pnpm exec tsc --noEmit && pnpm lint && PAGAMENTO_DB_TESTS=1 pnpm test`
Expected: tudo verde, incluindo `tests/limite-de-convites.test.ts`.

- [ ] **Step 7: Commit**

```bash
git add "app/(dashboard)/painel/criar/acoes.ts" tests/credito-de-convite.test.ts
git commit -m "feat(credito): criar convite sem vaga gasta um credito, na mesma transacao"
```

---

### Task 5: A concessão pelo webhook

**Files:**
- Create: `lib/creditoConvite.ts`
- Create: `lib/creditoConvite.test.ts`

**Interfaces:**
- Consumes: modelo `CreditoConvite` (Task 1).
- Produces:
  - `export async function acharCreditoConvite(dataId: string, referencia: string | null | undefined): Promise<string | null>`
  - `export async function confirmarCreditoConvite(creditoId: string, agora: Date, providerId?: string | null): Promise<void>`

- [ ] **Step 1: Escrever os testes que falham**

Criar `lib/creditoConvite.test.ts`:

```ts
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { acharCreditoConvite, confirmarCreditoConvite } from "./creditoConvite";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;

const MARCA = "credito-webhook-teste";

async function conta(db: PrismaClient) {
  const sufixo = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return db.professional.create({
    data: { name: "Dono", email: `${MARCA}-${sufixo}@exemplo.test`, passwordHash: "x" },
  });
}

describe("concessao do credito pelo webhook", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.creditoConvite.deleteMany({
      where: { professional: { email: { contains: MARCA } } },
    });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
    await prisma.$disconnect();
  });

  it.skipIf(!enabled)("PENDING vira PAID e grava o vinculo da cobranca", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const credito = await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990 },
    });
    await confirmarCreditoConvite(credito.id, new Date(), `charge-${credito.id}`);
    const depois = await db.creditoConvite.findUnique({ where: { id: credito.id } });
    expect(depois?.status).toBe("PAID");
    expect(depois?.providerId).toBe(`charge-${credito.id}`);
    expect(depois?.paidAt).not.toBeNull();
  });

  it.skipIf(!enabled)("a MESMA notificacao duas vezes concede UM credito so", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const credito = await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990 },
    });
    await confirmarCreditoConvite(credito.id, new Date(), `charge-${credito.id}`);
    const primeiro = await db.creditoConvite.findUnique({ where: { id: credito.id } });
    await confirmarCreditoConvite(credito.id, new Date(), `charge-${credito.id}`);
    const segundo = await db.creditoConvite.findUnique({ where: { id: credito.id } });
    // A segunda passada nao mexe em nada — nem no paidAt.
    expect(segundo?.paidAt?.getTime()).toBe(primeiro?.paidAt?.getTime());
    expect(
      await db.creditoConvite.count({ where: { professionalId: prof.id, status: "PAID" } }),
    ).toBe(1);
  });

  it.skipIf(!enabled)("FAILED tambem e concedido: o QR estava vivo", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const credito = await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990, status: "FAILED" },
    });
    await confirmarCreditoConvite(credito.id, new Date(), `charge-${credito.id}`);
    const depois = await db.creditoConvite.findUnique({ where: { id: credito.id } });
    expect(depois?.status).toBe("PAID");
  });

  it.skipIf(!enabled)("acha pela cobranca e, sem ela, pela referencia", async () => {
    const db = prisma!;
    const prof = await conta(db);
    const comCobranca = await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990, providerId: `charge-achado-${Date.now()}` },
    });
    const semCobranca = await db.creditoConvite.create({
      data: { professionalId: prof.id, amountCents: 2990 },
    });
    expect(await acharCreditoConvite(comCobranca.providerId!, null)).toBe(comCobranca.id);
    expect(await acharCreditoConvite("charge-desconhecida", semCobranca.id)).toBe(semCobranca.id);
    expect(await acharCreditoConvite("charge-desconhecida", null)).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm exec vitest run lib/creditoConvite.test.ts`
Expected: FAIL — `Cannot find module './creditoConvite'`.

- [ ] **Step 3: Implementar `lib/creditoConvite.ts`**

```ts
// Nucleo (server-only, SEM "use server") da concessao do credito de convite.
// Chamado SO pelo webhook do Mercado Pago — e por ninguem mais.
//
// Quem transforma dinheiro em credito e o gateway, depois de confirmar o
// pagamento; nunca o clique no painel (`comprarCreditoConvite` so pede a
// cobranca e deixa a linha PENDING). Mesmo principio de `lib/passeEdicao.ts`.
import { prisma } from "@/lib/db";

/**
 * Confirma o credito pago.
 *
 * Idempotente pelo COMPARE-AND-SET no status: o Mercado Pago reentrega a mesma
 * notificacao mais de uma vez por contrato, e so quem consegue virar a linha de
 * PENDING para PAID (`count === 1`) concede. A segunda passada acha a linha ja
 * PAID, o WHERE nao morde, e nada acontece — nem o `paidAt` anda.
 *
 * FAILED entra no WHERE pelo mesmo motivo do passe: timeout de rede DEPOIS de o
 * MP criar a cobranca deixa a linha marcada como falha com o QR vivo. Quem chega
 * aqui e o webhook, que ja reconsultou o pagamento e ouviu PAID do gateway — a
 * verdade e dele, e o FAILED do nosso lado era um palpite.
 */
export async function confirmarCreditoConvite(
  creditoId: string,
  agora: Date,
  providerId?: string | null,
): Promise<void> {
  await prisma.creditoConvite.updateMany({
    where: { id: creditoId, status: { in: ["PENDING", "FAILED"] } },
    data: { status: "PAID", paidAt: agora, ...(providerId ? { providerId } : {}) },
  });
  // `count === 0` e ROTINA, nao incidente: e a reentrega que o MP promete.
}

/**
 * Acha a linha do credito a partir do que o webhook tem em maos.
 *
 * Pela cobranca primeiro; pela referencia depois — que e o caso da linha cujo
 * `providerId` nao gravou na compra (ver o catch de `comprarCreditoConvite`). E
 * agora que esse vinculo se conserta.
 */
export async function acharCreditoConvite(
  dataId: string,
  referencia: string | null | undefined,
): Promise<string | null> {
  const porCobranca = await prisma.creditoConvite.findFirst({
    where: { providerId: dataId },
    select: { id: true },
  });
  if (porCobranca) return porCobranca.id;

  if (!referencia) return null;
  const porReferencia = await prisma.creditoConvite.findFirst({
    where: { id: referencia },
    select: { id: true },
  });
  return porReferencia?.id ?? null;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `PAGAMENTO_DB_TESTS=1 pnpm exec vitest run lib/creditoConvite.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Portão completo**

Run: `pnpm exec tsc --noEmit && pnpm lint && PAGAMENTO_DB_TESTS=1 pnpm test`
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add lib/creditoConvite.ts lib/creditoConvite.test.ts
git commit -m "feat(credito): so o webhook concede o credito, e a reentrega nao concede duas vezes"
```

---

### Task 6: A compra no painel e o terceiro destino do webhook

**Files:**
- Create: `app/(dashboard)/painel/creditos/acoes.ts`
- Modify: `app/api/webhooks/mercadopago/route.ts:98-112`

**Interfaces:**
- Consumes: `CREDITO_PRECO_CENTS` (Task 2), `acharCreditoConvite` e `confirmarCreditoConvite` (Task 5).
- Produces: `export async function comprarCreditoConvite(): Promise<ComprarCreditoResult>`, com
  `export type ComprarCreditoResult = { ok: true; pixCode: string; pixQrUrl: string; creditoId: string } | { ok: false; erro: string }`.

- [ ] **Step 1: Criar `app/(dashboard)/painel/creditos/acoes.ts`**

```ts
"use server";

/**
 * A porta do painel para comprar um credito de convite (R$ 29,90 no Pix).
 *
 * Espelha `painel/[id]/liberar/acoes.ts`: cria a linha PENDING primeiro (o id
 * vira a referencia da cobranca) e marca FAILED se o gateway recusar. E NUNCA
 * concede — nada aqui deixa uma linha PAID. Quem concede e o webhook
 * (/api/webhooks/mercadopago), depois de reconsultar o pagamento no MP.
 *
 * Diferenca para o passe: o credito e da CONTA, nao de um convite. Ele e
 * comprado justamente quando nao ha convite — a pessoa esta barrada na porta de
 * criar. Por isso ele nao mora em `Transaction`, que exige `eventId`.
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/pagamentos";
import { CREDITO_PRECO_CENTS } from "@/lib/credito";

export type ComprarCreditoResult =
  | { ok: true; pixCode: string; pixQrUrl: string; creditoId: string }
  | { ok: false; erro: string };

/**
 * Por quanto tempo uma compra PENDENTE ainda e REAPROVEITADA em vez de virar uma
 * segunda. Mesmo motivo do passe: o `X-Idempotency-Key` do provider E a
 * referencia, ou seja, o id da linha. Dois cliques criando duas linhas viram
 * dois Pix de verdade, os dois pagaveis — R$ 59,80 por um credito so, sem
 * estorno automatico.
 */
const REAPROVEITAR_MINUTOS = 30;

export async function comprarCreditoConvite(): Promise<ComprarCreditoResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, erro: "Sua sessão expirou. Entre de novo." };
  const professionalId = session.user.id;

  const agora = new Date();
  const aberta = await prisma.creditoConvite.findFirst({
    where: {
      professionalId,
      status: "PENDING",
      createdAt: { gt: new Date(agora.getTime() - REAPROVEITAR_MINUTOS * 60_000) },
    },
    orderBy: { createdAt: "desc" },
  });

  const credito =
    aberta ??
    (await prisma.creditoConvite.create({
      data: { professionalId, amountCents: CREDITO_PRECO_CENTS, status: "PENDING" },
    }));

  let cobranca;
  try {
    cobranca = await getPaymentProvider().criarCobrancaPix({
      valorCents: CREDITO_PRECO_CENTS,
      descricao: "Convite extra",
      referencia: credito.id,
      pagador: { email: session.user.email ?? undefined },
    });
  } catch (err) {
    console.error("[credito-convite] falha ao criar cobrança Pix:", err);
    // FAILED so vale para a linha NOVA. A reaproveitada fica quieta: o Pix dela
    // pode estar vivo desde a tentativa anterior, e derrubar a linha derrubaria
    // o unico rastro dele. O compare-and-set do webhook aceita FAILED por isso.
    if (!aberta) {
      await prisma.creditoConvite.update({
        where: { id: credito.id },
        data: { status: "FAILED" },
      });
    }
    return { ok: false, erro: "Não foi possível gerar o Pix agora. Tente de novo." };
  }

  // Daqui para baixo a cobranca EXISTE no gateway. Marcar FAILED depois disto
  // seria mentir para o ledger: o cliente pagaria um Pix vivo e o webhook
  // procuraria por um vinculo que nao gravamos.
  if (credito.providerId !== cobranca.chargeId) {
    try {
      await prisma.creditoConvite.update({
        where: { id: credito.id },
        data: { providerId: cobranca.chargeId },
      });
    } catch (err) {
      console.error(
        `[credito-convite] cobrança criada mas o providerId não gravou — credito=${credito.id} charge=${cobranca.chargeId}`,
        err,
      );
      // A linha continua PENDING de proposito: e a verdade (Pix vivo), e o
      // webhook ainda a acha pela referencia.
      return { ok: false, erro: "Não foi possível gerar o Pix agora. Tente de novo." };
    }
  }

  return {
    ok: true,
    pixCode: cobranca.pixCode,
    pixQrUrl: cobranca.pixQrUrl,
    creditoId: credito.id,
  };
}
```

- [ ] **Step 2: Ligar o terceiro destino no webhook**

Em `app/api/webhooks/mercadopago/route.ts`, acrescentar ao bloco de imports:

```ts
import { acharCreditoConvite, confirmarCreditoConvite } from "@/lib/creditoConvite";
```

E, dentro de `if (status === "PAID")`, substituir o trecho que hoje só trata o passe:

```ts
          const passe = await acharPasseEdicao(dataId, referencia);
          if (passe) {
            await confirmarPasseEdicao(passe, new Date(), dataId);
          } else {
            console.error(
              `[webhook mercadopago] pagamento APROVADO sem dono — data.id=${dataId} ` +
                `external_reference=${referencia ?? "-"}. Nada foi concedido.`,
            );
          }
```

por:

```ts
          const passe = await acharPasseEdicao(dataId, referencia);
          if (passe) {
            await confirmarPasseEdicao(passe, new Date(), dataId);
          } else {
            // Terceiro destino: o credito de convite. E AQUI, e so aqui, que uma
            // linha de credito vira PAID — a compra no painel a deixa PENDING de
            // proposito.
            const credito = await acharCreditoConvite(dataId, referencia);
            if (credito) {
              await confirmarCreditoConvite(credito, new Date(), dataId);
            } else {
              console.error(
                `[webhook mercadopago] pagamento APROVADO sem dono — data.id=${dataId} ` +
                  `external_reference=${referencia ?? "-"}. Nada foi concedido.`,
              );
            }
          }
```

- [ ] **Step 3: Portão completo**

Run: `pnpm exec tsc --noEmit && pnpm lint && PAGAMENTO_DB_TESTS=1 pnpm test`
Expected: tudo verde. `tests/passe-edicao.test.ts` e `tests/webhook-assinatura.test.ts` têm de continuar passando — o caminho do passe não pode ter mudado de comportamento.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/painel/creditos/acoes.ts" app/api/webhooks/mercadopago/route.ts
git commit -m "feat(credito): Pix do credito no painel, e o webhook como unico caminho da concessao"
```

---

### Task 7: O popup de plano ganha a segunda saída

Hoje o popup do limite (`RecursoBloqueado`, chamado em `CriarConvite.tsx:2913`) tem uma saída só: "Ver planos", que leva a `/painel/plano`. O componente não tem onde encaixar um segundo caminho — é isso que esta task abre.

**Files:**
- Modify: `components/plano/RecursoBloqueado.tsx:20-42` (props) e o `footer` do `Modal` (linha ~63)
- Modify: `app/(dashboard)/painel/criar/CriarConvite.tsx:2912-2928`

**Interfaces:**
- Consumes: nada de tasks anteriores.
- Produces: prop opcional `acaoSecundaria?: ReactNode` em `RecursoBloqueado`, renderizada no footer à esquerda de "Ver planos". Sem ela, o popup fica exatamente como está hoje — os outros seis usos do componente não mudam.

- [ ] **Step 1: Abrir o slot no componente**

Em `components/plano/RecursoBloqueado.tsx`, acrescentar ao import do topo:

```ts
import type { ReactNode } from "react";
```

Acrescentar a prop à desestruturação (depois de `ganhos = []`):

```ts
  acaoSecundaria,
```

E ao tipo das props (depois de `ganhos?: string[];`):

```ts
  /**
   * Segundo caminho, quando ele existe: hoje só o "comprar convite extra" do
   * limite de convites. Opcional de proposito — os outros usos do popup tem uma
   * saida so, e um botao a mais neles seria ruido.
   */
  acaoSecundaria?: ReactNode;
```

E no `footer`, dentro do ramo `dePlano`, entre o "Agora não" e o `<Link>`:

```tsx
            {acaoSecundaria}
```

- [ ] **Step 2: Conferir que nada mais quebrou**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: limpo. A prop é opcional, então os outros usos de `RecursoBloqueado` continuam válidos sem mudança.

- [ ] **Step 3: Passar a segunda saída no popup do limite**

`Link` já está importado em `app/(dashboard)/painel/criar/CriarConvite.tsx:18` — não acrescentar de novo.

No `<RecursoBloqueado>` da linha 2913, acrescentar a prop e ajustar a descrição, que hoje só fala em assinar:

```tsx
        descricao={`O plano ${rotuloPlano(plano)} inclui 1 convite. Você pode comprar um convite extra avulso, ou assinar um plano com convites ilimitados.`}
        acaoSecundaria={
          <Link
            href="/painel/creditos"
            className="rounded-xl border border-[#E4E4EA] bg-white px-4 py-2.5 text-[13.5px] font-semibold text-[#17171B] transition-colors hover:bg-[#F4F4F6]"
          >
            Comprar convite extra
          </Link>
        }
```

O preço NÃO entra neste rótulo: ele mora em `CREDITO_PRECO_CENTS` e aparece na tela de compra (Task 8). Escrito aqui à mão, passaria a existir em dois lugares e divergiria no primeiro reajuste.

- [ ] **Step 4: Portão completo**

Run: `pnpm exec tsc --noEmit && pnpm lint && PAGAMENTO_DB_TESTS=1 pnpm test`
Expected: tudo verde.

- [ ] **Step 5: Commit**

```bash
git add components/plano/RecursoBloqueado.tsx "app/(dashboard)/painel/criar/CriarConvite.tsx"
git commit -m "feat(credito): o popup do limite passa a oferecer o convite extra, alem de assinar"
```

---

### Task 8: A tela de compra do crédito

**Files:**
- Create: `app/(dashboard)/painel/creditos/page.tsx`
- Create: `app/(dashboard)/painel/creditos/CreditosCliente.tsx`

**Interfaces:**
- Consumes: `comprarCreditoConvite` (Task 6), `CREDITO_PRECO_CENTS` e `saldoDeCreditos` (Task 2).
- Produces: a rota `/painel/creditos`, para onde o popup da Task 7 aponta.

**Modelo a seguir:** `app/(dashboard)/painel/[id]/liberar/` — é a mesma forma (página server que carrega o estado + componente cliente que gera o Pix). Ler os dois antes de escrever, e copiar as decisões já tomadas lá: o `useTransition` em volta da action, o `router.refresh()` depois de uma recusa, e o QR que **pode voltar vazio** (`pixQrUrl` ausente do provedor), caso em que o copia-e-cola sozinho já é caminho completo — `<Image src="">` quebra a tela justo onde a cobrança já existe.

- [ ] **Step 1: A página server**

`app/(dashboard)/painel/creditos/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { saldoDeCreditos } from "@/lib/credito";
import { CreditosCliente } from "./CreditosCliente";

export default async function CreditosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  // O saldo e derivado, sempre: nao ha coluna para ler.
  const saldo = await saldoDeCreditos(prisma, session.user.id);
  return <CreditosCliente saldo={saldo} />;
}
```

- [ ] **Step 2: O componente cliente**

`app/(dashboard)/painel/creditos/CreditosCliente.tsx` — a estrutura é a do `LiberarCliente.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CREDITO_PRECO_CENTS } from "@/lib/credito";
import { comprarCreditoConvite } from "./acoes";

export function CreditosCliente({ saldo }: { saldo: number }) {
  const router = useRouter();
  const [pix, setPix] = useState<{ code: string; qr: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, start] = useTransition();

  const preco = (CREDITO_PRECO_CENTS / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  function gerarPix() {
    setErro(null);
    start(async () => {
      const r = await comprarCreditoConvite();
      if (r.ok) {
        setPix({ code: r.pixCode, qr: r.pixQrUrl });
        return;
      }
      setErro(r.erro);
      // Recusa aqui costuma ser tela velha (sessao vencida). Recarregar troca a
      // tela pelo que e verdade agora. Mesma decisao do `LiberarCliente`.
      router.refresh();
    });
  }

  return (
    <div>
      {/* O saldo aparece porque a pessoa acabou de pagar e volta para conferir:
          sem ele, a unica forma de saber se o credito caiu e tentar criar. */}
      <p>Você tem {saldo} convite(s) extra(s) disponível(is).</p>

      {!pix ? (
        <button type="button" onClick={gerarPix} disabled={pendente}>
          {pendente ? "Gerando Pix..." : `Comprar convite extra — ${preco}`}
        </button>
      ) : (
        <div>
          {/* O QR pode voltar vazio do provedor. Sem ele, o copia-e-cola sozinho
              e caminho completo — `<Image src="">` quebraria a tela justo onde a
              cobranca JA existe. */}
          {pix.qr ? <img src={pix.qr} alt="QR Code do Pix do convite extra" /> : null}
          <code>{pix.code}</code>
          {/* A VERDADE do contrato: o credito nao existe enquanto o pagamento
              nao e confirmado pelo gateway. Prometer o contrario faz a pessoa
              fechar a tela achando que ja pode criar o convite. */}
          <p>Assim que o pagamento for confirmado, o convite extra fica disponível.</p>
          <button type="button" onClick={() => router.refresh()}>
            Já paguei — conferir agora
          </button>
        </div>
      )}

      {erro ? <p role="alert">{erro}</p> : null}
    </div>
  );
}
```

O layout acima é a ESTRUTURA, não o visual final: as classes do painel (`scv-*`, os cantos `rounded-[16px]`, a moldura do QR) devem ser copiadas do `LiberarCliente.tsx`, que já passou pelo aval do dono.

- [ ] **Step 3: Ver rodando**

Run: `pnpm dev`

Com uma conta no plano Grátis que já tenha um convite no ar: clicar em "Novo convite" → o popup mostra as duas saídas → "Comprar convite extra" leva a `/painel/creditos` → o Pix aparece. Conferir que o convite **não nasce** ao gerar o Pix.

> **Regra do dono:** ele decide VENDO. Mostrar a tela a ele antes de considerar a task pronta, e não commitar a parte visual sem o aval.

- [ ] **Step 4: Portão completo**

Run: `pnpm exec tsc --noEmit && pnpm lint && PAGAMENTO_DB_TESTS=1 pnpm test`
Expected: tudo verde.

- [ ] **Step 5: Commit (depois do aval visual)**

```bash
git add "app/(dashboard)/painel/creditos"
git commit -m "feat(credito): a tela de comprar o convite extra, com o Pix e o saldo"
```

---

## O que este plano NÃO faz

- **Tela de saldo.** Não há onde ver "você tem 2 créditos". O saldo só aparece indiretamente, na porta de criar que deixa passar.
- **Pacote de créditos.** Comprar 3 de uma vez. O modelo aguenta (são três linhas), mas a tela é decisão comercial não tomada.
- **Estorno de crédito não gasto.** Não existe caminho de estorno para o passe hoje; abrir um para o crédito criaria precedente sem decisão.
- **Crédito nos planos pagos.** `limiteEventos` continua `null` em CLASSICO e PREMIUM.
- **Crédito para reativar ou publicar.** As portas 2 e 3 continuam recusando por limite: o crédito é gasto na criação, e um convite que já existe sem crédito não compra um depois.
