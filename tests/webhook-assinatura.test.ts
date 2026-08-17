// Teste do WEBHOOK inteiro no caminho da assinatura: entra uma notificação do
// Mercado Pago (assinada), sai uma linha no banco. É o único lugar que prova a
// ligação — roteamento por tipo, re-consulta no MP e gravação idempotente — que
// os testes de unidade, cada um com seu pedaço, não conseguem provar.
//
// Precisa de banco de verdade (a idempotência mora no índice único), então fica
// atrás da mesma env var dos outros testes de dinheiro:
//
//   PAGAMENTO_DB_TESTS=1 DATABASE_URL=postgresql://postgres:...@127.0.0.1:5433/seuconviteia \
//     npx vitest run tests/webhook-assinatura.test.ts
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { POST } from "@/app/api/webhooks/mercadopago/route";

const enabled = process.env.PAGAMENTO_DB_TESTS === "1";
const prisma = enabled ? new PrismaClient() : null;

const MARCA = "webhook-mp-teste";
const SEGREDO = "segredo-do-webhook";
const URL_WEBHOOK = "https://seuconvite.orivya.com.br/api/webhooks/mercadopago";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  // Token setado = provider "mercadopago" ativo; segredo setado = webhook
  // protegido (sem ele a rota devolve 503 de propósito).
  process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = SEGREDO;
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
  delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
});

/** Notificação assinada como o MP assina (`x-signature: ts=..,v1=..`). */
function notificacao(tipo: string, dataId: string, assinar = true): Request {
  const ts = "1700000000";
  const requestId = "req-1";
  const v1 = createHmac("sha256", SEGREDO)
    .update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`)
    .digest("hex");
  return new Request(URL_WEBHOOK, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-request-id": requestId,
      "x-signature": assinar ? `ts=${ts},v1=${v1}` : `ts=${ts},v1=${"0".repeat(64)}`,
    },
    body: JSON.stringify({ type: tipo, data: { id: dataId } }),
  });
}

function respostaMp(json: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => json };
}

async function conta(db: PrismaClient, pre: string) {
  return db.professional.create({
    data: {
      name: "Assinante",
      email: `${MARCA}-${pre}@exemplo.test`,
      passwordHash: "x",
      plan: "CLASSICO",
      mpPreapprovalId: pre,
      assinaturaStatus: "pending",
    },
  });
}

describe("webhook do Mercado Pago — assinatura do SaaS", () => {
  afterAll(async () => {
    if (!prisma) return;
    await prisma.cobrancaAssinatura.deleteMany({ where: { providerId: { startsWith: MARCA } } });
    await prisma.professional.deleteMany({ where: { email: { contains: MARCA } } });
    await prisma.$disconnect();
  });

  it.skipIf(!enabled)("cobrança mensal aprovada credita o mês — e a segunda entrega não credita de novo", async () => {
    const db = prisma!;
    const pre = `${MARCA}-p${Date.now()}`;
    const p = await conta(db, pre);
    const cobrancaId = `${MARCA}-cob-${Date.now()}`;

    fetchMock.mockResolvedValue(
      respostaMp({
        id: cobrancaId,
        preapproval_id: pre,
        transaction_amount: 59,
        payment: { id: 1, status: "approved", date_approved: "2026-08-17T12:00:00.000Z" },
      }),
    );

    const r1 = await POST(notificacao("subscription_authorized_payment", cobrancaId));
    expect(r1.status).toBe(200);

    const depois = await db.professional.findUniqueOrThrow({ where: { id: p.id } });
    expect(depois.assinaturaStatus).toBe("authorized");
    // Um mês a partir do pagamento.
    expect(depois.assinaturaAte?.toISOString()).toBe("2026-09-17T12:00:00.000Z");
    const cobranca = await db.cobrancaAssinatura.findUniqueOrThrow({
      where: { providerId: cobrancaId },
    });
    expect(cobranca.amountCents).toBe(5900);

    // Reentrega da MESMA notificação: 200 (o MP para de reenviar) e nada muda.
    const r2 = await POST(notificacao("subscription_authorized_payment", cobrancaId));
    expect(r2.status).toBe(200);
    expect(await db.cobrancaAssinatura.count({ where: { providerId: cobrancaId } })).toBe(1);
    expect(
      (await db.professional.findUniqueOrThrow({ where: { id: p.id } })).assinaturaAte?.toISOString(),
    ).toBe("2026-09-17T12:00:00.000Z");
  });

  it.skipIf(!enabled)("cobrança recusada não vira mês pago", async () => {
    const db = prisma!;
    const pre = `${MARCA}-r${Date.now()}`;
    const p = await conta(db, pre);
    const cobrancaId = `${MARCA}-rec-${Date.now()}`;

    fetchMock.mockResolvedValue(
      respostaMp({
        id: cobrancaId,
        preapproval_id: pre,
        transaction_amount: 59,
        payment: { id: 2, status: "rejected" },
      }),
    );

    expect((await POST(notificacao("subscription_authorized_payment", cobrancaId))).status).toBe(200);
    expect(await db.cobrancaAssinatura.count({ where: { providerId: cobrancaId } })).toBe(0);
    expect((await db.professional.findUniqueOrThrow({ where: { id: p.id } })).assinaturaAte).toBeNull();
  });

  it.skipIf(!enabled)("cancelamento espelha o status e PRESERVA o prazo já pago", async () => {
    const db = prisma!;
    const pre = `${MARCA}-x${Date.now()}`;
    const p = await conta(db, pre);
    const ate = new Date("2026-12-01T00:00:00.000Z");
    await db.professional.update({ where: { id: p.id }, data: { assinaturaAte: ate } });

    fetchMock.mockResolvedValue(respostaMp({ id: pre, status: "cancelled" }));

    expect((await POST(notificacao("subscription_preapproval", pre))).status).toBe(200);

    const depois = await db.professional.findUniqueOrThrow({ where: { id: p.id } });
    expect(depois.assinaturaStatus).toBe("cancelled");
    expect(depois.assinaturaAte?.toISOString()).toBe(ate.toISOString());
    // Nunca acreditamos no payload: o status veio da consulta ao MP.
    expect(fetchMock.mock.calls[0][0]).toContain("/preapproval/");
  });

  it.skipIf(!enabled)("assinatura inválida é recusada ANTES de qualquer consulta", async () => {
    const r = await POST(notificacao("subscription_preapproval", `${MARCA}-nao-assinado`, false));
    expect(r.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.skipIf(!enabled)("consulta que falha devolve 5xx para o MP reenviar", async () => {
    fetchMock.mockResolvedValue(respostaMp({}, false, 500));
    const r = await POST(notificacao("subscription_preapproval", `${MARCA}-erro`));
    expect(r.status).toBe(500);
  });
});
