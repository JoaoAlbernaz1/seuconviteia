import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(dashboard)/painel/criar/acoes", () => ({
  publicarDocumentoConvite: vi.fn(),
  salvarDocumentoConvite: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/components/event-editor/EditorPreview", () => ({ EditorPreview: () => null }));
vi.mock("next/font/local", () => ({ default: () => ({ className: "", variable: "" }) }));
vi.mock("next/font/google", () => {
  const font = () => ({ className: "", variable: "" });
  return {
    Cormorant: font, Dancing_Script: font, Jost: font, Marcellus: font, Pacifico: font,
    Playfair_Display: font, Great_Vibes: font, Fraunces: font, Cinzel: font, EB_Garamond: font,
    Montserrat: font, Allura: font, Bodoni_Moda: font, Parisienne: font, Sacramento: font,
    Lora: font, Cinzel_Decorative: font, Yeseva_One: font, Tangerine: font, Josefin_Sans: font, Poppins: font,
  };
});
import { documentoDoEditor, estadoDoDocumento } from "@/app/(dashboard)/painel/criar/CriarConvite";
import { createDefaultEventDocument } from "./document";

describe("compatibilidade entre a UI legada e o documento canônico", () => {
  it("preserva todos os campos canônicos no round-trip documento → UI → documento", () => {
    const document = createDefaultEventDocument();
    document.basic.name = "Documento de equivalência";
    document.content.parents = { enabled: false, father: "Pai", mother: "Mãe" };
    document.rsvp = { ...document.rsvp, enabled: false, companionsEnabled: true, maxCompanions: 4, requestPhone: true };
    document.pix = { enabled: false, name: "Titular", key: "chave-pix" };
    document.gallery = { enabled: false, imageUrls: ["/foto.jpg"] };

    const ui = {
      step: 1 as const, sv: "salvo" as const, showErr: false, foco: "capa" as const,
      acc: 0, theme: 0, recSt: ["pendente"], published: false, copied: false, pvMode: "celular" as const,
    };

    expect(documentoDoEditor(estadoDoDocumento(document, ui))).toEqual(document);
  });
});
