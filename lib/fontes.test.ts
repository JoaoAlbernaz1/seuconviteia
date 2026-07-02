import { describe, expect, it } from "vitest";
import {
  FONTES,
  FONTE_PADRAO,
  fonteDupla,
  lerFonteKey,
  varsDaFonte,
} from "./fontes";

describe("FONTES", () => {
  it("tem as 5 duplas nomeadas do brief", () => {
    expect(Object.keys(FONTES)).toEqual([
      "classica",
      "romantica",
      "moderna",
      "minimalista",
      "festiva",
    ]);
  });

  it("classica e a tipografia exata da festa (default nao muda o site)", () => {
    const v = FONTES.classica.vars;
    expect(v["--ev-font-script"]).toContain("--font-milton");
    expect(v["--ev-font-display"]).toContain("--font-vogue");
    expect(v["--ev-font-body"]).toContain("--font-cormorant");
    expect(v["--ev-font-util"]).toContain("--font-jost");
    expect(FONTES.classica.caps).toBeUndefined();
  });

  it("duplas sem cursiva marcam caps (versal espacada na capa)", () => {
    expect(FONTES.moderna.caps).toBe(true);
    expect(FONTES.minimalista.caps).toBe(true);
    expect(FONTES.romantica.caps).toBeUndefined();
    expect(FONTES.festiva.caps).toBeUndefined();
  });
});

describe("lerFonteKey / fonteDupla / varsDaFonte", () => {
  it("ausente ou desconhecida -> padrao (classica)", () => {
    expect(lerFonteKey(undefined)).toBe(FONTE_PADRAO);
    expect(lerFonteKey({})).toBe(FONTE_PADRAO);
    expect(lerFonteKey({ fontes: "comic-sans" })).toBe(FONTE_PADRAO);
    expect(fonteDupla("nada").key).toBe(FONTE_PADRAO);
  });

  it("le a chave valida do customization", () => {
    expect(lerFonteKey({ fontes: "festiva" })).toBe("festiva");
  });

  it("varsDaFonte devolve as 4 variaveis --ev-font-*", () => {
    const vars = varsDaFonte("romantica");
    expect(Object.keys(vars).sort()).toEqual([
      "--ev-font-body",
      "--ev-font-display",
      "--ev-font-script",
      "--ev-font-util",
    ]);
    expect(vars["--ev-font-script"]).toContain("--font-dancing");
  });
});
