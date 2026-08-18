import { EventEditorDocumentSchema } from "./schema";
import { documentToRenderModel, presentesDoDocumento, ID_CONTRIBUICAO_LIVRE } from "./render";

type EventWithPublishedData = {
  id?: string;
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
    // `presentesDoDocumento` e nao `gifts.items`: a CONTRIBUICAO COM VALOR LIVRE
    // nao e um item da lista no documento — ela nasce ali, no fim, a partir de
    // `gifts.freeContribution`. Lendo `items` cru, o convite PUBLICADO perdia a
    // contribuicao livre inteira (o editor mostrava na previa e o convidado
    // nunca via). Mesma funcao que o sync usa para gravar os `GiftItem`, com o
    // MESMO id por evento — e o que casa a contribuicao paga com o item.
    gifts: presentesDoDocumento(parsed.data, `${event.id ?? ""}-${ID_CONTRIBUICAO_LIVRE}`).map((gift) => ({
      id: gift.id,
      title: gift.title,
      description: gift.description || null,
      priceCents: gift.priceCents,
      pricingMode: gift.pricingMode,
      quotaCount: gift.quotaCount,
      imageUrl: gift.imageUrl || null,
    })),
    photos: parsed.data.gallery.imageUrls.map((url, order) => ({ id: `published-${order}`, url, order })),
  } as T;
}

export function publishedEditorDocument(event: Pick<EventWithPublishedData, "publishedData">) {
  const parsed = EventEditorDocumentSchema.safeParse(event.publishedData);
  return parsed.success ? parsed.data : null;
}
