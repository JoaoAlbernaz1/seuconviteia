import { describe, expect, it } from "vitest";
import { deveResalvar } from "./autosave";

describe("deveResalvar — o autosave nao pode virar laco infinito", () => {
  it("save FALHOU -> nao re-dispara (era o laco de 86 mil POSTs)", () => {
    expect(deveResalvar(false, "conteudo novo", "conteudo velho")).toBe(false);
  });

  it("save falhou e nada mudou -> tambem nao re-dispara", () => {
    expect(deveResalvar(false, "igual", "igual")).toBe(false);
  });

  it("save OK e o cliente digitou durante o save -> salva de novo", () => {
    expect(deveResalvar(true, "digitou mais", "o que foi salvo")).toBe(true);
  });

  it("save OK e nada mudou -> fica quieto", () => {
    expect(deveResalvar(true, "igual", "igual")).toBe(false);
  });

  it("primeiro save (nunca salvou nada antes) -> so re-dispara se deu certo", () => {
    expect(deveResalvar(true, "algo", null)).toBe(true);
    expect(deveResalvar(false, "algo", null)).toBe(false);
  });
});
