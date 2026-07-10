import { describe, expect, it } from "vitest";
import { reviverEventoFesta, type EventoCru } from "./eventoCru";

/**
 * Monta um evento cru. `d` decide se as datas saem como `Date` (cache MISS do
 * unstable_cache) ou como string ISO (cache HIT, apos o JSON.parse do Next).
 */
function cru(d: (iso: string) => Date | string): EventoCru {
  return {
    id: "ev1",
    professionalId: "p1",
    type: "QUINZE_ANOS",
    subdomain: "maria-clara",
    title: "Maria Clara",
    templateId: null,
    eventDate: d("2026-08-01T23:00:00.000Z"),
    expiresAt: d("2026-08-31T23:00:00.000Z"),
    status: "PUBLISHED",
    plan: "BASICO",
    customization: null,
    createdAt: d("2026-07-01T10:00:00.000Z"),
    updatedAt: d("2026-07-02T10:00:00.000Z"),
    professional: {
      id: "p1",
      name: "Estudio",
      email: "e@e.com",
      passwordHash: null,
      plan: "BASICO",
      avatarUrl: null,
      brandName: null,
      brandLogoUrl: null,
      brandColors: null,
      createdAt: d("2026-06-01T10:00:00.000Z"),
      updatedAt: d("2026-06-01T10:00:00.000Z"),
    },
    template: null,
    gifts: [
      {
        id: "g1",
        eventId: "ev1",
        title: "Pix",
        description: null,
        imageUrl: null,
        priceCents: 5000,
        mode: "PIX",
        pixPayload: null,
        purchased: false,
        buyerName: null,
        createdAt: d("2026-07-01T10:00:00.000Z"),
      },
    ],
    photos: [
      {
        id: "f1",
        eventId: "ev1",
        url: "/f.jpg",
        order: 0,
        createdAt: d("2026-07-01T10:00:00.000Z"),
      },
    ],
  } as EventoCru;
}

describe("reviverEventoFesta", () => {
  it("cache HIT: converte strings ISO em Date", () => {
    const ev = reviverEventoFesta(cru((iso) => iso))!;
    expect(ev.expiresAt).toBeInstanceOf(Date);
    expect(ev.eventDate).toBeInstanceOf(Date);
    expect(ev.expiresAt.toISOString()).toBe("2026-08-31T23:00:00.000Z");
  });

  it("cache MISS: preserva Date que ja sao Date", () => {
    const ev = reviverEventoFesta(cru((iso) => new Date(iso)))!;
    expect(ev.expiresAt).toBeInstanceOf(Date);
    expect(ev.expiresAt.toISOString()).toBe("2026-08-31T23:00:00.000Z");
  });

  it("revive as datas das relacoes", () => {
    const ev = reviverEventoFesta(cru((iso) => iso))!;
    expect(ev.professional.createdAt).toBeInstanceOf(Date);
    expect(ev.professional.updatedAt).toBeInstanceOf(Date);
    expect(ev.gifts[0]!.createdAt).toBeInstanceOf(Date);
    expect(ev.photos[0]!.createdAt).toBeInstanceOf(Date);
  });

  it("aceita template nulo sem estourar", () => {
    const ev = reviverEventoFesta(cru((iso) => iso))!;
    expect(ev.template).toBeNull();
  });

  it("evento inexistente vira null", () => {
    expect(reviverEventoFesta(null)).toBeNull();
  });

  it("o resultado sobrevive ao eventoPublico (que chama getTime)", () => {
    const ev = reviverEventoFesta(cru((iso) => iso))!;
    expect(() => ev.expiresAt.getTime()).not.toThrow();
    expect(ev.expiresAt.getTime()).toBe(Date.parse("2026-08-31T23:00:00.000Z"));
  });
});
