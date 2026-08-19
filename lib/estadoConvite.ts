/**
 * Em qual dos quatro estados um convite esta AGORA — e com QUAL palavra.
 *
 * Helper PURO (recebe o "agora"), como `lib/event.ts` e `lib/edicao.ts`.
 *
 * Mora aqui porque a mesma resposta e dada em TRES lugares ao mesmo tempo: a
 * lista ("Meus convites"), a tela do convite e o seletor da topbar. Enquanto
 * cada um decidia sozinho, cada um mentia a sua maneira — a tela do convite
 * cravava "No ar" em convite pausado, e o seletor pintava o pontinho verde numa
 * festa que ja tinha acontecido. Regra copiada e regra que diverge no primeiro
 * ajuste, e e assim que nasce painel que mente.
 *
 * A PALAVRA vem junto (`ESTADO_LABEL`) pelo mesmo motivo: a lista dizia
 * "Publicado" e a tela dizia "No ar" para o mesmo convite. Ficou "No ar" porque
 * so ele tem oposto visivel no painel — "Fora do ar" e o mesmo eixo (o site
 * responde ou nao), enquanto "Publicado" x "Fora do ar" parecem dois assuntos
 * diferentes para quem nao e tecnico (e, no banco, um convite fora do ar
 * continua PUBLISHED).
 */
import { conviteEncerrado, type StatusEvento } from "./event";

/**
 * Os quatro estados que um convite pode ter no painel.
 *
 * "fora-do-ar" e "rascunho" sao coisas MUITO diferentes (um site pausado pelo
 * dono x um site que nunca existiu) e por isso nao dividem selo: quem lesse
 * "Em criacao" num convite que ja foi para o WhatsApp dos convidados acharia
 * que perdeu o trabalho.
 */
export type EstadoConvite = "rascunho" | "no-ar" | "fora-do-ar" | "encerrada";

/** Subconjunto do Event necessario para decidir o estado. */
export type EventoEstado = {
  /** Tipado (e nao `string`): esta e a lib que as tres telas consultam — solta,
   *  ela aceitaria um `"Published"` de dedo torto e devolveria "rascunho". */
  status: StatusEvento;
  expiresAt: Date;
  /** Pausa do dono. Nao mexe no status: sair do ar nao destrava a edicao. */
  foraDoAr: boolean;
};

/**
 * O estado do convite agora.
 *
 * A ORDEM das perguntas e a regra. "Festa encerrada" vem antes de "fora do ar"
 * porque um convite pode ser as duas coisas, e a que manda e a definitiva: o
 * dono pode religar o que ele mesmo pausou, mas nao pode desencerrar a festa.
 */
export function estadoDoConvite(ev: EventoEstado, agora: Date): EstadoConvite {
  if (ev.status === "DRAFT") return "rascunho";
  if (conviteEncerrado(ev, agora)) return "encerrada";
  if (ev.foraDoAr) return "fora-do-ar";
  return "no-ar";
}

/** A palavra de cada estado — uma so no painel inteiro. */
export const ESTADO_LABEL: Record<EstadoConvite, string> = {
  "no-ar": "No ar",
  rascunho: "Em criação",
  "fora-do-ar": "Fora do ar",
  encerrada: "Festa encerrada",
};
