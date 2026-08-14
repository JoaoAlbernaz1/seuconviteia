import { describe, expect, it } from "vitest";
import { moverItem } from "./presentesOrdem";

describe("moverItem", () => {
  it("sobe um item uma posicao", () => {
    expect(moverItem(["a", "b", "c"], 1, 0)).toEqual(["b", "a", "c"]);
  });

  it("desce um item uma posicao", () => {
    expect(moverItem(["a", "b", "c"], 1, 2)).toEqual(["a", "c", "b"]);
  });

  it("indice fora da lista devolve a lista intacta", () => {
    expect(moverItem(["a", "b"], 0, 5)).toEqual(["a", "b"]);
    expect(moverItem(["a", "b"], -1, 0)).toEqual(["a", "b"]);
    expect(moverItem(["a", "b"], 9, 0)).toEqual(["a", "b"]);
  });

  it("mesma posicao nao muda nada", () => {
    expect(moverItem(["a", "b", "c"], 1, 1)).toEqual(["a", "b", "c"]);
  });

  it("nao perde nem duplica itens", () => {
    const fora = moverItem(["a", "b", "c", "d"], 3, 1);
    expect([...fora].sort()).toEqual(["a", "b", "c", "d"]);
    expect(fora).toEqual(["a", "d", "b", "c"]);
  });

  it("nao muta a lista original", () => {
    const orig = ["a", "b"];
    moverItem(orig, 0, 1);
    expect(orig).toEqual(["a", "b"]);
  });

  it("lista vazia nao quebra", () => {
    expect(moverItem([], 0, 1)).toEqual([]);
  });

  it("funciona com objetos (as linhas de presente do editor)", () => {
    const lista = [{ n: "Bolo" }, { n: "DJ" }];
    expect(moverItem(lista, 1, 0)).toEqual([{ n: "DJ" }, { n: "Bolo" }]);
  });
});
