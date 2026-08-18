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
    const published = createDefaultEventDocument({
      basic: { name: "Nome publicado" },
      content: { opening: { text: "Publicado" } },
      gifts: { items: [{ id: "gift-real", title: "Viagem", description: "", value: "R$ 1.200", imageUrl: "", pricingMode: "FIXO" }] },
    });
    const draft = createDefaultEventDocument({ basic: { name: "Rascunho novo" }, content: { opening: { text: "Ainda não publicado" } } });

    const projected = publishedEventProjection({ ...legacy, publishedData: published, draftData: draft });

    expect(projected.title).toBe("Nome publicado");
    expect((projected.customization as { mensagem: string }).mensagem).toBe("Publicado");
    expect(projected.gifts[0]).toMatchObject({ id: "gift-real", priceCents: 120000 });
    expect(publishedEditorDocument({ publishedData: published })?.basic.name).toBe("Nome publicado");
    expect(publishedEditorDocument({ publishedData: null })).toBeNull();
  });

  it("leva a CONTRIBUICAO COM VALOR LIVRE para o convite publicado", () => {
    // Ela nao mora em `gifts.items` — nasce de `gifts.freeContribution`. Lendo
    // os itens crus, o convidado nunca via a contribuicao livre no site no ar.
    const published = createDefaultEventDocument({
      gifts: {
        items: [{ id: "gift-real", title: "Viagem", description: "", value: "R$ 1.200", imageUrl: "", pricingMode: "FIXO" }],
        freeContribution: { enabled: true, title: "Ajude com a festa", suggestedValues: "R$ 50 · R$ 100" },
      },
    });

    const projected = publishedEventProjection({ ...legacy, publishedData: published });

    expect(projected.gifts).toHaveLength(2);
    // id igual ao que o sync grava no banco — e o que casa o Pix pago com o item.
    expect(projected.gifts[1]).toMatchObject({
      id: "event-1-contribuicao-livre",
      title: "Ajude com a festa",
      pricingMode: "LIVRE",
      priceCents: 0,
      description: "Sugestões: R$ 50 · R$ 100",
    });
  });

  it("desligada, a contribuicao livre nao entra na lista", () => {
    const published = createDefaultEventDocument({
      gifts: {
        items: [{ id: "gift-real", title: "Viagem", description: "", value: "R$ 1.200", imageUrl: "", pricingMode: "FIXO" }],
        freeContribution: { enabled: false, title: "Ajude com a festa", suggestedValues: "" },
      },
    });

    expect(publishedEventProjection({ ...legacy, publishedData: published }).gifts).toHaveLength(1);
  });
});
