import { describe, expect, it } from "vitest";
import { createDefaultEventDocument } from "./document";
import { documentToRenderModel } from "./render";
import { toggleSection } from "./state";

describe("modelo único do renderer", () => {
  it("deriva conteúdo e visibilidade somente do documento local", () => {
    let document = createDefaultEventDocument({
      basic: { name: "Ana Clara" },
      rsvp: { enabled: true },
      gifts: { enabled: true },
      gallery: { enabled: true },
    });

    for (let cycle = 0; cycle < 3; cycle += 1) {
      document = toggleSection(document, "rsvp", false);
      expect(documentToRenderModel(document).resources.rsvp).toBe(false);
      document = toggleSection(document, "rsvp", true);
      expect(documentToRenderModel(document).resources.rsvp).toBe(true);
    }

    const model = documentToRenderModel(document);
    expect(model.event.title).toBe("Ana Clara");
    expect(model.resources).toMatchObject({ rsvp: true, presentes: true, galeria: true });
    expect(model.footerEnabled).toBe(true);
    expect(documentToRenderModel(toggleSection(document, "footer", false)).footerEnabled).toBe(false);
  });

  it("oculta o Pix sem apagar sua configuração canônica", () => {
    const document = createDefaultEventDocument({ pix: { enabled: false, name: "Ana", key: "ana@example.com" } });
    const model = documentToRenderModel(document);

    expect(model.event.customization).toMatchObject({ pixNome: undefined, pixChave: undefined });
    expect(document.pix).toEqual({ enabled: false, name: "Ana", key: "ana@example.com" });
  });
});
