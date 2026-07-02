import { describe, it, expect } from "vitest";
import { montarRemetente, MARCA } from "./remetente";

describe("montarRemetente — white-label do remetente (Premium)", () => {
  it("Premium com nome -> nome do profissional/estudio", () => {
    expect(montarRemetente("PREMIUM", "Estudio Aurora")).toBe("Estudio Aurora");
  });

  it("Basico -> marca (sem white-label)", () => {
    expect(montarRemetente("BASICO", "Estudio Aurora")).toBe(MARCA);
  });

  it("Classico -> marca (white-label so libera no Premium)", () => {
    expect(montarRemetente("CLASSICO", "Estudio Aurora")).toBe(MARCA);
  });

  it("Premium sem nome utilizavel -> marca (defensivo)", () => {
    expect(montarRemetente("PREMIUM", "   ")).toBe(MARCA);
    expect(montarRemetente("PREMIUM", null)).toBe(MARCA);
    expect(montarRemetente("PREMIUM")).toBe(MARCA);
  });
});
