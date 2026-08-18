import { describe, expect, it } from "vitest";
import { lerValoresSugeridos } from "./valoresSugeridos";

describe("lerValoresSugeridos", () => {
  it("le o formato que o editor sugere por padrao", () => {
    expect(lerValoresSugeridos("R$ 50 · R$ 100 · R$ 200")).toEqual([5000, 10000, 20000]);
  });

  it("le a frase como ela chega na descricao do item", () => {
    expect(lerValoresSugeridos("Sugestões: R$ 50 · R$ 100")).toEqual([5000, 10000]);
  });

  it("aceita virgula como decimal e ponto como milhar (pt-BR)", () => {
    expect(lerValoresSugeridos("R$ 1.000,50")).toEqual([100050]);
    expect(lerValoresSugeridos("1.000")).toEqual([100000]);
    expect(lerValoresSugeridos("29,90")).toEqual([2990]);
  });

  it("aceita separadores variados (virgula, barra, 'e')", () => {
    expect(lerValoresSugeridos("50, 100 e 150")).toEqual([5000, 10000, 15000]);
    expect(lerValoresSugeridos("30/60/90")).toEqual([3000, 6000, 9000]);
  });

  it("ordena, tira repetidos e limita a quatro atalhos", () => {
    expect(lerValoresSugeridos("200 50 100 50 500 1000")).toEqual([5000, 10000, 20000, 50000]);
  });

  it("descarta zero, negativo e o que passa do teto", () => {
    expect(lerValoresSugeridos("0")).toEqual([]);
    expect(lerValoresSugeridos("-50")).toEqual([5000]); // o sinal nao e valor, o 50 e
    expect(lerValoresSugeridos("100000,01")).toEqual([]);
  });

  it("texto sem numero, vazio ou ausente devolve lista vazia", () => {
    expect(lerValoresSugeridos("o que voce quiser")).toEqual([]);
    expect(lerValoresSugeridos("")).toEqual([]);
    expect(lerValoresSugeridos(null)).toEqual([]);
    expect(lerValoresSugeridos(undefined)).toEqual([]);
  });
});
