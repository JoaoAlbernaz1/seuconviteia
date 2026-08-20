import { describe, expect, it } from "vitest";
import { abasDoPainel, hrefDoConvite } from "./navPainel";

describe("abasDoPainel — quem nao tem convite nao ve as abas de convite", () => {
  it("sem nenhum convite: as duas abas somem", () => {
    expect(abasDoPainel({ temConvite: false, rsvp: true })).toEqual({
      convidados: false,
      recebimentos: false,
    });
  });

  it("sem convite, some mesmo que o plano libere tudo", () => {
    const abas = abasDoPainel({ temConvite: false, rsvp: true });
    expect(Object.values(abas).some(Boolean)).toBe(false);
  });

  it("com convite e tudo ativo: as duas aparecem", () => {
    expect(abasDoPainel({ temConvite: true, rsvp: true })).toEqual({
      convidados: true,
      recebimentos: true,
    });
  });

  it("confirmacao de presenca desligada: some 'Convidados'", () => {
    const abas = abasDoPainel({ temConvite: true, rsvp: false });
    expect(abas.convidados).toBe(false);
  });

  // A aba "Presentes" abria a tela de EDITAR a lista, que gravava onde o convite
  // publicado nao le mais (Task 11). Editar a lista virou assunto do editor; o
  // que ela rendeu continua em "Recebimentos".
  it("nao existe mais aba 'Presentes' no menu", () => {
    const abas = abasDoPainel({ temConvite: true, rsvp: true });
    expect("presentes" in abas).toBe(false);
  });

  it("Recebimentos continua acessivel mesmo com a lista desligada (dinheiro ja recebido)", () => {
    const abas = abasDoPainel({ temConvite: true, rsvp: false });
    expect(abas.recebimentos).toBe(true);
  });
});

describe("hrefDoConvite — menu que depende do convite ativo", () => {
  it("com convite ativo, abre a tela daquele convite", () => {
    expect(hrefDoConvite("abc123", "convidados")).toBe("/painel/abc123/convidados");
    expect(hrefDoConvite("abc123", "cofre")).toBe("/painel/abc123/cofre");
  });

  it("SEM convite, NUNCA cai no assistente /painel/novo", () => {
    for (const sufixo of ["convidados", "cofre"]) {
      expect(hrefDoConvite(null, sufixo)).not.toBe("/painel/novo");
    }
  });

  it("sem convite, manda pra Meus convites (que explica e oferece criar)", () => {
    expect(hrefDoConvite(null, "convidados")).toBe("/painel/convites");
    expect(hrefDoConvite(null, "cofre")).toBe("/painel/convites");
  });
});
