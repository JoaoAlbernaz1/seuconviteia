import { describe, expect, it } from "vitest";
import { createDefaultEventDocument, EVENT_EDITOR_SCHEMA_VERSION } from "./document";
import { EventEditorDocumentSchema } from "./schema";

describe("EventEditorDocument", () => {
  it("cria defaults completos e válidos em um único lugar", () => {
    const document = createDefaultEventDocument();

    expect(document.schemaVersion).toBe(EVENT_EDITOR_SCHEMA_VERSION);
    expect(EventEditorDocumentSchema.safeParse(document).success).toBe(true);
  });

  it("rejeita cores que não são hex de seis dígitos", () => {
    const document = createDefaultEventDocument({
      rsvp: { buttonColor: "red" },
      appearance: { customColor: "pink" },
    });

    expect(EventEditorDocumentSchema.safeParse(document).success).toBe(false);
  });
});
