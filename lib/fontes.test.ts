import { describe, expect, it } from "vitest";
import {
  FONTES,
  FONTE_PADRAO,
  fonteDupla,
  fonteTemNegritoNoNome,
  lerFonteKey,
  varsDaFonte,
} from "./fontes";

describe("fonteTemNegritoNoNome", () => {
  it("manuscritas de peso unico NAO tem negrito no nome da capa", () => {
    // Great Vibes, Pacifico, Allura, Parisienne, Sacramento e Marcellus so
    // existem em 400 no Google (ver app/evt-fonts.ts) — nada a engrossar.
    expect(fonteTemNegritoNoNome("delicada")).toBe(false);
    expect(fonteTemNegritoNoNome("festiva")).toBe(false);
    expect(fonteTemNegritoNoNome("glamour")).toBe(false);
    expect(fonteTemNegritoNoNome("moderna")).toBe(false);
  });

  it("duplas cuja script carrega peso forte TEM negrito no nome", () => {
    // Dancing Script (500/600), Cinzel (600), Cinzel Decorative (700),
    // Tangerine (700), Jost e Josefin (600).
    expect(fonteTemNegritoNoNome("romantica")).toBe(true);
    expect(fonteTemNegritoNoNome("imperial")).toBe(true);
    expect(fonteTemNegritoNoNome("realeza")).toBe(true);
    expect(fonteTemNegritoNoNome("fina")).toBe(true);
    expect(fonteTemNegritoNoNome("urbana")).toBe(true);
  });

  it("chave desconhecida cai no default (classica)", () => {
    expect(fonteTemNegritoNoNome("nao-existe")).toBe(fonteTemNegritoNoNome("classica"));
    expect(fonteTemNegritoNoNome(null)).toBe(fonteTemNegritoNoNome("classica"));
  });

  it("combinacao custom (Premium) segue a cabeca escolhida", () => {
    expect(fonteTemNegritoNoNome(null, { head: "romantica", corpo: "cormorant" })).toBe(true);
    expect(fonteTemNegritoNoNome(null, { head: "delicada", corpo: "cormorant" })).toBe(false);
  });

  it("toda dupla declara a resposta (nenhuma fica no escuro)", () => {
    for (const key of Object.keys(FONTES)) {
      expect(typeof fonteTemNegritoNoNome(key)).toBe("boolean");
    }
  });
});

describe("FONTES", () => {
  it("tem o catalogo completo de duplas (15), comecando pelas do brief", () => {
    const keys = Object.keys(FONTES);
    expect(keys.length).toBe(15);
    // As 5 originais do brief seguem presentes e na frente do catalogo.
    expect(keys.slice(0, 5)).toEqual([
      "classica",
      "romantica",
      "moderna",
      "minimalista",
      "festiva",
    ]);
    // Ampliacao de 2026-08-03 (fontes Google, nomes reais no seletor).
    for (const k of ["glamour", "vintage", "suave", "realeza", "editorial", "fina", "urbana"]) {
      expect(keys).toContain(k);
    }
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

  it("varsDaFonte devolve as 4 variaveis --ev-font-* + os fatores de tamanho", () => {
    const vars = varsDaFonte("romantica");
    expect(Object.keys(vars).sort()).toEqual([
      "--ev-capa-fator",
      "--ev-font-body",
      "--ev-font-display",
      "--ev-font-script",
      "--ev-font-util",
      "--ev-fonte-fator",
    ]);
    expect(vars["--ev-font-script"]).toContain("--font-dancing");
    // Fatores calibrados por fonte (capa e demais textos separados).
    expect(vars["--ev-capa-fator"]).toBe("0.88");
    expect(vars["--ev-fonte-fator"]).toBe("0.8");
    // Milton (classica) fica 1/1 — fidelidade a festa original.
    const cl = varsDaFonte("classica");
    expect(cl["--ev-capa-fator"]).toBe("1");
    expect(cl["--ev-fonte-fator"]).toBe("1");
  });
});
