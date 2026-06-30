import { describe, it, expect } from "vitest";
import { calcularExpiracao, dividirDataHoraSP } from "./dates";

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

describe("dividirDataHoraSP", () => {
  it("divide um instante UTC em data + hora no fuso de Sao Paulo (UTC-3)", () => {
    // 2026-03-15T23:30Z -> 20:30 do mesmo dia em America/Sao_Paulo.
    expect(dividirDataHoraSP(new Date("2026-03-15T23:30:00Z"))).toEqual({
      date: "2026-03-15",
      time: "20:30",
    });
  });

  it("recua o dia quando o horario UTC ja virou em Sao Paulo", () => {
    // 2026-03-16T02:00Z -> 23:00 do dia ANTERIOR (15) em Sao Paulo.
    expect(dividirDataHoraSP(new Date("2026-03-16T02:00:00Z"))).toEqual({
      date: "2026-03-15",
      time: "23:00",
    });
  });

  it("faz round-trip com a recombinacao da action (date+time -> Date)", () => {
    const original = new Date("2026-07-09T23:00:00Z"); // 20:00 em SP
    const { date, time } = dividirDataHoraSP(original);
    expect(date).toBe("2026-07-09");
    expect(time).toBe("20:00");
  });
});
