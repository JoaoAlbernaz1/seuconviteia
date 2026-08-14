import { describe, expect, it } from "vitest";
import { createDefaultEventDocument } from "./document";
import { updateField, updateSection } from "./state";

describe("operações imutáveis do editor", () => {
  it("updateField preserva o documento e os objetos ancestrais anteriores", () => {
    const before = createDefaultEventDocument();
    const after = updateField(before, "content.parents.father", "Carlos");

    expect(after).not.toBe(before);
    expect(after.content).not.toBe(before.content);
    expect(after.content.parents).not.toBe(before.content.parents);
    expect(before.content.parents.father).toBe("");
    expect(after.content.parents.father).toBe("Carlos");
  });

  it("updateSection faz merge sem apagar os demais campos da seção", () => {
    const before = createDefaultEventDocument();
    const after = updateSection(before, "appearance", { bold: true });

    expect(after.appearance.bold).toBe(true);
    expect(after.appearance.font).toBe(before.appearance.font);
    expect(before.appearance.bold).toBe(false);
  });

  it("rejeita paths desconhecidos para não criar estado paralelo por engano", () => {
    const document = createDefaultEventDocument();
    expect(() => updateField(document, "rsvp.doesNotExist", true)).toThrow("Unknown editor path");
  });
});
