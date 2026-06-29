/** Utilitarios de data (puros e testaveis). */

/** Quanto tempo o site de um evento fica no ar apos a data do evento. */
const VALIDADE_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

/**
 * Calcula quando o site de um evento expira: `eventDate` + 30 dias.
 * Retorna um NOVO `Date` (nao muta a entrada).
 */
export function calcularExpiracao(eventDate: Date): Date {
  return new Date(eventDate.getTime() + VALIDADE_MS);
}
