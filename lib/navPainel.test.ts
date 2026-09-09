import { describe, expect, it } from "vitest";
import { abasDoPainel, hrefDoConvite, hrefDoEditorConvite, hrefDoEditorDominio } from "./navPainel";

describe("abasDoPainel — quem nao tem convite nao ve as abas de convite", () => {
  it("sem nenhum convite: as tres abas somem", () => {
    expect(abasDoPainel({ temConvite: false, rsvp: true, presentes: true })).toEqual({
      convidados: false,
      presentes: false,
      recebimentos: false,
    });
  });

  it("sem convite, some mesmo que o plano libere tudo", () => {
    const abas = abasDoPainel({ temConvite: false, rsvp: true, presentes: true });
    expect(Object.values(abas).some(Boolean)).toBe(false);
  });

  it("com convite e tudo ativo: as tres aparecem", () => {
    expect(abasDoPainel({ temConvite: true, rsvp: true, presentes: true })).toEqual({
      convidados: true,
      presentes: true,
      recebimentos: true,
    });
  });

  it("confirmacao de presenca desligada: some 'Convidados'", () => {
    const abas = abasDoPainel({ temConvite: true, rsvp: false, presentes: true });
    expect(abas.convidados).toBe(false);
    expect(abas.presentes).toBe(true);
  });

  it("lista de presentes desligada: some 'Presentes'", () => {
    const abas = abasDoPainel({ temConvite: true, rsvp: true, presentes: false });
    expect(abas.presentes).toBe(false);
  });

  it("Recebimentos continua acessivel mesmo com a lista desligada (dinheiro ja recebido)", () => {
    const abas = abasDoPainel({ temConvite: true, rsvp: false, presentes: false });
    expect(abas.recebimentos).toBe(true);
  });
});

describe("hrefDoConvite — menu que depende do convite ativo", () => {
  it("com convite ativo, abre a tela daquele convite", () => {
    expect(hrefDoConvite("abc123", "convidados")).toBe("/painel/abc123/convidados");
    expect(hrefDoConvite("abc123", "presentes")).toBe("/painel/abc123/presentes");
    expect(hrefDoConvite("abc123", "cofre")).toBe("/painel/abc123/cofre");
  });

  it("SEM convite, NUNCA cai no assistente /painel/novo", () => {
    for (const sufixo of ["convidados", "presentes", "cofre"]) {
      expect(hrefDoConvite(null, sufixo)).not.toBe("/painel/novo");
    }
  });

  it("sem convite, manda pra Meus convites (que explica e oferece criar)", () => {
    expect(hrefDoConvite(null, "convidados")).toBe("/painel/convites");
    expect(hrefDoConvite(null, "presentes")).toBe("/painel/convites");
    expect(hrefDoConvite(null, "cofre")).toBe("/painel/convites");
  });
});

describe("hrefDoEditorConvite — edição atual do convite", () => {
  it("leva qualquer atalho de edição para o editor guiado em uso", () => {
    expect(hrefDoEditorConvite("abc123")).toBe("/painel/criar?id=abc123");
  });

  it("leva o atalho de domínio direto ao passo que altera o endereço", () => {
    expect(hrefDoEditorDominio("abc123")).toBe("/painel/criar?id=abc123&step=6");
  });
});
