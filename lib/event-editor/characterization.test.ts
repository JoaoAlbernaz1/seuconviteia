import { describe, expect, it } from "vitest";
import { createDefaultEventDocument } from "./document";
import { applyDocumentPatch } from "./persistence";

describe("semântica de persistência do documento", () => {
  it("undefined significa campo não enviado e não apaga configuração existente", () => {
    const current = createDefaultEventDocument({
      rsvp: {
        enabled: true,
        companionsEnabled: true,
        maxCompanions: 4,
        requestCompanionNames: true,
      },
    });

    const saved = applyDocumentPatch(current, { rsvp: undefined });

    expect(saved.rsvp).toEqual(current.rsvp);
  });

  it("enabled=false desativa a seção sem destruir seus dados", () => {
    const current = createDefaultEventDocument({
      content: {
        parents: { enabled: true, father: "Marcos", mother: "Maria" },
      },
    });

    const saved = applyDocumentPatch(current, {
      content: { parents: { enabled: false } },
    });

    expect(saved.content.parents).toEqual({
      enabled: false,
      father: "Marcos",
      mother: "Maria",
    });
  });
});
