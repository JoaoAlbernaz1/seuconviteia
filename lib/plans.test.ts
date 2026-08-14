import { describe, it, expect } from "vitest";
import { recursosDoPlano, planoPermite, PLANOS_INFO, rotuloPlano, limiteEventos } from "./plans";

describe("recursosDoPlano — gating por plano (assinatura)", () => {
  it("BASICO -> so a base (sem RSVP/recados/galeria/white-label/dominio)", () => {
    expect(recursosDoPlano("BASICO")).toEqual({
      rsvp: false,
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
  it("Básico não permite RSVP nem recados (só a base do convite)", () => {
    expect(planoPermite("BASICO", "rsvp")).toBe(false);
    expect(planoPermite("BASICO", "recados")).toBe(false);
  });
  it("confirmação de presença começa no Clássico", () => {
    expect(planoPermite("CLASSICO", "rsvp")).toBe(true);
    expect(planoPermite("PREMIUM", "rsvp")).toBe(true);
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

describe("escada de planos — o desenho comercial (12/08/2026)", () => {
  it("Basico limita a 1 convite; os pagos sao ilimitados", () => {
    expect(limiteEventos("BASICO")).toBe(1);
    expect(limiteEventos("CLASSICO")).toBeNull();
    expect(limiteEventos("PREMIUM")).toBeNull();
  });

  it("o plano do MEIO e o destacado (e so ele)", () => {
    const destacados = PLANOS_INFO.filter((p) => p.destaque);
    expect(destacados).toHaveLength(1);
    expect(destacados[0].key).toBe("CLASSICO");
    expect(PLANOS_INFO[1].key).toBe("CLASSICO");
  });

  it("todo plano diz a sua taxa no rodape do card", () => {
    for (const p of PLANOS_INFO) {
      expect(p.taxaLinha).toMatch(/^Taxa de \d+,\d% sobre os presentes$/);
    }
  });

  it("os cards tem o MESMO numero de itens (comparam melhor)", () => {
    const tamanhos = PLANOS_INFO.map((p) => p.inclui.length);
    expect(new Set(tamanhos).size).toBe(1);
  });

  it("preco sobe junto com o plano", () => {
    const cents = PLANOS_INFO.map((p) => p.mensalidadeCents);
    for (let i = 1; i < cents.length; i++) expect(cents[i]).toBeGreaterThan(cents[i - 1]);
  });
});
