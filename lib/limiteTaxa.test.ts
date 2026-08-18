import { beforeEach, describe, expect, it } from "vitest";
import { consumir, limparLimites } from "./limiteTaxa";

const HORA = 60 * 60 * 1000;

describe("consumir", () => {
  beforeEach(() => limparLimites());

  it("deixa passar até o limite e depois barra", () => {
    const t = 1_000_000;
    expect(consumir("conta-1", 3, HORA, t)).toEqual({ ok: true, restantes: 2 });
    expect(consumir("conta-1", 3, HORA, t + 10)).toEqual({ ok: true, restantes: 1 });
    expect(consumir("conta-1", 3, HORA, t + 20)).toEqual({ ok: true, restantes: 0 });
    const barrado = consumir("conta-1", 3, HORA, t + 30);
    expect(barrado.ok).toBe(false);
  });

  it("uma conta não gasta o limite da outra", () => {
    const t = 1_000_000;
    consumir("conta-1", 1, HORA, t);
    expect(consumir("conta-2", 1, HORA, t).ok).toBe(true);
  });

  it("a janela desliza: passada a hora, libera de novo", () => {
    const t = 1_000_000;
    consumir("conta-1", 1, HORA, t);
    expect(consumir("conta-1", 1, HORA, t + HORA - 1).ok).toBe(false);
    expect(consumir("conta-1", 1, HORA, t + HORA + 1).ok).toBe(true);
  });

  it("diz quanto falta esperar, sempre pelo menos 1 segundo", () => {
    const t = 1_000_000;
    consumir("conta-1", 1, HORA, t);
    const r = consumir("conta-1", 1, HORA, t + HORA - 30_000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.esperarSegundos).toBe(30);

    const rr = consumir("conta-1", 1, HORA, t + HORA - 100);
    if (!rr.ok) expect(rr.esperarSegundos).toBe(1);
  });

  it("chamada barrada NÃO conta para a janela (não vira castigo eterno)", () => {
    const t = 1_000_000;
    consumir("conta-1", 1, HORA, t);
    consumir("conta-1", 1, HORA, t + 1000); // barrada
    consumir("conta-1", 1, HORA, t + 2000); // barrada
    // A única que conta é a primeira: passada a hora DELA, libera.
    expect(consumir("conta-1", 1, HORA, t + HORA + 1).ok).toBe(true);
  });
});
