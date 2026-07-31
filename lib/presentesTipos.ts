// Tipos compartilhados entre a page /presentes (server) e a UI (client).
// SEM "use server" e SEM I/O — só shapes.
import type { GiftPricing } from "@/lib/pagamentos/contribuicao";

/** Um item da lista, pronto para o convidado presentear (Pix via plataforma). */
export type PresenteInterativo = {
  id: string;
  titulo: string;
  valorLabel?: string;
  pricingMode: GiftPricing;
  /** FIXO = preço; COTAS = total do item; LIVRE = mínimo. */
  priceCents: number;
  quotaCount?: number | null;
  /** Soma de cotas já PAGAS (modo COTAS). */
  cotasVendidas: number;
  /** Soma bruta já PAGA (todos os modos). */
  arrecadadoCents: number;
  /** FIXO comprado / COTAS lotado. LIVRE nunca esgota. */
  esgotado: boolean;
};

/** Payload de interatividade passado à lista de presentes do template. */
export type PresentearData = {
  eventId: string;
  itens: PresenteInterativo[];
};
