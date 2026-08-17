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
    expect(TAXA_BPS_POR_PLANO.BASICO).toBe(350);
    expect(TAXA_BPS_POR_PLANO.CLASSICO).toBe(290);
    expect(TAXA_BPS_POR_PLANO.PREMIUM).toBe(250);
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
    expect(taxaLabel("BASICO")).toBe("3,5%");
    expect(taxaLabel("CLASSICO")).toBe("2,9%");
    expect(taxaLabel("PREMIUM")).toBe("2,5%");
  });
});

describe("calculo da taxa", () => {
  it("3,5% de R$100,00 no gratuito", () => {
    expect(calcularTaxaCents(10_000, "BASICO")).toBe(350);
    expect(calcularLiquidoCents(10_000, "BASICO")).toBe(9_650);
  });

  it("2,9% de R$100,00 no Classico", () => {
    expect(calcularTaxaCents(10_000, "CLASSICO")).toBe(290);
    expect(calcularLiquidoCents(10_000, "CLASSICO")).toBe(9_710);
  });

  it("2,5% de R$100,00 no Premium", () => {
    expect(calcularTaxaCents(10_000, "PREMIUM")).toBe(250);
    expect(calcularLiquidoCents(10_000, "PREMIUM")).toBe(9_750);
  });

  it("arredonda para o centavo", () => {
    // 3,5% de 199 = 6.965 -> 7
    expect(calcularTaxaCents(199, "BASICO")).toBe(7);
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

describe("posicionamento — a taxa e o unico numero que o cliente compara", () => {
  it("o GRATUITO cobra menos que o melhor plano dos concorrentes", () => {
    // Levantamento de 17/08/2026: FestaLab e iCasei 3,69% (o iCasei chega a
    // 3,89%), Wedy 5,99% no gratuito. Se este teste quebrar, alguem subiu a
    // taxa acima do mercado — e a comparacao da landing virou mentira.
    expect(TAXA_BPS_POR_PLANO.BASICO).toBeLessThan(369);
  });

  it("a taxa so cai conforme o plano sobe", () => {
    expect(TAXA_BPS_POR_PLANO.CLASSICO).toBeLessThan(TAXA_BPS_POR_PLANO.BASICO);
    expect(TAXA_BPS_POR_PLANO.PREMIUM).toBeLessThan(TAXA_BPS_POR_PLANO.CLASSICO);
  });
});

describe("presentesParaSePagar — quanto em presentes cobre a mensalidade", () => {
  it("conta a diferenca de taxa entre os dois planos", () => {
    // R$ 59 / (3,5% - 2,9%) = R$ 9.833,34 em presentes.
    expect(presentesParaSePagar(5_900, "CLASSICO", "BASICO")).toBe(983_334);
  });

  it("sem queda de taxa ou sem mensalidade -> nao promete nada", () => {
    expect(presentesParaSePagar(5_900, "BASICO", "BASICO")).toBeNull();
    expect(presentesParaSePagar(0, "CLASSICO", "BASICO")).toBeNull();
  });
});
