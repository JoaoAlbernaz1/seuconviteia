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
