import { EventEditorDocumentSchema } from "./schema";
import { documentToRenderModel } from "./render";

type EventWithPublishedData = {
  title: string;
  type: string;
  eventDate: Date;
  customization?: unknown;
  gifts?: unknown[];
  photos?: unknown[];
  publishedData?: unknown;
};

/**
 * Public rendering always prefers the immutable published snapshot. Invalid or
 * absent snapshots deliberately fall back to the original object so legacy
 * invitations keep the exact existing path.
 */
export function publishedEventProjection<T extends EventWithPublishedData>(event: T): T {
  const parsed = EventEditorDocumentSchema.safeParse(event.publishedData);
  if (!parsed.success) return event;

  const model = documentToRenderModel(parsed.data);
  return {
    ...event,
    title: model.event.title,
    type: model.event.type,
    eventDate: model.event.eventDate,
    customization: model.event.customization,
    gifts: parsed.data.gifts.items.map((gift) => ({
      id: gift.id,
      title: gift.title,
      description: gift.description || null,
      priceCents: Math.round((Number(gift.value.replace(/[^\d,]/g, "").replace(",", ".")) || 0) * 100),
      pricingMode: gift.pricingMode,
      quotaCount: gift.quotas ?? null,
      imageUrl: gift.imageUrl || null,
    })),
    photos: parsed.data.gallery.imageUrls.map((url, order) => ({ id: `published-${order}`, url, order })),
  } as T;
}

export function publishedEditorDocument(event: Pick<EventWithPublishedData, "publishedData">) {
  const parsed = EventEditorDocumentSchema.safeParse(event.publishedData);
  return parsed.success ? parsed.data : null;
}
