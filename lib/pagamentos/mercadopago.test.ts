import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { mapMpStatus, verificarAssinaturaMp } from "./mercadopago";

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
