import { describe, expect, it } from "vitest";
import { PALETA_CONVITE, paletaDoRsvp } from "./paletaConvite";

type Vars = Record<string, string>;

describe("paletaDoRsvp", () => {
  it("sem cor escolhida, devolve a paleta do tema", () => {
    expect(paletaDoRsvp()).toBe(PALETA_CONVITE);
    expect(paletaDoRsvp("")).toBe(PALETA_CONVITE);
  });

  it("com cor do editor, tinge as tres vars que pintam texto e botao", () => {
    const p = paletaDoRsvp("#7C3AED") as Vars;
    expect(p["--plum"]).toBe("#7C3AED");
    expect(p["--wine"]).toBe("#7C3AED");
    expect(p["--plum-2"]).toBe("color-mix(in srgb, #7C3AED 78%, #000)");
  });

  it("nao mexe no resto da paleta (fundo, tinta, dourado seguem o tema)", () => {
    const p = paletaDoRsvp("#7C3AED") as Vars;
    const base = PALETA_CONVITE as unknown as Vars;
    for (const k of ["--rose", "--gold", "--ivory", "--ivory-2", "--ink"]) {
      expect(p[k]).toBe(base[k]);
    }
  });
});
