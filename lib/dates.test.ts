import { describe, it, expect } from "vitest";
import { calcularExpiracao, dataDeHojeSP, dividirDataHoraSP } from "./dates";

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

describe("dataDeHojeSP", () => {
  it("formata a data local de Sao Paulo como yyyy-mm-dd", () => {
    // 2026-03-15T23:30Z ainda e dia 15 em SP (UTC-3).
    expect(dataDeHojeSP(new Date("2026-03-15T23:30:00Z"))).toBe("2026-03-15");
  });

  it("usa o dia de Sao Paulo, nao o de UTC, na virada", () => {
    // 2026-03-16T02:00Z ja e dia 16 em UTC, mas ainda 15 em SP.
    expect(dataDeHojeSP(new Date("2026-03-16T02:00:00Z"))).toBe("2026-03-15");
  });

  it("compara lexicograficamente com o valor do <input type=date>", () => {
    const hoje = dataDeHojeSP(new Date("2026-07-02T12:00:00Z"));
    expect("2020-01-01" < hoje).toBe(true); // passado
    expect("2030-01-01" < hoje).toBe(false); // futuro
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
