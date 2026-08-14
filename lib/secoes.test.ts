import { describe, expect, it } from "vitest";
import { lerSecoes } from "./secoes";
import { textosDoNicho } from "./textos";

describe("lerSecoes — secao de recados", () => {
  it("sem override cai nos textos padrao do nicho", () => {
    const s = lerSecoes(undefined, "QUINZE_ANOS");
    const t = textosDoNicho("QUINZE_ANOS");
    expect(s.recados.eyebrow).toBe(t.recadosEyebrow);
    expect(s.recados.titulo).toBe(t.recadosTitulo);
    expect(s.recados.convite).toBe(t.recadosConvite);
    expect(s.recados.muralTitulo).toBe(t.recadosMural);
  });

  it("override do cliente vence, o resto continua no default", () => {
    const s = lerSecoes({ secoes: { recados: { titulo: "Mande um beijo" } } }, "QUINZE_ANOS");
    expect(s.recados.titulo).toBe("Mande um beijo");
    expect(s.recados.eyebrow).toBe(textosDoNicho("QUINZE_ANOS").recadosEyebrow);
  });

  it("texto em branco cai no default (nao deixa a secao sem titulo)", () => {
    const s = lerSecoes({ secoes: { recados: { titulo: "   ", convite: "" } } }, "QUINZE_ANOS");
    const t = textosDoNicho("QUINZE_ANOS");
    expect(s.recados.titulo).toBe(t.recadosTitulo);
    expect(s.recados.convite).toBe(t.recadosConvite);
  });

  it("JSON malformado nao quebra", () => {
    const s = lerSecoes({ secoes: { recados: "nada disso" } }, "QUINZE_ANOS");
    expect(s.recados.titulo).toBe(textosDoNicho("QUINZE_ANOS").recadosTitulo);
  });

  it("cada nicho tem a sua copy de recados preenchida", () => {
    for (const nicho of ["QUINZE_ANOS", "CASAMENTO", "BODAS", "SESSENTA_ANOS", "ANIVERSARIO"]) {
      const s = lerSecoes(undefined, nicho);
      expect(s.recados.eyebrow.length).toBeGreaterThan(0);
      expect(s.recados.titulo.length).toBeGreaterThan(0);
      expect(s.recados.convite).toContain("{nome}");
      expect(s.recados.muralTitulo.length).toBeGreaterThan(0);
    }
  });
});

describe("lerSecoes — copy das secoes (cliente -> default do nicho)", () => {
  it("sem customization: cai para os defaults do nicho", () => {
    const s = lerSecoes(undefined, "QUINZE_ANOS");
    const t = textosDoNicho("QUINZE_ANOS");
    expect(s).toEqual({
      abertura: { eyebrow: "O convite", titulo: t.conviteTitulo },
      assinaturaLead: t.assinaturaPrefixo,
      recados: {
        eyebrow: t.recadosEyebrow,
        titulo: t.recadosTitulo,
        convite: t.recadosConvite,
        muralTitulo: t.recadosMural,
      },
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
    const t = textosDoNicho("QUINZE_ANOS");
    expect(s).toEqual({
      abertura: { eyebrow: "Nosso convite", titulo: "Bora?" },
      assinaturaLead: "Beijos,",
      recados: {
        eyebrow: t.recadosEyebrow,
        titulo: t.recadosTitulo,
        convite: t.recadosConvite,
        muralTitulo: t.recadosMural,
      },
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
