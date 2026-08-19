import { describe, it, expect } from "vitest";
import { ESTADO_LABEL, estadoDoConvite } from "./estadoConvite";
import { eventoPublico } from "./event";

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

describe("as duas pontas do mesmo convite", () => {
  // O painel do dono (`estadoDoConvite`) e o site do convidado (`eventoPublico`)
  // precisam contar a MESMA historia. O caso que separava as duas era o convite
  // PAUSADO cujo prazo venceu — destino de todo convite pausado: o dono lia
  // "Festa encerrada" (sem "Voltar ao ar") enquanto o visitante lia "volte mais
  // tarde". Este teste tranca a ordem nas duas libs de uma vez.
  const pausadoEVencido = { status: "PUBLISHED" as const, expiresAt: festaOntem, foraDoAr: true };

  it("pausado e vencido: encerrada para o dono, expirado para o convidado", () => {
    expect(estadoDoConvite(pausadoEVencido, agora)).toBe("encerrada");
    expect(eventoPublico(pausadoEVencido, agora)).toEqual({ ok: false, motivo: "expirado" });
  });

  it("pausado dentro do prazo: fora do ar dos dois lados (a pausa tem volta)", () => {
    const pausado = { status: "PUBLISHED" as const, expiresAt: festaAdiante, foraDoAr: true };
    expect(estadoDoConvite(pausado, agora)).toBe("fora-do-ar");
    expect(eventoPublico(pausado, agora)).toEqual({ ok: false, motivo: "fora-do-ar" });
  });
});
