import { describe, it, expect } from "vitest";
import { lerConteudo, type EventoParaConteudo } from "./convite";

const baseEvent: EventoParaConteudo = {
  title: "15 anos da Maria Clara",
  type: "QUINZE_ANOS",
  // 2026-07-15 (horario UTC que cai no mesmo dia em America/Sao_Paulo)
  eventDate: new Date("2026-07-15T15:00:00.000Z"),
  customization: null,
};

describe("lerConteudo", () => {
  it("usa defaults seguros quando customization e nula", () => {
    const c = lerConteudo(baseEvent);
    expect(c.titulo).toBe("15 anos da Maria Clara");
    expect(c.nichoLabel).toBe("15 anos");
    expect(c.accent).toBe("#6D28D9");
    expect(c.programacao).toEqual([]);
    expect(c.fotos).toEqual([]);
    expect(c.presentes).toEqual([]);
    expect(c.mensagem).toBeUndefined();
    expect(c.local).toBeUndefined();
  });

  it("formata a data em pt-BR no fuso America/Sao_Paulo (dia da semana, sem ano)", () => {
    const c = lerConteudo(baseEvent);
    // Espelha o site da festa: dia da semana capitalizado, sem o ano (o ano
    // aparece no rodapé, na data pontilhada).
    expect(c.dataLabel).toBe("Quarta-feira, 15 de julho");
  });

  it("mapeia cada nicho para o rotulo amigavel", () => {
    const rotulo = (type: string) =>
      lerConteudo({ ...baseEvent, type }).nichoLabel;
    expect(rotulo("CASAMENTO")).toBe("Casamento");
    expect(rotulo("QUINZE_ANOS")).toBe("15 anos");
    expect(rotulo("SESSENTA_ANOS")).toBe("60 anos");
    expect(rotulo("BODAS")).toBe("Bodas de Ouro");
    expect(rotulo("ANIVERSARIO")).toBe("Aniversário");
  });

  it("le e limpa os campos de customization (vazio -> omitido)", () => {
    const c = lerConteudo({
      ...baseEvent,
      customization: {
        accent: "#8C4A63",
        mensagem: "  Que alegria celebrar com voce.  ",
        local: "Espaço Esplendor",
        traje: "",
        mapsUrl: "https://maps.example/x",
        programacao: [
          { hora: "20h30", titulo: "Recepção" },
          { hora: "22h00", titulo: "Jantar" },
        ],
      },
    });
    expect(c.accent).toBe("#8C4A63");
    expect(c.mensagem).toBe("Que alegria celebrar com voce.");
    expect(c.local).toBe("Espaço Esplendor");
    expect(c.traje).toBeUndefined();
    expect(c.mapsUrl).toBe("https://maps.example/x");
    expect(c.programacao).toHaveLength(2);
  });

  it("ignora customization malformada (cai para defaults)", () => {
    const c = lerConteudo({
      ...baseEvent,
      customization: { programacao: "isso-nao-e-array" },
    });
    expect(c.programacao).toEqual([]);
    expect(c.accent).toBe("#6D28D9");
  });

  it("prioriza fotos do evento (ordenadas) sobre customization.fotos", () => {
    const c = lerConteudo({
      ...baseEvent,
      customization: { fotos: ["/x.jpg"] },
      photos: [
        { url: "/b.jpg", order: 2 },
        { url: "/a.jpg", order: 1 },
      ],
    });
    expect(c.fotos).toEqual(["/a.jpg", "/b.jpg"]);
  });

  it("monta presentes a partir dos gifts com valor em BRL", () => {
    const c = lerConteudo({
      ...baseEvent,
      gifts: [
        { title: "Cota da festa", description: "Via Pix", priceCents: 15000 },
        { title: "Sem preco", priceCents: 0 },
      ],
    });
    expect(c.presentes[0].titulo).toBe("Cota da festa");
    expect(c.presentes[0].descricao).toBe("Via Pix");
    // ICU usa espaco nao-quebravel entre "R$" e o numero; normaliza p/ comparar.
    expect(c.presentes[0].valorLabel?.replace(/\s/g, " ")).toBe("R$ 150,00");
    expect(c.presentes[1].valorLabel).toBeUndefined();
  });
});
