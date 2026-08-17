import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelarAssinaturaMp,
  consultarAssinaturaMp,
  consultarCobrancaAssinaturaMp,
  criarAssinaturaMp,
} from "./assinatura";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

afterEach(() => {
  fetchMock.mockReset();
  delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
});

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
    // O preço sai de PLANOS_INFO (Clássico = 5900 centavos), nunca escrito aqui.
    expect(body.auto_recurring).toMatchObject({
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 59,
      currency_id: "BRL",
    });
    expect(body.payer_email).toBe("pro@exemplo.com");
    // É por este campo que o webhook liga a assinatura à conta.
    expect(body.external_reference).toBe("prof-1");
    // O cartão é digitado NO MERCADO PAGO. Mandar token aqui nos jogaria dentro
    // do escopo PCI — este expect existe para que ninguém "ajude" no futuro.
    expect(body).not.toHaveProperty("card_token_id");
  });

  it("usa o preço do Premium quando o plano é Premium", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "p", init_point: "https://mp.com/x" }) });

    await criarAssinaturaMp({
      plano: "PREMIUM",
      email: "a@b.com",
      professionalId: "p",
      backUrl: "https://x/y",
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).auto_recurring.transaction_amount).toBe(149);
  });

  it("recusa o Básico — plano grátis não se assina", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    await expect(
      criarAssinaturaMp({ plano: "BASICO", email: "a@b.com", professionalId: "p", backUrl: "https://x/y" }),
    ).rejects.toThrow(/Básico/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sem token configurado, falha alto em vez de fingir", async () => {
    await expect(
      criarAssinaturaMp({ plano: "CLASSICO", email: "a@b.com", professionalId: "p", backUrl: "https://x/y" }),
    ).rejects.toThrow(/MERCADO_PAGO_ACCESS_TOKEN/);
  });

  it("erro do gateway vira erro nosso, com o status", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({}) });
    await expect(
      criarAssinaturaMp({ plano: "CLASSICO", email: "a@b.com", professionalId: "p", backUrl: "https://x/y" }),
    ).rejects.toThrow(/400/);
  });

  it("resposta sem init_point não passa em silêncio", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "pre-1" }) });
    await expect(
      criarAssinaturaMp({ plano: "CLASSICO", email: "a@b.com", professionalId: "p", backUrl: "https://x/y" }),
    ).rejects.toThrow(/init_point/);
  });
});

describe("consultarAssinaturaMp", () => {
  it("lê o status REAL no MP, não o que o webhook disse", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "pre-9", status: "authorized", external_reference: "prof-1" }),
    });

    const r = await consultarAssinaturaMp("pre-9");

    expect(r).toEqual({ preapprovalId: "pre-9", status: "authorized" });
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.mercadopago.com/preapproval/pre-9");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer APP_USR-teste");
  });

  it("consulta que falha vira erro — o webhook precisa responder 5xx e ser reenviado", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await expect(consultarAssinaturaMp("pre-9")).rejects.toThrow(/500/);
  });
});

describe("cancelarAssinaturaMp", () => {
  it("manda o MP PARAR de cobrar — cancelar só na nossa linha seguiria cobrando", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });

    expect(await cancelarAssinaturaMp("pre-9")).toBe(true);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.mercadopago.com/preapproval/pre-9");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({ status: "cancelled" });
  });

  it("recusa do gateway devolve false — ninguém pode dizer que cancelou sem isso", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
    expect(await cancelarAssinaturaMp("pre-9")).toBe(false);
  });
});

describe("consultarCobrancaAssinaturaMp", () => {
  it("traz a assinatura dona, o valor em centavos e se foi mesmo paga", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 4477,
        preapproval_id: "pre-9",
        transaction_amount: 59,
        status: "processed",
        payment: { id: 99, status: "approved", date_approved: "2026-08-17T12:00:00.000-03:00" },
      }),
    });

    const r = await consultarCobrancaAssinaturaMp("4477");

    expect(r.preapprovalId).toBe("pre-9");
    // O id da COBRANÇA mensal (não o do pagamento): é o que a notificação
    // repete quando o MP entrega duas vezes, e é o que o índice único guarda.
    expect(r.providerId).toBe("4477");
    expect(r.amountCents).toBe(5900);
    expect(r.pago).toBe(true);
    expect(r.pagoEm.toISOString()).toBe("2026-08-17T15:00:00.000Z");
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.mercadopago.com/authorized_payments/4477");
  });

  it("cobrança que o cartão recusou NÃO conta como paga", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 4478,
        preapproval_id: "pre-9",
        transaction_amount: 59,
        status: "recycling",
        payment: { id: 100, status: "rejected" },
      }),
    });

    expect((await consultarCobrancaAssinaturaMp("4478")).pago).toBe(false);
  });

  it("cobrança sem assinatura dona não passa em silêncio", async () => {
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "APP_USR-teste";
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, transaction_amount: 59, payment: { status: "approved" } }),
    });
    await expect(consultarCobrancaAssinaturaMp("1")).rejects.toThrow(/preapproval/i);
  });
});
