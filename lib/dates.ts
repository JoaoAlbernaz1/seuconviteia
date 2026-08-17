/** Utilitarios de data (puros e testaveis). */

/**
 * Quanto tempo o convite fica no ar DEPOIS da festa.
 *
 * Decisao do Joao em 17/08/2026: o convite cai quando a festa acaba. Antes eram
 * 30 dias (a landing chegou a prometer 90), e a sobra virava brecha — a pessoa
 * editava o MESMO convite para a festa seguinte e nunca mais pagava nem gerava
 * presente novo.
 *
 * Nao e "na hora da festa": e o fim do DIA SEGUINTE. A festa comeca as 20h e
 * varre a madrugada; derrubar o convite no meio dela seria pior do que a brecha.
 * A lembranca nao some — recados e fotos continuam no painel do dono.
 */
const VALIDADE_MS = 2 * 24 * 60 * 60 * 1000; // ate o fim do dia seguinte

/**
 * Quando o convite sai do ar: `eventDate` + ~2 dias.
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

const partesDataSP = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Data de "hoje" no fuso America/Sao_Paulo como `"yyyy-mm-dd"`. Usado para validar
 * (no servidor) que a data de um evento novo nao esta no passado — comparavel
 * lexicograficamente com o valor cru do `<input type="date">` (mesmo formato ISO).
 */
export function dataDeHojeSP(agora: Date = new Date()): string {
  const partes = partesDataSP.formatToParts(agora);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

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
