import { describe, expect, it } from "vitest";
import { createDefaultEventDocument, EVENT_EDITOR_SCHEMA_VERSION, withFreshGiftIds } from "./document";
import { EventEditorDocumentSchema } from "./schema";

describe("EventEditorDocument", () => {
  it("gera ids novos para presentes somente ao iniciar uma criação", () => {
    const original = createDefaultEventDocument({
      gifts: { items: [
        { id: "gift-1", title: "A", description: "", value: "10", imageUrl: "", pricingMode: "FIXO" },
        { id: "gift-2", title: "B", description: "", value: "20", imageUrl: "", pricingMode: "FIXO" },
      ] },
    });
    let sequence = 0;
    const fresh = withFreshGiftIds(original, () => `new-${++sequence}`);
    expect(fresh.gifts.items.map((gift) => gift.id)).toEqual(["new-1", "new-2"]);
    expect(original.gifts.items.map((gift) => gift.id)).toEqual(["gift-1", "gift-2"]);
  });

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
