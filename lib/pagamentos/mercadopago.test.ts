import { describe, it, expect, vi } from "vitest";
import { createHmac } from "node:crypto";
import {
  MercadoPagoPaymentProvider,
  mapMpStatus,
  tipoDeNotificacao,
  verificarAssinaturaMp,
  urlDoWebhookMp,
  webhookDesprotegido,
} from "./mercadopago";

describe("mapMpStatus", () => {
  it("mapeia os status do Mercado Pago", () => {
    expect(mapMpStatus("approved")).toBe("PAID");
    expect(mapMpStatus("pending")).toBe("PENDING");
    expect(mapMpStatus("in_process")).toBe("PENDING");
    expect(mapMpStatus("rejected")).toBe("FAILED");
    expect(mapMpStatus("cancelled")).toBe("FAILED");
    expect(mapMpStatus("refunded")).toBe("REFUNDED");
    expect(mapMpStatus("charged_back")).toBe("REFUNDED");
    expect(mapMpStatus(undefined)).toBe("PENDING");
  });
});

describe("verificarAssinaturaMp", () => {
  const secret = "segredo-teste";
  const dataId = "123456";
  const reqId = "req-abc";
  const ts = "1700000000";
  const v1 = createHmac("sha256", secret)
    .update(`id:${dataId};request-id:${reqId};ts:${ts};`)
    .digest("hex");

  it("sem segredo, não valida (dev) -> true", () => {
    expect(
      verificarAssinaturaMp({ xSignature: "qualquer", xRequestId: reqId, dataId, secret: undefined }),
    ).toBe(true);
  });

  it("assinatura correta -> true", () => {
    expect(
      verificarAssinaturaMp({
        xSignature: `ts=${ts},v1=${v1}`,
        xRequestId: reqId,
        dataId,
        secret,
      }),
    ).toBe(true);
  });

  it("assinatura adulterada -> false", () => {
    expect(
      verificarAssinaturaMp({
        xSignature: `ts=${ts},v1=${"0".repeat(64)}`,
        xRequestId: reqId,
        dataId,
        secret,
      }),
    ).toBe(false);
  });

  it("dataId ou header ausente com segredo -> false", () => {
    expect(
      verificarAssinaturaMp({ xSignature: null, xRequestId: reqId, dataId, secret }),
    ).toBe(false);
    expect(
      verificarAssinaturaMp({ xSignature: `ts=${ts},v1=${v1}`, xRequestId: reqId, dataId: null, secret }),
    ).toBe(false);
  });
});

describe("webhookDesprotegido — trava de producao", () => {
  it("recusa quando o Mercado Pago esta ativo e nao ha segredo", () => {
    expect(webhookDesprotegido("mercadopago", undefined)).toBe(true);
    expect(webhookDesprotegido("mercadopago", "   ")).toBe(true);
  });

  it("aceita quando ha segredo", () => {
    expect(webhookDesprotegido("mercadopago", "abc123")).toBe(false);
  });

  it("nao atrapalha o provedor simulado (dev)", () => {
    expect(webhookDesprotegido("fake", undefined)).toBe(false);
  });
});

describe("tipoDeNotificacao", () => {
  it("separa pagamento avulso de assinatura", () => {
    expect(tipoDeNotificacao({ type: "payment", data: { id: "1" } })).toBe("pagamento");
    expect(tipoDeNotificacao({ type: "subscription_preapproval", data: { id: "pre-1" } })).toBe(
      "assinatura",
    );
    expect(
      tipoDeNotificacao({ type: "subscription_authorized_payment", data: { id: "pay-1" } }),
    ).toBe("cobranca-assinatura");
  });

  it("aceita o campo `topic`, que o MP usa em algumas notificacoes", () => {
    expect(tipoDeNotificacao({ topic: "payment", data: { id: "1" } })).toBe("pagamento");
  });

  it("o que nao conhecemos e ignorado explicitamente", () => {
    expect(tipoDeNotificacao({ type: "plan", data: { id: "x" } })).toBe("desconhecido");
    expect(tipoDeNotificacao(null)).toBe("desconhecido");
  });
});

// `notification_url` na PROPRIA cobranca. Sem ela, a confirmacao depende 100% da
// URL cadastrada na mao no painel do MP: alguem mexe (ou cadastra so o modo
// teste) e o dinheiro entra sem conceder nada — o convidado paga e olha um QR
// eterno. Mandar junto e o cinto de seguranca, e o MP prioriza a do pagamento.
describe("urlDoWebhookMp", () => {
  it("monta a URL publica do webhook", () => {
    expect(urlDoWebhookMp("seuconvite.orivya.com.br")).toBe(
      "https://seuconvite.orivya.com.br/api/webhooks/mercadopago",
    );
  });

  it("nao manda URL local — o MP recusaria a cobranca inteira", () => {
    // `localhost` e IP cru sao inalcancaveis pelo MP; mandar isso faria a
    // criacao da cobranca FALHAR, quebrando o dev com credencial real.
    expect(urlDoWebhookMp("localhost:3000")).toBeUndefined();
    expect(urlDoWebhookMp("192.168.1.4:3000")).toBeUndefined();
  });
});

describe("criarCobrancaPix", () => {
  const provider = new MercadoPagoPaymentProvider();

  it("manda notification_url junto da cobranca", async () => {
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "APP_USR-token-de-mentira");
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "seuconvite.orivya.com.br");
    let enviado: Record<string, unknown> = {};
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      enviado = JSON.parse(String(init.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({ id: 123, status: "pending", point_of_interaction: {} }),
        { status: 201, headers: { "content-type": "application/json" } },
      );
    });

    await provider.criarCobrancaPix({ valorCents: 1990, descricao: "Passe", referencia: "tx1" });

    expect(enviado.notification_url).toBe(
      "https://seuconvite.orivya.com.br/api/webhooks/mercadopago",
    );
    // O que ja funcionava continua igual.
    expect(enviado.transaction_amount).toBe(19.9);
    expect(enviado.external_reference).toBe("tx1");
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("em dev (dominio local) a cobranca vai SEM notification_url", async () => {
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "APP_USR-token-de-mentira");
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "localhost:3000");
    let enviado: Record<string, unknown> = {};
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      enviado = JSON.parse(String(init.body)) as Record<string, unknown>;
      return new Response(
        JSON.stringify({ id: 123, status: "pending", point_of_interaction: {} }),
        { status: 201, headers: { "content-type": "application/json" } },
      );
    });

    await provider.criarCobrancaPix({ valorCents: 100, descricao: "Presente", referencia: "c1" });

    expect("notification_url" in enviado).toBe(false);
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
});
