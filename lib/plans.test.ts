import { describe, it, expect } from "vitest";
import {
  recursosDoPlano,
  planoPermite,
  secoesDoPlano,
  PLANOS_INFO,
  RECURSOS,
  type Plan,
} from "./plans";

describe("recursosDoPlano — a matriz de gating", () => {
  it("BASICO -> nenhum recurso de valor liberado", () => {
    expect(recursosDoPlano("BASICO")).toEqual({
      rsvp: false,
      recados: false,
      galeria: false,
      whiteLabel: false,
      dominioProprio: false,
    });
  });

  it("CLASSICO -> rsvp + recados + galeria; sem white-label/dominio", () => {
    expect(recursosDoPlano("CLASSICO")).toEqual({
      rsvp: true,
      recados: true,
      galeria: true,
      whiteLabel: false,
      dominioProprio: false,
    });
  });

  it("PREMIUM -> tudo do CLASSICO + whiteLabel + dominioProprio", () => {
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
  it("rsvp/recados/galeria: so CLASSICO e PREMIUM", () => {
    for (const recurso of ["rsvp", "recados", "galeria"] as const) {
      expect(planoPermite("BASICO", recurso)).toBe(false);
      expect(planoPermite("CLASSICO", recurso)).toBe(true);
      expect(planoPermite("PREMIUM", recurso)).toBe(true);
    }
  });

  it("whiteLabel/dominioProprio: so PREMIUM", () => {
    for (const recurso of ["whiteLabel", "dominioProprio"] as const) {
      expect(planoPermite("BASICO", recurso)).toBe(false);
      expect(planoPermite("CLASSICO", recurso)).toBe(false);
      expect(planoPermite("PREMIUM", recurso)).toBe(true);
    }
  });
});

describe("PLANOS_INFO — metadados para a UI", () => {
  it("define os tres planos na ordem Basico -> Classico -> Premium", () => {
    const planos: Plan[] = ["BASICO", "CLASSICO", "PREMIUM"];
    expect(PLANOS_INFO.map((p) => p.key)).toEqual(planos);
  });

  it("cada plano tem label, descricao e lista de recursos coerente com a matriz", () => {
    for (const info of PLANOS_INFO) {
      expect(typeof info.label).toBe("string");
      expect(typeof info.descricaoCurta).toBe("string");
      const matriz = recursosDoPlano(info.key);
      const esperados = RECURSOS.filter((r) => matriz[r]);
      expect(info.recursos).toEqual(esperados);
    }
  });

  it("BASICO nao libera nada; PREMIUM libera todos os recursos", () => {
    const basico = PLANOS_INFO.find((p) => p.key === "BASICO")!;
    const premium = PLANOS_INFO.find((p) => p.key === "PREMIUM")!;
    expect(basico.recursos).toEqual([]);
    expect(premium.recursos).toEqual([...RECURSOS]);
  });
});

describe("secoesDoPlano — compat shim (derivado da matriz)", () => {
  it("BASICO -> sem album/musica, com marca da plataforma", () => {
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
