import { describe, it, expect } from "vitest";
import { programacaoSugerida } from "./sugestoes";

describe("programacaoSugerida", () => {
  it("traz a programacao do nicho (casamento tem cerimônia)", () => {
    const p = programacaoSugerida("CASAMENTO");
    expect(p.length).toBeGreaterThan(0);
    expect(p.some((i) => /cerimônia/i.test(i.titulo))).toBe(true);
    expect(p[0]).toHaveProperty("hora");
    expect(p[0]).toHaveProperty("titulo");
  });

  it("15 anos tem valsa", () => {
    expect(programacaoSugerida("QUINZE_ANOS").some((i) => /valsa/i.test(i.titulo))).toBe(true);
  });

  it("nicho desconhecido cai para Aniversário (nao quebra)", () => {
    expect(programacaoSugerida("XPTO").length).toBeGreaterThan(0);
  });

  it("retorna copias novas (nao vaza a referencia interna)", () => {
    const a = programacaoSugerida("CASAMENTO");
    a[0].titulo = "ALTERADO";
    expect(programacaoSugerida("CASAMENTO")[0].titulo).not.toBe("ALTERADO");
  });
});
