import { describe, it, expect, afterEach, vi } from "vitest";
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

// A DECISAO do seam, e nao so o dublê: producao sem credencial NAO pode cair no
// Pix simulado. No simulado quem confirma o presente e um botao na tela do
// convidado (`confirmarPresente`, liberado justamente quando o provedor e
// "fake") — num convite publicado de verdade isso e presente confirmado com zero
// real. E o passe de R$ 19,90 gera um QR que nunca confirma, porque quem abre a
// janela e o webhook e o webhook exige provedor real. Melhor recusar alto.
describe("getPaymentProvider", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("com token, e o Mercado Pago", async () => {
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "APP_USR-token-de-mentira");
    const { getPaymentProvider } = await import("./index");
    expect(getPaymentProvider().nome).toBe("mercadopago");
  });

  it("sem token fora da producao da Vercel, e o simulado (dev)", async () => {
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "");
    vi.stubEnv("VERCEL_ENV", "");
    const { getPaymentProvider } = await import("./index");
    expect(getPaymentProvider().nome).toBe("fake");
  });

  it("sem token NA producao da Vercel, recusa em vez de simular", async () => {
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "");
    vi.stubEnv("VERCEL_ENV", "production");
    const { getPaymentProvider } = await import("./index");
    const p = getPaymentProvider();
    expect(p.nome).not.toBe("fake");
    expect(p.nome).toBe("indisponivel");
    // Falha ALTA: quem chama (presentear / passe de edicao) ja trata o throw
    // devolvendo "Nao foi possivel gerar o Pix agora" e marcando FAILED.
    await expect(
      p.criarCobrancaPix({ valorCents: 1990, descricao: "x", referencia: "y" }),
    ).rejects.toThrow(/MERCADO_PAGO_ACCESS_TOKEN/);
  });
});
