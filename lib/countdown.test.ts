import { describe, expect, it } from "vitest";
import { tempoRestante } from "./countdown";

describe("tempoRestante", () => {
  it("decompoe a diferenca em dias/horas/min/seg", () => {
    const agora = new Date("2026-01-01T00:00:00Z");
    const alvo = new Date("2026-01-03T04:05:06Z");
    expect(tempoRestante(alvo, agora)).toEqual({
      dias: 2,
      horas: 4,
      minutos: 5,
      segundos: 6,
      chegou: false,
    });
  });

  it("marca chegou quando o alvo ja passou ou e agora", () => {
    const agora = new Date("2026-01-02T00:00:00Z");
    expect(tempoRestante(new Date("2026-01-01T00:00:00Z"), agora).chegou).toBe(
      true,
    );
    expect(tempoRestante(agora, agora).chegou).toBe(true);
  });

  it("conta menos de um dia sem estourar para dias", () => {
    const agora = new Date("2026-01-01T00:00:00Z");
    const alvo = new Date("2026-01-01T23:59:59Z");
    const r = tempoRestante(alvo, agora);
    expect(r.dias).toBe(0);
    expect(r.horas).toBe(23);
    expect(r.segundos).toBe(59);
  });
});
