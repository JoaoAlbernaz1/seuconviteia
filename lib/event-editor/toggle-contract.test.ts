import { describe, expect, it } from "vitest";
import { createDefaultEventDocument } from "./document";
import { toggleSection, updateField } from "./state";
import { TOGGLE_REGISTRY } from "./registry";
import { documentToRenderModel } from "./render";

describe("contrato central dos toggles do editor", () => {
  it("registra todos os toggles existentes que afetam o convite", () => {
    expect(TOGGLE_REGISTRY.map((toggle) => toggle.id)).toEqual([
      "cover.desktopImage",
      "cover.monogram",
      "content.parents",
      "content.dressCode",
      "schedule.program",
      "rsvp",
      "rsvp.companions",
      "gifts",
      "gifts.freeContribution",
      "pix",
      "gallery",
      "messages",
      "footer",
      "appearance.bold",
      "appearance.overlay",
      "appearance.animations",
    ]);
  });

  for (const toggle of TOGGLE_REGISTRY) {
    it(`${toggle.id}: preserva a configuração em três ciclos OFF → ON`, () => {
      let document = createDefaultEventDocument();
      document = updateField(document, toggle.configurationProbe.path, toggle.configurationProbe.value);

      for (let cycle = 0; cycle < 3; cycle += 1) {
        document = toggleSection(document, toggle.id, false);
        expect(toggle.readEnabled(document)).toBe(false);
        expect(toggle.configurationProbe.read(document)).toEqual(toggle.configurationProbe.value);

        document = toggleSection(document, toggle.id, true);
        expect(toggle.readEnabled(document)).toBe(true);
        expect(toggle.configurationProbe.read(document)).toEqual(toggle.configurationProbe.value);
      }
    });
  }
});

/**
 * O contrato acima só garante que o toggle PRESERVA a configuração ao desligar.
 * Ele não dizia nada sobre a prévia — e era por isso que o traje podia ser
 * desligado sem efeito nenhum na tela: `documentToLegacyCustomization` copiava
 * o texto sem olhar o `enabled`. Aqui a regra é a que o dono pediu: desligar
 * TEM de mudar o que o convidado veria.
 *
 * `documentToRenderModel` é o último ponto puro antes dos componentes — tudo o
 * que a prévia mostra sai dele, então comparar o modelo cobre a prévia inteira
 * sem precisar montar React.
 */
describe("todo toggle muda o que a prévia mostra", () => {
  // Data fixa: sem ela `documentEventDate` cai no `Date.now()`, os dois modelos
  // diferem por milissegundos e o teste passaria mesmo com o toggle quebrado.
  function baseDocument(probePath: string, probeValue: unknown) {
    let document = createDefaultEventDocument();
    document = updateField(document, "schedule.date", "2026-11-20");
    document = updateField(document, "schedule.time", "20:00");
    return updateField(document, probePath, probeValue);
  }

  /**
   * Nao ha mais lacuna: desde 17/08 a "contribuicao com valor livre" entra na
   * lista como um item de preco LIVRE (ver `presentesDoDocumento`), entao TODO
   * toggle do registro muda o convite que o convidado veria.
   */
  const SEM_SECAO_NO_SITE = new Set<string>();

  for (const toggle of TOGGLE_REGISTRY) {
    const esperado = SEM_SECAO_NO_SITE.has(toggle.id)
      ? `${toggle.id}: LACUNA — a seção não existe no convite, então desligar não muda nada`
      : `${toggle.id}: desligar muda o convite que o convidado veria`;

    it(esperado, () => {
      const base = baseDocument(toggle.configurationProbe.path, toggle.configurationProbe.value);
      const ligado = documentToRenderModel(toggleSection(base, toggle.id, true));
      const desligado = documentToRenderModel(toggleSection(base, toggle.id, false));
      if (SEM_SECAO_NO_SITE.has(toggle.id)) expect(desligado).toEqual(ligado);
      else expect(desligado).not.toEqual(ligado);
    });
  }
});
