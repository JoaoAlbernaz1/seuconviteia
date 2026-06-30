import { describe, it, expect } from "vitest";
import { programacaoSugerida, presentesSugeridos } from "./sugestoes";

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

describe("presentesSugeridos", () => {
  it("casamento sugere cota da lua de mel", () => {
    expect(presentesSugeridos("CASAMENTO").some((p) => /lua de mel/i.test(p.titulo))).toBe(true);
  });

  it("itens tem titulo, descricao e valor", () => {
    const p = presentesSugeridos("QUINZE_ANOS")[0];
    expect(p).toHaveProperty("titulo");
    expect(p).toHaveProperty("descricao");
    expect(p).toHaveProperty("valor");
  });

  it("nicho desconhecido cai para Aniversário", () => {
    expect(presentesSugeridos("XPTO").length).toBeGreaterThan(0);
  });
});
