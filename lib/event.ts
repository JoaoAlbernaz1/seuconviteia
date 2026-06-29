/**
 * Regras de visibilidade do site publico de um evento.
 *
 * Helper PURO e testavel (sem acesso a banco): recebe o "agora" por parametro
 * para nao depender de `Date.now()` durante a execucao. O carregamento do evento
 * (Prisma) fica na rota; aqui so se decide se o site deve ser exibido.
 */

/** Espelha o enum `EventStatus` do Prisma. */
export type StatusEvento = "DRAFT" | "PUBLISHED" | "EXPIRED";

/** Motivo pelo qual o site nao pode ser exibido (alimenta `<SiteIndisponivel>`). */
export type MotivoIndisponivel = "inexistente" | "expirado" | "rascunho";

export interface VisibilidadeEvento {
  ok: boolean;
  motivo?: MotivoIndisponivel;
}

/** Subconjunto do Event necessario para decidir a visibilidade. */
type EventoVisivel = {
  status: StatusEvento;
  expiresAt: Date;
};

/**
 * Decide se o site de um evento pode ser servido publicamente.
 *
 *  - `null`        -> nao existe                  -> `inexistente`
 *  - `DRAFT`       -> ainda nao publicado         -> `rascunho`
 *  - `EXPIRED`     -> expirado por status         -> `expirado`
 *  - `expiresAt`   -> ja passou (`< agora`)       -> `expirado`
 *  - caso contrario (PUBLISHED e dentro do prazo) -> `ok: true`
 */
export function eventoPublico(
  ev: EventoVisivel | null,
  agora: Date,
): VisibilidadeEvento {
  if (!ev) return { ok: false, motivo: "inexistente" };
  if (ev.status === "DRAFT") return { ok: false, motivo: "rascunho" };
  if (ev.status === "EXPIRED" || ev.expiresAt.getTime() < agora.getTime()) {
    return { ok: false, motivo: "expirado" };
  }
  return { ok: true };
}
