import { describe, it, expect } from "vitest";
import { recursosDoPlano, planoPermite, PLANOS_INFO, rotuloPlano } from "./plans";

describe("recursosDoPlano — gating por plano (assinatura)", () => {
  it("BASICO -> base + RSVP (sem recados/galeria/white-label/dominio)", () => {
    expect(recursosDoPlano("BASICO")).toEqual({
      rsvp: true,
      recados: false,
      galeria: false,
      whiteLabel: false,
      dominioProprio: false,
    });
  });

  it("CLASSICO -> RSVP + recados + galeria; sem white-label/dominio", () => {
    expect(recursosDoPlano("CLASSICO")).toEqual({
      rsvp: true,
      recados: true,
      galeria: true,
      whiteLabel: false,
      dominioProprio: false,
    });
  });

  it("PREMIUM -> tudo liberado", () => {
    expect(recursosDoPlano("PREMIUM")).toEqual({
      rsvp: true,
      recados: true,
      galeria: true,
      whiteLabel: true,
      dominioProprio: true,
    });
  });
});

describe("planoPermite", () => {
  it("Básico permite RSVP mas não recados", () => {
    expect(planoPermite("BASICO", "rsvp")).toBe(true);
    expect(planoPermite("BASICO", "recados")).toBe(false);
  });
  it("white-label só no Premium", () => {
    expect(planoPermite("CLASSICO", "whiteLabel")).toBe(false);
    expect(planoPermite("PREMIUM", "whiteLabel")).toBe(true);
  });
});

describe("PLANOS_INFO / rotuloPlano", () => {
  it("tem os 3 planos com Clássico em destaque", () => {
    expect(PLANOS_INFO.map((p) => p.key)).toEqual(["BASICO", "CLASSICO", "PREMIUM"]);
    expect(PLANOS_INFO.find((p) => p.key === "CLASSICO")?.destaque).toBe(true);
  });
  it("rotuloPlano traduz", () => {
    expect(rotuloPlano("PREMIUM")).toBe("Premium");
  });
});
