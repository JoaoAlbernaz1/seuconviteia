import { describe, expect, it } from "vitest";
import {
  lerToggles,
  recursosDoSite,
  togglesParaCustomization,
  RECURSOS_SITE,
  type TogglesSite,
} from "./recursos";

const LIGADOS: TogglesSite = {
  rsvp: true,
  presentes: true,
  contador: true,
  programacao: true,
  recados: true,
  galeria: true,
};

describe("lerToggles", () => {
  it("ausente/malformado -> tudo ligado (eventos existentes nao mudam)", () => {
    expect(lerToggles(undefined)).toEqual(LIGADOS);
    expect(lerToggles(null)).toEqual(LIGADOS);
    expect(lerToggles({})).toEqual(LIGADOS);
    expect(lerToggles({ recursos: "zoado" })).toEqual(LIGADOS);
    expect(lerToggles({ recursos: { rsvp: "false" } })).toEqual(LIGADOS);
  });

  it("le so os desligados explicitos (false)", () => {
    expect(lerToggles({ recursos: { contador: false, galeria: false } })).toEqual({
      ...LIGADOS,
      contador: false,
      galeria: false,
    });
  });
});

describe("recursosDoSite (ativo = plano permite ∩ toggle)", () => {
  it("BASICO (gratuito): o convite vem COMPLETO, nada fica OFF por plano", () => {
    const r = recursosDoSite("BASICO", {});
    // 17/08/2026: o gratuito entrega RSVP, recados e album — como o mercado.
    expect(r.rsvp).toBe(true);
    expect(r.presentes).toBe(true);
    expect(r.contador).toBe(true);
    expect(r.programacao).toBe(true);
    expect(r.recados).toBe(true);
    expect(r.galeria).toBe(true);
  });

  it("BASICO com toggle desligado: o toggle continua vencendo", () => {
    const r = recursosDoSite("BASICO", { recursos: { rsvp: false, galeria: false } });
    expect(r.rsvp).toBe(false);
    expect(r.galeria).toBe(false);
    expect(r.recados).toBe(true);
  });

  it("CLASSICO com toggle desligado: o toggle vence", () => {
    const r = recursosDoSite("CLASSICO", { recursos: { recados: false, rsvp: false } });
    expect(r.recados).toBe(false);
    expect(r.rsvp).toBe(false);
    expect(r.galeria).toBe(true);
  });

  it("PREMIUM sem toggles: tudo ativo", () => {
    expect(recursosDoSite("PREMIUM", {})).toEqual(LIGADOS);
  });
});

describe("togglesParaCustomization", () => {
  it("todos ligados -> undefined (JSON limpo)", () => {
    expect(togglesParaCustomization(LIGADOS)).toBeUndefined();
  });

  it("grava so os desligados, como false", () => {
    expect(togglesParaCustomization({ ...LIGADOS, presentes: false })).toEqual({
      presentes: false,
    });
  });
});

describe("RECURSOS_SITE", () => {
  it("tem os 6 cards do editor, na ordem do mockup", () => {
    expect(RECURSOS_SITE.map((d) => d.key)).toEqual([
      "rsvp",
      "presentes",
      "contador",
      "programacao",
      "recados",
      "galeria",
    ]);
  });

  it("recados/galeria gateiam por plano; a base nao", () => {
    const porKey = Object.fromEntries(RECURSOS_SITE.map((d) => [d.key, d.gate]));
    expect(porKey.recados).toBe("recados");
    expect(porKey.galeria).toBe("galeria");
    expect(porKey.presentes).toBeNull();
    expect(porKey.contador).toBeNull();
    expect(porKey.programacao).toBeNull();
  });
});
