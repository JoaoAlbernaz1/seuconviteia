import { describe, it, expect } from "vitest";
import { ESTADO_LABEL, estadoDoConvite } from "./estadoConvite";

const agora = new Date("2026-08-18T12:00:00Z");
const festaAdiante = new Date("2030-01-01T00:00:00Z");
const festaOntem = new Date("2026-08-17T12:00:00Z");

describe("estadoDoConvite", () => {
  it("publicado, no prazo e sem pausa esta no ar", () => {
    expect(
      estadoDoConvite({ status: "PUBLISHED", expiresAt: festaAdiante, foraDoAr: false }, agora),
    ).toBe("no-ar");
  });

  it("pausado pelo dono esta fora do ar (e nao 'rascunho')", () => {
    expect(
      estadoDoConvite({ status: "PUBLISHED", expiresAt: festaAdiante, foraDoAr: true }, agora),
    ).toBe("fora-do-ar");
  });

  it("rascunho antes de tudo — nem data vencida o transforma em outra coisa", () => {
    expect(
      estadoDoConvite({ status: "DRAFT", expiresAt: festaOntem, foraDoAr: false }, agora),
    ).toBe("rascunho");
  });

  it("data vencida = festa encerrada", () => {
    expect(
      estadoDoConvite({ status: "PUBLISHED", expiresAt: festaOntem, foraDoAr: false }, agora),
    ).toBe("encerrada");
  });

  it("status EXPIRED tambem encerra, mesmo com data adiante", () => {
    expect(
      estadoDoConvite({ status: "EXPIRED", expiresAt: festaAdiante, foraDoAr: false }, agora),
    ).toBe("encerrada");
  });

  it("encerrada VENCE fora do ar: o dono religa a pausa, nao a festa", () => {
    expect(
      estadoDoConvite({ status: "PUBLISHED", expiresAt: festaOntem, foraDoAr: true }, agora),
    ).toBe("encerrada");
  });
});

describe("ESTADO_LABEL", () => {
  it("a palavra do estado no ar e o oposto exato da palavra do pausado", () => {
    expect(ESTADO_LABEL["no-ar"]).toBe("No ar");
    expect(ESTADO_LABEL["fora-do-ar"]).toBe("Fora do ar");
  });
});
