import { describe, expect, it } from "vitest";
import { lerSecoes } from "./secoes";
import { textosDoNicho } from "./textos";

describe("lerSecoes — copy das secoes (cliente -> default do nicho)", () => {
  it("sem customization: cai para os defaults do nicho", () => {
    const s = lerSecoes(undefined, "QUINZE_ANOS");
    const t = textosDoNicho("QUINZE_ANOS");
    expect(s).toEqual({
      abertura: { eyebrow: "O convite", titulo: t.conviteTitulo },
      assinaturaLead: t.assinaturaPrefixo,
    });
  });

  it("defaults mudam por nicho (casamento != 15 anos)", () => {
    const quinze = lerSecoes({}, "QUINZE_ANOS");
    const casamento = lerSecoes({}, "CASAMENTO");
    expect(quinze.abertura.titulo).toBe("Vem comemorar comigo");
    expect(casamento.abertura.titulo).toBe("Vamos nos casar");
    expect(casamento.assinaturaLead).toBe("Com amor,");
  });

  it("nicho desconhecido cai para os textos neutros (Aniversario)", () => {
    const s = lerSecoes(undefined, "ZORP");
    const t = textosDoNicho("ANIVERSARIO");
    expect(s.abertura.titulo).toBe(t.conviteTitulo);
  });

  it("override do cliente vence o default", () => {
    const s = lerSecoes(
      { secoes: { abertura: { eyebrow: "Nosso convite", titulo: "Bora?" }, assinaturaLead: "Beijos," } },
      "QUINZE_ANOS",
    );
    expect(s).toEqual({
      abertura: { eyebrow: "Nosso convite", titulo: "Bora?" },
      assinaturaLead: "Beijos,",
    });
  });

  it("override parcial: so o titulo; o resto segue o default", () => {
    const s = lerSecoes({ secoes: { abertura: { titulo: "Vem comigo" } } }, "QUINZE_ANOS");
    const t = textosDoNicho("QUINZE_ANOS");
    expect(s.abertura.titulo).toBe("Vem comigo");
    expect(s.abertura.eyebrow).toBe("O convite");
    expect(s.assinaturaLead).toBe(t.assinaturaPrefixo);
  });

  it("string vazia / so espacos cai para o default (nao fica buraco)", () => {
    const s = lerSecoes(
      { secoes: { abertura: { titulo: "   ", eyebrow: "" }, assinaturaLead: "  " } },
      "QUINZE_ANOS",
    );
    const t = textosDoNicho("QUINZE_ANOS");
    expect(s.abertura.titulo).toBe(t.conviteTitulo);
    expect(s.abertura.eyebrow).toBe("O convite");
    expect(s.assinaturaLead).toBe(t.assinaturaPrefixo);
  });

  it("customization malformado nao quebra (cai para defaults)", () => {
    expect(lerSecoes("lixo", "QUINZE_ANOS").abertura.eyebrow).toBe("O convite");
    expect(lerSecoes({ secoes: "zoado" }, "QUINZE_ANOS").abertura.titulo).toBe(
      textosDoNicho("QUINZE_ANOS").conviteTitulo,
    );
    expect(lerSecoes({ secoes: { abertura: 42 } }, "QUINZE_ANOS").abertura.titulo).toBe(
      textosDoNicho("QUINZE_ANOS").conviteTitulo,
    );
    expect(lerSecoes([], "QUINZE_ANOS").assinaturaLead).toBe(
      textosDoNicho("QUINZE_ANOS").assinaturaPrefixo,
    );
  });
});
