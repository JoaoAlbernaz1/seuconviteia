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
export type MotivoIndisponivel =
  | "inexistente"
  | "expirado"
  | "rascunho"
  | "fora-do-ar";

export interface VisibilidadeEvento {
  ok: boolean;
  motivo?: MotivoIndisponivel;
}

/** Subconjunto do Event necessario para decidir a visibilidade. */
type EventoVisivel = {
  status: StatusEvento;
  expiresAt: Date;
  /** Pausa do dono. Nao mexe no status: sair do ar nao destrava a edicao. */
  foraDoAr: boolean;
};

/**
 * Convite ENCERRADO: a festa passou e ele saiu do ar.
 *
 * Encerrado nao se edita. Sem isso, a mesma linha viraria a festa do ano que
 * vem — o convite pago (ou o unico do plano gratuito) seria reaproveitado para
 * sempre, e nenhuma festa nova geraria presente novo.
 */
export function conviteEncerrado(
  ev: { status: string; expiresAt: Date } | null,
  agora: Date,
): boolean {
  if (!ev) return false;
  return ev.status === "EXPIRED" || ev.expiresAt.getTime() < agora.getTime();
}

/**
 * Decide se o site de um evento pode ser servido publicamente.
 *
 *  - `null`        -> nao existe                  -> `inexistente`
 *  - `DRAFT`       -> ainda nao publicado         -> `rascunho`
 *  - encerrado     -> festa passou / `EXPIRED`    -> `expirado`
 *  - `foraDoAr`    -> o dono pausou o convite     -> `fora-do-ar`
 *  - caso contrario (PUBLISHED e dentro do prazo) -> `ok: true`
 *
 * A ORDEM e a mesma de `estadoDoConvite` (o painel do dono), e isso e o ponto:
 * as duas pontas precisam contar a MESMA historia sobre o mesmo convite.
 */
export function eventoPublico(
  ev: EventoVisivel | null,
  agora: Date,
): VisibilidadeEvento {
  if (!ev) return { ok: false, motivo: "inexistente" };
  if (ev.status === "DRAFT") return { ok: false, motivo: "rascunho" };
  // Encerrado ANTES de pausado: "fora do ar" promete volta ("volte mais tarde")
  // e "expirado" e definitivo. Um convite pausado sempre acaba vencendo
  // (`expiresAt` = data da festa + 2 dias), e nesse dia o painel do dono passa a
  // dizer "Festa encerrada" e recolhe o "Voltar ao ar" — o visitante ficaria
  // esperando uma volta que ninguem pode mais dar.
  if (conviteEncerrado(ev, agora)) return { ok: false, motivo: "expirado" };
  // Dentro do prazo, a pausa e do dono e tem volta: o convidado merece o aviso
  // certo, e nao o de festa vencida.
  if (ev.foraDoAr) return { ok: false, motivo: "fora-do-ar" };
  return { ok: true };
}
