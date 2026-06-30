// Monetizacao da plataforma: MARCA D'AGUA + UPSELLS avulsos (sem planos).
//
// Modelo (confirmado com o dono):
//   - Todo evento nasce como PREVIEW: o site funciona 100%, mas com MARCA D'AGUA
//     ("feito com seuconviteia"). A BASE (capa, convite, evento, presentes) e
//     sempre visivel — e o que vende.
//   - O VALOR UNICO (`Event.purchased = true`) TIRA a marca d'agua e publica de
//     verdade.
//   - Cada UPSELL (rsvp, recados, galeria, dominio) destrava por pagamento avulso
//     (`Event.upsell* = true`).
//
// TODO o gating do site e do painel deriva daqui — paginas/componentes so chamam
// `recursosDoEvento` / `temMarcaDagua`, nunca duplicam a regra.

/** Recursos "de valor" destravados avulso (a base nao entra aqui — e sempre on). */
export type Upsell = "rsvp" | "recados" | "galeria" | "dominio";

/** Lista ordenada de todos os upsells (para iterar na UI). */
export const UPSELLS: readonly Upsell[] = [
  "rsvp",
  "recados",
  "galeria",
  "dominio",
] as const;

/** Rotulos legiveis (pt-BR) de cada upsell, para a UI do painel. */
export const UPSELL_LABEL: Record<Upsell, string> = {
  rsvp: "Confirmar presença (RSVP)",
  recados: "Mural de recados",
  galeria: "Álbum de fotos",
  dominio: "Domínio próprio",
};

/** Descricao curta de cada upsell (para o painel / venda). */
export const UPSELL_DESC: Record<Upsell, string> = {
  rsvp: "Convidados confirmam presença pelo site.",
  recados: "Mural de mensagens de carinho dos convidados.",
  galeria: "Álbum de fotos com tela cheia.",
  dominio: "Endereço próprio (ex.: festadamaria.com.br).",
};

/** Resultado de `recursosDoEvento`: quais recursos de valor estao liberados. */
export type RecursosEvento = Record<Upsell, boolean>;

/** Shape minimo (subconjunto do `Event`) lido pelo gating. */
export interface EventoComUpsells {
  upsellRsvp: boolean;
  upsellRecados: boolean;
  upsellGaleria: boolean;
  upsellDominio: boolean;
}

/**
 * Recursos liberados de um evento, derivado das flags de upsell. Fonte unica do
 * gating: o site (nav, home, paginas internas) e o painel leem SO daqui.
 */
export function recursosDoEvento(ev: EventoComUpsells): RecursosEvento {
  return {
    rsvp: ev.upsellRsvp,
    recados: ev.upsellRecados,
    galeria: ev.upsellGaleria,
    dominio: ev.upsellDominio,
  };
}

/** `true` se o upsell esta destravado no evento. */
export function upsellAtivo(ev: EventoComUpsells, upsell: Upsell): boolean {
  return recursosDoEvento(ev)[upsell];
}

/**
 * `true` enquanto o evento NAO foi comprado (valor unico) — i.e. ainda e um
 * preview e deve exibir a marca d'agua da plataforma.
 */
export function temMarcaDagua(ev: { purchased: boolean }): boolean {
  return !ev.purchased;
}

/** Coluna do `Event` que liga/desliga cada upsell (para writes no painel). */
export const UPSELL_FIELD: Record<Upsell, keyof EventoComUpsells> = {
  rsvp: "upsellRsvp",
  recados: "upsellRecados",
  galeria: "upsellGaleria",
  dominio: "upsellDominio",
};
