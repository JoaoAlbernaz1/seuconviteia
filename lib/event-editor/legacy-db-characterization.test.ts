import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { brlParaCents } from "../eventoForm";
import { documentToLegacyCustomization, legacyEventToDocument } from "./legacy";
import { EventEditorDocumentSchema } from "./schema";

const enabled = process.env.LEGACY_DB_CHARACTERIZATION === "1";
const prisma = enabled ? new PrismaClient() : null;

type EventRow = { id: string; title: string; type: string; subdomain: string; eventDate: Date; customization: unknown };
type GiftRow = { id: string; eventId: string; title: string; description: string | null; priceCents: number; pricingMode: string; quotaCount: number | null; imageUrl: string | null };
type PhotoRow = { eventId: string; url: string; order: number };

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function expectSemanticSubset(actual: unknown, expected: unknown, path: string): void {
  if (expected && typeof expected === "object" && !Array.isArray(expected)) {
    const actualObject = object(actual);
    for (const [key, value] of Object.entries(expected as Record<string, unknown>)) {
      expectSemanticSubset(actualObject[key], value, `${path}.${key}`);
    }
    return;
  }
  expect(actual, path).toEqual(expected);
}

afterAll(async () => prisma?.$disconnect());

describe.runIf(enabled)("round-trip somente leitura dos eventos legados reais", () => {
  it("caracteriza todos os eventos sem alterar o banco", async () => {
    const events = await prisma!.$queryRaw<EventRow[]>`
      SELECT id, title, type, subdomain, eventDate, customization FROM Event ORDER BY id
    `;
    const gifts = await prisma!.$queryRaw<GiftRow[]>`
      SELECT id, eventId, title, description, priceCents, pricingMode, quotaCount, imageUrl FROM GiftItem ORDER BY id
    `;
    const photos = await prisma!.$queryRawUnsafe<PhotoRow[]>(
      "SELECT eventId, url, `order` FROM Photo ORDER BY eventId, `order`",
    );

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      const eventGifts = gifts.filter((gift) => gift.eventId === event.id);
      const eventPhotos = photos.filter((photo) => photo.eventId === event.id);
      const document = legacyEventToDocument({ ...event, gifts: eventGifts, photos: eventPhotos });
      const roundTrip = object(documentToLegacyCustomization(document));
      const before = object(event.customization);

      expect(EventEditorDocumentSchema.safeParse(document).success, event.id).toBe(true);
      expect(document.basic).toMatchObject({ name: event.title, slug: event.subdomain });

      for (const key of ["template", "mensagem", "traje", "pixNome", "pixChave", "fontes", "tema", "temaCor", "fotoUrl", "fotoDesktopUrl", "programacao"] as const) {
        if (before[key] !== undefined) expect(roundTrip[key], `${event.id}:${key}`).toEqual(before[key]);
      }
      for (const key of ["recursos", "rsvpConfig", "pais", "secoes"] as const) {
        if (before[key] !== undefined) expectSemanticSubset(roundTrip[key], before[key], `${event.id}:${key}`);
      }

      expect(document.gallery.imageUrls).toEqual(eventPhotos.map((photo) => photo.url));
      expect(document.gifts.items.map((gift) => gift.id)).toEqual(eventGifts.map((gift) => gift.id));
      expect(document.gifts.items.map((gift) => brlParaCents(gift.value) ?? 0)).toEqual(eventGifts.map((gift) => gift.priceCents));
    }
  });
});
