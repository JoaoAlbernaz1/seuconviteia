import { describe, it, expect } from "vitest";
import { TAXA_BPS, calcularTaxaCents, calcularLiquidoCents } from "./taxa";

describe("taxa da plataforma", () => {
  it("TAXA_BPS = 500 (5%)", () => {
    expect(TAXA_BPS).toBe(500);
  });
  it("5% de R$100,00 = R$5,00", () => {
    expect(calcularTaxaCents(10_000)).toBe(500);
    expect(calcularLiquidoCents(10_000)).toBe(9_500);
  });
  it("arredonda para o centavo", () => {
    // 5% de 199 = 9.95 -> 10
    expect(calcularTaxaCents(199)).toBe(10);
  });
  it("valores invalidos -> taxa 0", () => {
    expect(calcularTaxaCents(0)).toBe(0);
    expect(calcularTaxaCents(-5)).toBe(0);
    expect(calcularTaxaCents(1.5)).toBe(0);
  });
});
