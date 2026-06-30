import { describe, expect, it } from "vitest";
import { textosDoNicho } from "./textos";

describe("textosDoNicho", () => {
  it("dá textos próprios por nicho (casamento ≠ 15 anos)", () => {
    const casamento = textosDoNicho("CASAMENTO");
    const quinze = textosDoNicho("QUINZE_ANOS");
    expect(casamento.conviteTitulo).toBe("Vamos nos casar");
    expect(casamento.conviteTeaser).not.toContain("quinze");
    expect(casamento.assinaturaPrefixo).toBe("Com amor,");
    expect(quinze.conviteTeaser).toContain("quinze");
  });

  it("não vaza texto de '15 anos' em outros nichos", () => {
    for (const nicho of ["CASAMENTO", "BODAS", "SESSENTA_ANOS", "ANIVERSARIO"] as const) {
      const t = textosDoNicho(nicho);
      const tudo = [t.conviteTeaser, t.mensagemPadrao, t.fecho].join(" ");
      expect(tudo).not.toMatch(/quinze|15 anos/i);
    }
  });

  it("cai para Aniversário quando o nicho é desconhecido", () => {
    expect(textosDoNicho("ALGO_NOVO")).toEqual(textosDoNicho("ANIVERSARIO"));
  });

  it("todos os nichos têm os campos preenchidos", () => {
    for (const nicho of [
      "CASAMENTO",
      "QUINZE_ANOS",
      "SESSENTA_ANOS",
      "BODAS",
      "ANIVERSARIO",
    ] as const) {
      const t = textosDoNicho(nicho);
      for (const v of Object.values(t)) expect(v.length).toBeGreaterThan(3);
    }
  });
});
