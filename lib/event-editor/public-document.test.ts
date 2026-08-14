import { describe, expect, it } from "vitest";
import { createDefaultEventDocument } from "./document";
import { publishedEditorDocument, publishedEventProjection } from "./public-document";

const legacy = {
  id: "event-1",
  title: "Nome legado",
  type: "QUINZE_ANOS",
  eventDate: new Date("2026-11-23T22:00:00.000Z"),
  customization: { mensagem: "Mensagem legada" },
  gifts: [],
  photos: [],
  publishedData: null,
};

describe("seleção do documento público", () => {
  it("mantém o evento legado quando não existe publishedData", () => {
    expect(publishedEventProjection(legacy)).toBe(legacy);
  });

  it("renderiza o snapshot publicado e não o draft mais novo", () => {
    const published = createDefaultEventDocument({ basic: { name: "Nome publicado" }, content: { opening: { text: "Publicado" } } });
    const draft = createDefaultEventDocument({ basic: { name: "Rascunho novo" }, content: { opening: { text: "Ainda não publicado" } } });

    const projected = publishedEventProjection({ ...legacy, publishedData: published, draftData: draft });

    expect(projected.title).toBe("Nome publicado");
    expect((projected.customization as { mensagem: string }).mensagem).toBe("Publicado");
    expect(publishedEditorDocument({ publishedData: published })?.basic.name).toBe("Nome publicado");
    expect(publishedEditorDocument({ publishedData: null })).toBeNull();
  });
});
