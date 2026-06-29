import { describe, it, expect } from "vitest";
import { planAllows, secoesDoPlano, PLANS, type Plan } from "./plans";

describe("planAllows", () => {
  it("hoje (stub) libera qualquer feature para qualquer plano", () => {
    expect(planAllows("BASICO", "site_evento")).toBe(true);
    expect(planAllows("CLASSICO", "lista_presentes")).toBe(true);
    expect(planAllows("PREMIUM", "galeria_fotos")).toBe(true);
    // Ainda sem gating: mesmo feature inexistente retorna true (stub).
    expect(planAllows("BASICO", "feature_inexistente")).toBe(true);
  });
});

describe("PLANS", () => {
  it("define os tres planos da plataforma", () => {
    const planos: Plan[] = ["BASICO", "CLASSICO", "PREMIUM"];
    expect(Object.keys(PLANS)).toEqual(planos);
  });

  it("cada plano tem label e lista de features", () => {
    for (const plano of Object.values(PLANS)) {
      expect(typeof plano.label).toBe("string");
      expect(Array.isArray(plano.features)).toBe(true);
    }
  });
});

describe("secoesDoPlano", () => {
  it("BASICO -> sem album, sem musica, com marca da plataforma", () => {
    expect(secoesDoPlano("BASICO")).toEqual({
      album: false,
      musica: false,
      semMarcaPlataforma: false,
    });
  });

  it("CLASSICO -> album + musica, ainda com marca da plataforma", () => {
    expect(secoesDoPlano("CLASSICO")).toEqual({
      album: true,
      musica: true,
      semMarcaPlataforma: false,
    });
  });

  it("PREMIUM -> album + musica + white-label", () => {
    expect(secoesDoPlano("PREMIUM")).toEqual({
      album: true,
      musica: true,
      semMarcaPlataforma: true,
    });
  });
});
