// Tipos compartilhados entre a page /presentes (server) e a UI (client).
// SEM "use server" e SEM I/O — só shapes.
import type { GiftPricing } from "@/lib/pagamentos/contribuicao";

/** Tipo do presente: PIX (dinheiro via plataforma) ou LINK (loja externa). */
export type PresenteTipo = "PIX" | "LINK";

/** Um item da lista, pronto para o convidado presentear. */
export type PresenteInterativo = {
  id: string;
  titulo: string;
  valorLabel?: string;
  /** PIX = paga na plataforma (com taxa); LINK = compra direto na loja. */
  tipo: PresenteTipo;
  /** URL da loja (só tipo LINK). */
  storeUrl?: string;
  /** Foto do produto (só tipo LINK; PIX usa a foto lateral do painel). */
  imageUrl?: string;
  pricingMode: GiftPricing;
  /** FIXO = preço; COTAS = total do item; LIVRE = mínimo. */
  priceCents: number;
  quotaCount?: number | null;
  /** Soma de cotas já PAGAS (modo COTAS). */
  cotasVendidas: number;
  /** Soma bruta já PAGA (todos os modos). */
  arrecadadoCents: number;
  /** FIXO comprado / COTAS lotado. LIVRE nunca esgota. LINK nunca esgota. */
  esgotado: boolean;
};

/** Payload de interatividade passado à lista de presentes do template. */
export type PresentearData = {
  eventId: string;
  itens: PresenteInterativo[];
  /** true = provedor de pagamento simulado (dev). O modal mostra o fluxo de
   *  teste (confirmação manual) em vez de aguardar o Pix real. */
  simulado: boolean;
};
