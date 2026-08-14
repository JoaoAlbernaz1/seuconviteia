import { describe, it, expect } from "vitest";
import {
  TAXA_BPS_POR_PLANO,
  calcularLiquidoCents,
  calcularTaxaCents,
  presentesParaSePagar,
  taxaBpsDoPlano,
  taxaLabel,
} from "./taxa";
import { PLAN_ORDER } from "../plans";

describe("taxa por plano", () => {
  it("as taxas decididas (12/08/2026)", () => {
    expect(TAXA_BPS_POR_PLANO.BASICO).toBe(590);
    expect(TAXA_BPS_POR_PLANO.CLASSICO).toBe(340);
    expect(TAXA_BPS_POR_PLANO.PREMIUM).toBe(260);
  });

  it("a taxa SEMPRE cai conforme sobe o plano", () => {
    const bps = PLAN_ORDER.map((p) => taxaBpsDoPlano(p));
    for (let i = 1; i < bps.length; i++) {
      expect(bps[i]).toBeLessThan(bps[i - 1]);
    }
  });

  it("nenhuma taxa fica abaixo do custo do Pix (~0,99%) + margem", () => {
    for (const p of PLAN_ORDER) {
      expect(taxaBpsDoPlano(p)).toBeGreaterThanOrEqual(150);
    }
  });

  it("a maior queda e do Basico para o Classico (puxa pro plano do meio)", () => {
    const quedaMeio = TAXA_BPS_POR_PLANO.BASICO - TAXA_BPS_POR_PLANO.CLASSICO;
    const quedaTopo = TAXA_BPS_POR_PLANO.CLASSICO - TAXA_BPS_POR_PLANO.PREMIUM;
    expect(quedaMeio).toBeGreaterThan(quedaTopo);
  });

  it("plano ausente ou desconhecido cai no Basico (nunca cobra de menos)", () => {
    expect(taxaBpsDoPlano(null)).toBe(TAXA_BPS_POR_PLANO.BASICO);
    expect(taxaBpsDoPlano(undefined)).toBe(TAXA_BPS_POR_PLANO.BASICO);
  });

  it("rotulo em pt-BR", () => {
    expect(taxaLabel("BASICO")).toBe("5,9%");
    expect(taxaLabel("CLASSICO")).toBe("3,4%");
    expect(taxaLabel("PREMIUM")).toBe("2,6%");
  });
});

describe("calculo da taxa", () => {
  it("5,9% de R$100,00 no Basico", () => {
    expect(calcularTaxaCents(10_000, "BASICO")).toBe(590);
    expect(calcularLiquidoCents(10_000, "BASICO")).toBe(9_410);
  });

  it("3,4% de R$100,00 no Classico", () => {
    expect(calcularTaxaCents(10_000, "CLASSICO")).toBe(340);
    expect(calcularLiquidoCents(10_000, "CLASSICO")).toBe(9_660);
  });

  it("2,6% de R$100,00 no Premium", () => {
    expect(calcularTaxaCents(10_000, "PREMIUM")).toBe(260);
    expect(calcularLiquidoCents(10_000, "PREMIUM")).toBe(9_740);
  });

  it("arredonda para o centavo", () => {
    // 5,9% de 199 = 11.741 -> 12
    expect(calcularTaxaCents(199, "BASICO")).toBe(12);
  });

  it("valores invalidos -> taxa 0", () => {
    expect(calcularTaxaCents(0, "BASICO")).toBe(0);
    expect(calcularTaxaCents(-5, "BASICO")).toBe(0);
    expect(calcularTaxaCents(1.5, "BASICO")).toBe(0);
  });

  it("liquido + taxa sempre fecha com o bruto (nao some centavo)", () => {
    for (const p of PLAN_ORDER) {
      for (const bruto of [1, 99, 199, 1_000, 12_345, 99_999, 1_000_000]) {
        expect(calcularLiquidoCents(bruto, p) + calcularTaxaCents(bruto, p)).toBe(bruto);
      }
    }
  });
});

describe("presentesParaSePagar — o argumento do card de plano", () => {
  it("Classico (R$59) se paga com R$2.360 em presentes", () => {
    expect(presentesParaSePagar(5_900, "CLASSICO", "BASICO")).toBe(236_000);
  });

  it("Premium exige MUITO mais volume que o Classico (protege o plano do meio)", () => {
    const meio = presentesParaSePagar(5_900, "CLASSICO", "BASICO")!;
    const topo = presentesParaSePagar(9_000, "PREMIUM", "CLASSICO")!;
    expect(topo).toBeGreaterThan(meio * 3);
  });

  it("sem queda de taxa ou sem mensalidade -> nao promete nada", () => {
    expect(presentesParaSePagar(5_900, "BASICO", "BASICO")).toBeNull();
    expect(presentesParaSePagar(0, "CLASSICO", "BASICO")).toBeNull();
  });
});
