import { describe, expect, it } from "vitest";
import { eventoDoRascunho, lerRascunho } from "./previewEvento";
import { recursosDoSite } from "./recursos";

/** Rascunho minimo (o editor sempre manda pelo menos type/title). */
function rascunho(extra: Record<string, unknown> = {}) {
  return lerRascunho(JSON.stringify({ type: "QUINZE_ANOS", title: "Maria", ...extra }));
}

describe("eventoDoRascunho — recursos ligados/desligados", () => {
  it("recursosOff com programacao -> programacao desligada no site do preview", () => {
    const ev = eventoDoRascunho(rascunho({ recursosOff: ["programacao"] }));
    expect(recursosDoSite("PREMIUM", ev.customization).programacao).toBe(false);
  });

  it("sem recursosOff -> programacao ligada (default: eventos existentes nao mudam)", () => {
    const ev = eventoDoRascunho(rascunho());
    expect(recursosDoSite("PREMIUM", ev.customization).programacao).toBe(true);
  });

  it("desligar a programacao nao mexe nos outros recursos", () => {
    const ev = eventoDoRascunho(rascunho({ recursosOff: ["programacao"] }));
    const r = recursosDoSite("PREMIUM", ev.customization);
    expect(r.galeria).toBe(true);
    expect(r.recados).toBe(true);
    expect(r.presentes).toBe(true);
    expect(r.rsvp).toBe(true);
  });

  it("varios recursos desligados de uma vez", () => {
    const ev = eventoDoRascunho(rascunho({ recursosOff: ["programacao", "galeria"] }));
    const r = recursosDoSite("PREMIUM", ev.customization);
    expect(r.programacao).toBe(false);
    expect(r.galeria).toBe(false);
    expect(r.recados).toBe(true);
  });
});
