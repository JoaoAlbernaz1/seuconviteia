import { afterEach, describe, expect, it, vi } from "vitest";
import { criarAssinaturaMp } from "./assinatura";

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
