import { describe, expect, it } from "vitest";
import { EventEditorDocumentSchema } from "./schema";
import { documentToLegacyCustomization, legacyEventToDocument } from "./legacy";

const legacyEvent = {
  title: "Ana Clara",
  type: "QUINZE_ANOS",
  subdomain: "ana-clara",
  eventDate: new Date("2026-11-23T22:00:00.000Z"),
  customization: {
    template: "quinze-anos-glamour-rose",
    templateVersion: 1,
    tema: "rose",
    temaCor: "#CE578B",
    fontes: "classica",
    idade: 15,
    local: "Espaço Villa",
    endereco: "Av. das Palmeiras, 1200, São Paulo, SP",
    traje: "Esporte fino",
    pais: { pai: "Marcos", mae: "Maria" },
    recursos: { rsvp: false, presentes: false, galeria: false, recados: false },
    rsvpConfig: { permitirAcompanhantes: true, maxAcompanhantes: 4, pedirTelefone: true },
    pixNome: "Maria Martins",
    pixChave: "maria@example.com",
    secoes: { recados: { titulo: "Mande seu carinho" } },
  },
  gifts: [{ id: "gift-1", title: "Vestido", description: "O vestido da noite", priceCents: 40000, pricingMode: "FIXO", quotaCount: null, imageUrl: null }],
  photos: [{ url: "/foto-1.jpg" }],
};

describe("adapter de eventos legados", () => {
  it("gera um documento válido preservando configurações de recursos desligados", () => {
    const document = legacyEventToDocument(legacyEvent);

    expect(EventEditorDocumentSchema.safeParse(document).success).toBe(true);
    expect(document.rsvp).toMatchObject({ enabled: false, companionsEnabled: true, maxCompanions: 4, requestPhone: true });
    expect(document.pix).toEqual({ enabled: false, name: "Maria Martins", key: "maria@example.com" });
    expect(document.content.parents).toEqual({ enabled: true, father: "Marcos", mother: "Maria" });
    expect(document.gallery).toEqual({ enabled: false, imageUrls: ["/foto-1.jpg"] });
    expect(document.gifts.items[0]).toMatchObject({ id: "gift-1", title: "Vestido", value: "400,00" });
  });

  it("projeta enabled=false e mantém a configuração no JSON legado", () => {
    const document = legacyEventToDocument(legacyEvent);
    const customization = documentToLegacyCustomization(document);

    expect(customization.recursos).toMatchObject({ rsvp: false, presentes: false, galeria: false, recados: false });
    expect(customization.rsvpConfig).toMatchObject({ permitirAcompanhantes: true, maxAcompanhantes: 4, pedirTelefone: true });
    expect(customization.pixNome).toBe("Maria Martins");
    expect(customization.pixChave).toBe("maria@example.com");
  });
});
