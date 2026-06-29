import { describe, it, expect } from "vitest";
import { calcularExpiracao } from "./dates";

const TRINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000;

describe("calcularExpiracao", () => {
  it("adiciona 30 dias a data do evento", () => {
    const eventDate = new Date("2026-01-01T12:00:00Z");
    const exp = calcularExpiracao(eventDate);
    expect(exp.getTime() - eventDate.getTime()).toBe(TRINTA_DIAS_MS);
  });

  it("nao muta o Date de entrada", () => {
    const eventDate = new Date("2026-01-01T12:00:00Z");
    const antes = eventDate.getTime();
    const exp = calcularExpiracao(eventDate);
    expect(eventDate.getTime()).toBe(antes);
    expect(exp).not.toBe(eventDate);
  });
});
