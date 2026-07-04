import { describe, it, expect } from "vitest";
import {
  TEMPLATES,
  TEMPLATE_PADRAO_ID,
  lerTemplateId,
  templatePorId,
  templatesPorOcasiao,
  ocasiaoDoNicho,
} from "./templates";
import { TEMAS } from "./temas";
import { FONTES } from "./fontes";

describe("lerTemplateId", () => {
  it("cai no padrão quando ausente ou inválido", () => {
    expect(lerTemplateId(undefined)).toBe(TEMPLATE_PADRAO_ID);
    expect(lerTemplateId({})).toBe(TEMPLATE_PADRAO_ID);
    expect(lerTemplateId({ template: "nao-existe" })).toBe(TEMPLATE_PADRAO_ID);
    expect(lerTemplateId({ template: 123 })).toBe(TEMPLATE_PADRAO_ID);
  });

  it("respeita um id válido (inclui legados)", () => {
    expect(lerTemplateId({ template: "quinze-anos-glamour-rose" })).toBe("quinze-anos-glamour-rose");
    expect(lerTemplateId({ template: "casamento-noite-luxo" })).toBe("casamento-noite-luxo");
    expect(lerTemplateId({ template: "classico" })).toBe("classico");
    expect(lerTemplateId({ template: "editorial" })).toBe("editorial");
  });
});

describe("templatePorId", () => {
  it("cai no padrão para id desconhecido", () => {
    expect(templatePorId("xyz").id).toBe(TEMPLATE_PADRAO_ID);
  });
});

describe("templatesPorOcasiao", () => {
  it("filtra pela ocasião e exclui os legados", () => {
    const cas = templatesPorOcasiao("casamento");
    expect(cas.length).toBeGreaterThan(0);
    expect(cas.every((t) => t.ocasiao === "casamento")).toBe(true);
    expect(cas.every((t) => !t.legado)).toBe(true);
  });

  it("coloca os disponíveis antes dos 'em breve'", () => {
    const q = templatesPorOcasiao("quinze-anos");
    const idxIndisponivel = q.findIndex((t) => !t.disponivel);
    if (idxIndisponivel !== -1) {
      // nenhum disponível pode aparecer depois de um indisponível
      expect(q.slice(idxIndisponivel).every((t) => !t.disponivel)).toBe(true);
    }
  });

  it("nicho desconhecido cai em casamento", () => {
    expect(templatesPorOcasiao("qualquer")).toEqual(templatesPorOcasiao("casamento"));
  });
});

describe("ocasiaoDoNicho", () => {
  it("mapeia os enums para ocasiões", () => {
    expect(ocasiaoDoNicho("CASAMENTO")).toBe("casamento");
    expect(ocasiaoDoNicho("BODAS")).toBe("casamento");
    expect(ocasiaoDoNicho("QUINZE_ANOS")).toBe("quinze-anos");
    expect(ocasiaoDoNicho("ANIVERSARIO")).toBe("aniversario");
    expect(ocasiaoDoNicho("SESSENTA_ANOS")).toBe("aniversario");
  });
});

describe("integridade do registro", () => {
  it("todo template aponta para uma paleta e uma fonte que existem", () => {
    for (const t of Object.values(TEMPLATES)) {
      expect(TEMAS[t.paletaPadrao], `paleta de ${t.id}`).toBeTruthy();
      expect(FONTES[t.fontesPadrao], `fonte de ${t.id}`).toBeTruthy();
    }
  });

  it("o id do padrão existe e está disponível", () => {
    expect(TEMPLATES[TEMPLATE_PADRAO_ID]).toBeTruthy();
    expect(TEMPLATES[TEMPLATE_PADRAO_ID].disponivel).toBe(true);
  });

  it("a chave do registro bate com o id de cada entrada", () => {
    for (const [key, t] of Object.entries(TEMPLATES)) {
      expect(t.id).toBe(key);
    }
  });

  it("os 9 templates reais existem e estão disponíveis", () => {
    const ids = [
      "casamento-classico-elegante",
      "casamento-editorial-moderno",
      "casamento-noite-luxo",
      "quinze-anos-glamour-rose",
      "quinze-anos-fashion-editorial",
      "quinze-anos-princesa-delicado",
      "aniversario-adulto-elegante",
      "aniversario-infantil-ludico",
      "aniversario-tropical-festa",
    ];
    for (const id of ids) {
      expect(TEMPLATES[id], id).toBeTruthy();
      expect(TEMPLATES[id].disponivel, id).toBe(true);
      expect(TEMPLATES[id].legado, id).toBeFalsy();
    }
  });

  it("cada ocasião oferece exatamente 3 templates no seletor", () => {
    expect(templatesPorOcasiao("casamento").length).toBe(3);
    expect(templatesPorOcasiao("quinze-anos").length).toBe(3);
    expect(templatesPorOcasiao("aniversario").length).toBe(3);
  });
});
