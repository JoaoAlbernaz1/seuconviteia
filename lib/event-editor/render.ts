import type { EventoParaConteudo } from "../convite";
import type { TogglesSite } from "../recursos";
import { documentToLegacyCustomization } from "./legacy";
import type { EventEditorDocument } from "./document";

export type EventEditorRenderModel = {
  event: EventoParaConteudo;
  nicho: "QUINZE_ANOS";
  resources: TogglesSite;
  footerEnabled: boolean;
};

export function documentEventDate(document: EventEditorDocument): Date {
  const date = new Date(`${document.schedule.date}T${document.schedule.time || "20:00"}:00-03:00`);
  return document.schedule.date && !Number.isNaN(date.getTime())
    ? date
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

export function documentToRenderModel(document: EventEditorDocument): EventEditorRenderModel {
  const customization = documentToLegacyCustomization(document);
  if (!document.pix.enabled) {
    customization.pixNome = undefined;
    customization.pixChave = undefined;
  }
  const event: EventoParaConteudo = {
    title: document.basic.name,
    type: "QUINZE_ANOS",
    eventDate: documentEventDate(document),
    customization,
    gifts: document.gifts.items.map((gift) => ({
      title: gift.title,
      description: gift.description,
      priceCents: Math.round((Number(gift.value.replace(/[^\d,]/g, "").replace(",", ".")) || 0) * 100),
    })),
    photos: document.gallery.imageUrls.map((url, order) => ({ url, order })),
  };

  return {
    event,
    nicho: "QUINZE_ANOS",
    resources: {
      rsvp: document.rsvp.enabled,
      presentes: document.gifts.enabled,
      contador: true,
      programacao: document.schedule.program.enabled,
      recados: document.messages.enabled,
      galeria: document.gallery.enabled,
    },
    footerEnabled: document.footer.enabled,
  };
}
