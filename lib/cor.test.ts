import { describe, expect, it } from "vitest";
import { coresParticulas, hexParaRgb } from "./cor";

describe("hexParaRgb", () => {
  it("converte hex de 6 digitos", () => {
    expect(hexParaRgb("#6D28D9")).toEqual([109, 40, 217]);
    expect(hexParaRgb("8C4A63")).toEqual([140, 74, 99]);
  });

  it("expande hex de 3 digitos", () => {
    expect(hexParaRgb("#fff")).toEqual([255, 255, 255]);
    expect(hexParaRgb("#0a0")).toEqual([0, 170, 0]);
  });

  it("cai para violeta quando invalido", () => {
    expect(hexParaRgb("nao-e-cor")).toEqual([109, 40, 217]);
    expect(hexParaRgb("")).toEqual([109, 40, 217]);
  });
});

describe("coresParticulas", () => {
  it("retorna 3 triplets r,g,b (neutro + 2 tons clareados do accent)", () => {
    const cores = coresParticulas("#6D28D9");
    expect(cores).toHaveLength(3);
    for (const c of cores) expect(c).toMatch(/^\d{1,3},\d{1,3},\d{1,3}$/);
    // o accent clareado deve ser mais claro que o accent puro
    expect(cores[1]).not.toBe("109,40,217");
  });

  it("e estavel para o mesmo accent", () => {
    expect(coresParticulas("#DB2777")).toEqual(coresParticulas("#DB2777"));
  });
});
