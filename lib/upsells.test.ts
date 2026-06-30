import { describe, it, expect } from "vitest";
import {
  recursosDoEvento,
  upsellAtivo,
  temMarcaDagua,
  UPSELLS,
  UPSELL_FIELD,
  type EventoComUpsells,
} from "./upsells";

/** Helper: evento com todas as flags em `valor` (default false). */
function evento(over: Partial<EventoComUpsells> = {}): EventoComUpsells {
  return {
    upsellRsvp: false,
    upsellRecados: false,
    upsellGaleria: false,
    upsellDominio: false,
    ...over,
  };
}

describe("recursosDoEvento — o gating deriva das flags do evento", () => {
  it("evento novo (preview, nada comprado) -> todos os upsells desligados", () => {
    expect(recursosDoEvento(evento())).toEqual({
      rsvp: false,
      recados: false,
      galeria: false,
      dominio: false,
    });
  });

  it("destrava SO o upsell ligado (cada flag e independente)", () => {
    expect(recursosDoEvento(evento({ upsellRsvp: true }))).toEqual({
      rsvp: true,
      recados: false,
      galeria: false,
      dominio: false,
    });
    expect(recursosDoEvento(evento({ upsellGaleria: true }))).toEqual({
      rsvp: false,
      recados: false,
      galeria: true,
      dominio: false,
    });
  });

  it("todos ligados -> todos liberados", () => {
    const tudo = evento({
      upsellRsvp: true,
      upsellRecados: true,
      upsellGaleria: true,
      upsellDominio: true,
    });
    expect(recursosDoEvento(tudo)).toEqual({
      rsvp: true,
      recados: true,
      galeria: true,
      dominio: true,
    });
  });
});

describe("upsellAtivo", () => {
  it("reflete a flag correspondente", () => {
    expect(upsellAtivo(evento({ upsellRecados: true }), "recados")).toBe(true);
    expect(upsellAtivo(evento({ upsellRecados: true }), "rsvp")).toBe(false);
  });
});

describe("temMarcaDagua — preview x comprado", () => {
  it("preview (purchased false) -> tem marca d'agua", () => {
    expect(temMarcaDagua({ purchased: false })).toBe(true);
  });
  it("comprado (valor unico) -> sem marca d'agua", () => {
    expect(temMarcaDagua({ purchased: true })).toBe(false);
  });
});

describe("UPSELL_FIELD — mapeia upsell -> coluna do Event", () => {
  it("cobre todos os upsells e aponta para a coluna upsell* certa", () => {
    for (const u of UPSELLS) {
      const field = UPSELL_FIELD[u];
      expect(field.startsWith("upsell")).toBe(true);
      // a coluna liga o upsell quando true
      const ev = evento({ [field]: true } as Partial<EventoComUpsells>);
      expect(upsellAtivo(ev, u)).toBe(true);
    }
  });
});
