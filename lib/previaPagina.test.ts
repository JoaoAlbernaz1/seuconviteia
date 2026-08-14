import { describe, expect, it } from "vitest";
import { paginaAlvo, paginaDaPrevia, type TogglesPrevia } from "./previaPagina";

const TUDO_LIGADO: TogglesPrevia = { rsvp: true, presentes: true, galeria: true, recados: true };

describe("paginaAlvo — o que o passo pede", () => {
  it("mapeia cada passo do editor", () => {
    expect(paginaAlvo(1)).toBe("inicio");
    expect(paginaAlvo(2)).toBe("evento");
    expect(paginaAlvo(3)).toBe("confirmar");
    expect(paginaAlvo(3, "obrigada-sim")).toBe("obrigada");
    expect(paginaAlvo(3, "obrigada-nao")).toBe("obrigada");
    expect(paginaAlvo(4)).toBe("presentes");
    expect(paginaAlvo(5)).toBe("galeria");
    expect(paginaAlvo(5, "recados")).toBe("recados");
    expect(paginaAlvo(6)).toBe("inicio");
  });
});

describe("paginaDaPrevia — nunca cai numa pagina desligada", () => {
  it("com tudo ligado, segue o alvo do passo", () => {
    expect(paginaDaPrevia(5, "recados", TUDO_LIGADO)).toBe("recados");
    expect(paginaDaPrevia(5, "galeria", TUDO_LIGADO)).toBe("galeria");
    expect(paginaDaPrevia(4, "presentes", TUDO_LIGADO)).toBe("presentes");
    expect(paginaDaPrevia(3, undefined, TUDO_LIGADO)).toBe("confirmar");
  });

  it("mural desligado -> mostra a galeria (a irma do mesmo passo)", () => {
    expect(paginaDaPrevia(5, "recados", { ...TUDO_LIGADO, recados: false })).toBe("galeria");
  });

  it("galeria desligada -> mostra o mural", () => {
    expect(paginaDaPrevia(5, "galeria", { ...TUDO_LIGADO, galeria: false })).toBe("recados");
    expect(paginaDaPrevia(5, undefined, { ...TUDO_LIGADO, galeria: false })).toBe("recados");
  });

  it("as DUAS do passo 5 desligadas -> cai no inicio (nunca a tela 'indisponivel')", () => {
    const off = { ...TUDO_LIGADO, galeria: false, recados: false };
    expect(paginaDaPrevia(5, "recados", off)).toBe("inicio");
    expect(paginaDaPrevia(5, "galeria", off)).toBe("inicio");
  });

  it("presentes desligados -> cai no inicio", () => {
    expect(paginaDaPrevia(4, "presentes", { ...TUDO_LIGADO, presentes: false })).toBe("inicio");
  });

  it("confirmacao desligada -> cai no inicio (inclusive na tela de obrigada)", () => {
    expect(paginaDaPrevia(3, undefined, { ...TUDO_LIGADO, rsvp: false })).toBe("inicio");
    expect(paginaDaPrevia(3, "obrigada-sim", { ...TUDO_LIGADO, rsvp: false })).toBe("inicio");
  });

  it("desligar uma secao nao afeta as outras paginas", () => {
    const semRecados = { ...TUDO_LIGADO, recados: false };
    expect(paginaDaPrevia(5, "galeria", semRecados)).toBe("galeria");
    expect(paginaDaPrevia(4, "presentes", semRecados)).toBe("presentes");
    expect(paginaDaPrevia(2, "quando", semRecados)).toBe("evento");
  });

  it("paginas que nao dependem de recurso nunca caem", () => {
    const tudoOff: TogglesPrevia = { rsvp: false, presentes: false, galeria: false, recados: false };
    expect(paginaDaPrevia(1, "capa", tudoOff)).toBe("inicio");
    expect(paginaDaPrevia(2, "quando", tudoOff)).toBe("evento");
    expect(paginaDaPrevia(6, "capa", tudoOff)).toBe("inicio");
  });
});
