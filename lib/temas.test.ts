import { describe, it, expect } from "vitest";
import { TEMAS, TEMA_PADRAO, varsDoTema, acentoDoTema } from "./temas";

describe("temas (presets de cor)", () => {
  it('o preset "rose" tem os valores EXATOS do festa original', () => {
    const v = TEMAS.rose.vars;
    expect(v["--ev-ink"]).toBe("#2E1A20");
    expect(v["--ev-ink-soft"]).toBe("#6B4A54");
    expect(v["--ev-rosa"]).toBe("#E86FA6");
    expect(v["--ev-rosa-ink"]).toBe("#B83D6B");
    expect(v["--ev-rose"]).toBe("#F4A7B9");
    expect(v["--ev-blush"]).toBe("#FADADD");
    expect(v["--ev-blush-soft"]).toBe("#FCEFEF");
    expect(v["--ev-blush-section"]).toBe("#F6E4DF");
    expect(v["--ev-framboesa"]).toBe("#CE578B");
    expect(v["--ev-framboesa-deep"]).toBe("#B83D6B");
    expect(v["--ev-framboesa-bright"]).toBe("#D06A95");
    expect(v["--ev-ivory"]).toBe("#FBF6F2");
    expect(v["--line"]).toBe("rgba(46,26,32,0.10)");
    expect(v["--line-rosa"]).toBe("rgba(232,111,166,0.55)");
  });

  it("expõe pelo menos 6 presets coerentes (familia completa cada)", () => {
    const chaves = Object.keys(TEMAS);
    expect(chaves.length).toBeGreaterThanOrEqual(6);
    expect(chaves).toEqual(
      expect.arrayContaining(["rose", "dourado", "azul", "lavanda", "verde", "terracota"]),
    );
    // Toda chave de var presente em "rose" deve existir em todos os presets.
    const requeridas = Object.keys(TEMAS.rose.vars);
    for (const t of Object.values(TEMAS)) {
      for (const k of requeridas) {
        expect(t.vars).toHaveProperty(k);
      }
    }
  });

  it("varsDoTema cai para 'rose' quando a chave e desconhecida ou vazia", () => {
    expect(varsDoTema("inexistente")).toEqual(TEMAS[TEMA_PADRAO].vars);
    expect(varsDoTema(undefined)).toEqual(TEMAS[TEMA_PADRAO].vars);
    expect(varsDoTema(null)).toEqual(TEMAS[TEMA_PADRAO].vars);
    expect(varsDoTema("dourado")["--ev-rosa"]).toBe("#C9A24B");
  });

  it("acentoDoTema devolve o --ev-rosa do preset (default rose)", () => {
    expect(acentoDoTema("azul")).toBe("#6E97C9");
    expect(acentoDoTema("zzz")).toBe("#E86FA6");
  });
});
