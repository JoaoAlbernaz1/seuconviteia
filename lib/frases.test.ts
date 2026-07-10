import { describe, expect, it } from "vitest";
import { frasePresencas, fraseResumo } from "./frases";

describe("frasePresencas", () => {
  it("singular: substantivo E verbo concordam", () => {
    expect(frasePresencas(1)).toBe("1 convidado confirmou");
  });
  it("plural", () => {
    expect(frasePresencas(3)).toBe("3 convidados confirmaram");
  });
  it("zero tem frase propria", () => {
    expect(frasePresencas(0)).toBe("Nenhum convidado confirmou ainda");
  });
});

describe("fraseResumo", () => {
  it("tudo no singular", () => {
    expect(fraseResumo(1, 1, 1)).toBe(
      "1 site no ar · 1 presença confirmada · 1 recado de carinho",
    );
  });
  it("tudo no plural", () => {
    expect(fraseResumo(2, 3, 4)).toBe(
      "2 sites no ar · 3 presenças confirmadas · 4 recados de carinho",
    );
  });
  it("mistura: cada posicao concorda sozinha", () => {
    expect(fraseResumo(1, 0, 2)).toBe(
      "1 site no ar · 0 presenças confirmadas · 2 recados de carinho",
    );
  });
});
