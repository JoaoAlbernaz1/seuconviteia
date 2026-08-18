import type { EventoParaConteudo } from "../convite";
import type { TogglesSite } from "../recursos";
import { documentToLegacyCustomization } from "./legacy";
import type { EventEditorDocument } from "./document";
import { brlParaCents } from "../eventoForm";
import type { PresentearData, PresenteInterativo } from "../presentesTipos";
import { lerValoresSugeridos } from "../valoresSugeridos";
import type { GiftPricing } from "../pagamentos/contribuicao";

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

/** Id do item "contribuicao com valor livre" (o unico presente sintetico). */
export const ID_CONTRIBUICAO_LIVRE = "contribuicao-livre";

/** Um presente pronto para virar linha do site (ou do banco). */
export type PresenteDoDocumento = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  priceCents: number;
  pricingMode: GiftPricing;
  quotaCount: number | null;
};

/**
 * Os presentes que o CONVIDADO ve: os itens da lista mais, quando ligada, a
 * "contribuicao com valor livre" (um item LIVRE no fim da lista). Antes ela so
 * existia no editor e nunca aparecia no convite.
 *
 * `idLivre` deixa o banco usar um id unico por evento; a previa usa o padrao.
 */
export function presentesDoDocumento(
  document: EventEditorDocument,
  idLivre: string = ID_CONTRIBUICAO_LIVRE,
): PresenteDoDocumento[] {
  const itens: PresenteDoDocumento[] = document.gifts.items.map((gift) => {
    const cents = brlParaCents(gift.value) ?? 0;
    const emCotas = gift.pricingMode === "COTAS" && !!gift.quotas && cents > 0;
    return {
      id: gift.id,
      title: gift.title,
      description: gift.description,
      imageUrl: gift.imageUrl,
      priceCents: cents,
      pricingMode: (emCotas ? "COTAS" : cents > 0 ? "FIXO" : "LIVRE") as GiftPricing,
      quotaCount: emCotas ? gift.quotas ?? null : null,
    };
  });

  const livre = document.gifts.freeContribution;
  if (livre.enabled) {
    itens.push({
      id: idLivre,
      title: livre.title || "Contribua com o valor que desejar",
      description: livre.suggestedValues ? `Sugestões: ${livre.suggestedValues}` : "",
      imageUrl: "",
      priceCents: 0,
      pricingMode: "LIVRE",
      quotaCount: null,
    });
  }
  return itens;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Lista interativa da PREVIA: o mesmo payload que o site publicado monta do
 * banco, so que direto do documento e com tudo zerado (nada foi pago ainda).
 *
 * Sem isto a previa nunca mostrava as fotos dos presentes nem o modelo
 * "Vitrine" — os dois dependem deste payload.
 */
export function presentearDePrevia(document: EventEditorDocument): PresentearData {
  const itens: PresenteInterativo[] = presentesDoDocumento(document).map((gift) => ({
    id: gift.id,
    titulo: gift.title,
    valorLabel: gift.priceCents > 0 ? brl.format(gift.priceCents / 100) : undefined,
    tipo: "PIX",
    imageUrl: gift.imageUrl || undefined,
    pricingMode: gift.pricingMode,
    priceCents: gift.priceCents,
    sugestoesCents:
      gift.pricingMode === "LIVRE" ? lerValoresSugeridos(gift.description) : undefined,
    quotaCount: gift.quotaCount,
    cotasVendidas: 0,
    arrecadadoCents: 0,
    esgotado: false,
  }));
  return { eventId: "preview", itens, simulado: true };
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
    gifts: presentesDoDocumento(document).map((gift) => ({
      title: gift.title,
      description: gift.description,
      priceCents: gift.priceCents,
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
