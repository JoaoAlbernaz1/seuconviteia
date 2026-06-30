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

const partesDataHoraSP = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Divide um `Date` nos campos do form (`<input type="date">`/`<input type="time">`),
 * no fuso America/Sao_Paulo: `{ date: "yyyy-mm-dd", time: "HH:MM" }`.
 *
 * Usado pelo editor para pre-preencher data/horario a partir do `eventDate`
 * (que a action recombina como `new Date(`${date}T${time}:00`)`).
 */
export function dividirDataHoraSP(date: Date): { date: string; time: string } {
  const partes = partesDataHoraSP.formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === t)?.value ?? "";
  // Alguns runtimes formatam meia-noite como "24"; normaliza para "00".
  const hora = get("hour") === "24" ? "00" : get("hour");
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${hora}:${get("minute")}`,
  };
}
