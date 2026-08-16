import { describe, expect, it } from "vitest";
import { mergeCustomization, REMOVE_CUSTOMIZATION_FIELD } from "./customizationMerge";

describe("merge seguro de customization", () => {
  it("mantém o valor existente quando o campo está ausente ou undefined", () => {
    expect(mergeCustomization({ tema: "rose", mensagem: "Original" }, { tema: undefined }))
      .toEqual({ tema: "rose", mensagem: "Original" });
  });

  it("desabilita uma seção preservando sua configuração interna", () => {
    expect(mergeCustomization(
      { rsvp: { enabled: true, confirmationMessage: "Até lá" } },
      { rsvp: { enabled: false } },
    )).toEqual({ rsvp: { enabled: false, confirmationMessage: "Até lá" } });
  });

  it("remove somente quando recebe a operação explícita", () => {
    expect(mergeCustomization(
      { fotoUrl: "/foto.jpg", mensagem: "Convite" },
      { fotoUrl: REMOVE_CUSTOMIZATION_FIELD },
    )).toEqual({ mensagem: "Convite" });
  });

  it("preserva null como valor explícito em vez de inferir deleção", () => {
    expect(mergeCustomization({ logoUrl: "/logo.png" }, { logoUrl: null }))
      .toEqual({ logoUrl: null });
  });
});
