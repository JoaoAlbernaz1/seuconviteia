/**
 * Quando o site de um convite pode ser MEXIDO.
 *
 * Decisao do Joao (18/08/2026): publicou, fecha. O que continua livre e o
 * movimento da festa (confirmacoes, recados, presentes recebidos) — o SITE em
 * si so reabre dentro de uma janela: a cortesia de 1h logo apos a primeira
 * publicacao, uma liberacao incluida no plano ou o passe pago.
 *
 * Helper PURO (recebe o "agora"), como `lib/event.ts`: a decisao mora aqui e as
 * tres portas do servidor (abrir editor, salvar documento, publicar) so
 * perguntam.
 */
import type { Plan } from "./plans";

/** Preco do passe de edicao, em centavos. */
export const PASSE_PRECO_CENTS = 1990;
/** Quanto tempo o passe pago mantem a edicao aberta. */
export const PASSE_HORAS = 48;
/** Cortesia logo depois da PRIMEIRA publicacao — a rede do erro de digitacao. */
export const CORTESIA_MINUTOS = 60;

/** Subconjunto do Event necessario para decidir a edicao. */
export type EventoEdicao = {
  status: string;
  edicaoAte: Date | null;
};

/** O site deste convite pode ser mexido agora? */
export function edicaoAberta(ev: EventoEdicao, agora: Date): boolean {
  if (ev.status === "EXPIRED") return false;
  if (ev.status === "DRAFT") return true;
  return ev.edicaoAte !== null && ev.edicaoAte.getTime() > agora.getTime();
}

export function fimDaCortesia(agora: Date): Date {
  return new Date(agora.getTime() + CORTESIA_MINUTOS * 60_000);
}

export function fimDoPasse(agora: Date): Date {
  return new Date(agora.getTime() + PASSE_HORAS * 60 * 60_000);
}

/** Liberacoes incluidas no plano, POR CONVITE (decisao do Joao: assinante tem teto). */
export function passesIncluidos(plan: Plan): number {
  switch (plan) {
    case "PREMIUM":
      return 3;
    case "CLASSICO":
      return 1;
    default:
      return 0;
  }
}

/** Ainda sobra liberacao incluida neste convite? */
export function temPasseIncluido(plan: Plan, passesGratis: number): boolean {
  return passesGratis < passesIncluidos(plan);
}
