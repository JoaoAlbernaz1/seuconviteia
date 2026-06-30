// Planos da plataforma + FEATURE GATING (fonte unica de verdade).
//
// Modelo confirmado: o convite "base" e sempre visivel; os recursos de "valor"
// sao TRAVADOS e liberam por plano do evento (upsell). TODO o gating do site e do
// painel deriva daqui — paginas/componentes so chamam `recursosDoPlano` /
// `planoPermite`, nunca duplicam a regra.
//
// Matriz (base = capa, convite, evento, presentes, rodape — sempre on):
//   BASICO   -> base apenas.
//   CLASSICO -> base + rsvp + recados + galeria.
//   PREMIUM  -> tudo do CLASSICO + whiteLabel + dominioProprio.

export type Plan = "BASICO" | "CLASSICO" | "PREMIUM";

/** Recursos "de valor" travados por plano (a base nao entra aqui — e sempre on). */
export type Recurso =
  | "rsvp"
  | "recados"
  | "galeria"
  | "whiteLabel"
  | "dominioProprio";

/** Lista ordenada de todos os recursos (para iterar na UI). */
export const RECURSOS: readonly Recurso[] = [
  "rsvp",
  "recados",
  "galeria",
  "whiteLabel",
  "dominioProprio",
] as const;

/** Rotulos legiveis (pt-BR) de cada recurso, para a UI do form/painel. */
export const RECURSO_LABEL: Record<Recurso, string> = {
  rsvp: "Confirmar presença (RSVP)",
  recados: "Mural de recados",
  galeria: "Galeria de fotos",
  whiteLabel: "White-label (sua marca)",
  dominioProprio: "Domínio próprio",
};

/** Quais recursos cada plano libera (resultado de `recursosDoPlano`). */
export type RecursosPlano = Record<Recurso, boolean>;

/**
 * Recursos liberados por um plano. Fonte unica do gating: o site (nav, rodape,
 * home, paginas internas) e o painel leem SO daqui.
 */
export function recursosDoPlano(plan: Plan): RecursosPlano {
  switch (plan) {
    case "PREMIUM":
      return {
        rsvp: true,
        recados: true,
        galeria: true,
        whiteLabel: true,
        dominioProprio: true,
      };
    case "CLASSICO":
      return {
        rsvp: true,
        recados: true,
        galeria: true,
        whiteLabel: false,
        dominioProprio: false,
      };
    case "BASICO":
    default:
      return {
        rsvp: false,
        recados: false,
        galeria: false,
        whiteLabel: false,
        dominioProprio: false,
      };
  }
}

/** `true` se o plano libera o recurso. */
export function planoPermite(plan: Plan, recurso: Recurso): boolean {
  return recursosDoPlano(plan)[recurso];
}

// ----------------------------------------------------------------------------
// Metadados para UI (seletor de plano no form + badge/upsell no painel)
// ----------------------------------------------------------------------------

export interface PlanoInfo {
  key: Plan;
  label: string;
  descricaoCurta: string;
  /** Recursos que ESTE plano libera (cumulativo), derivado da matriz. */
  recursos: Recurso[];
}

/** Recursos liberados (cumulativos) de um plano, na ordem de `RECURSOS`. */
function recursosLiberados(plan: Plan): Recurso[] {
  const r = recursosDoPlano(plan);
  return RECURSOS.filter((recurso) => r[recurso]);
}

/** Ordem de exibicao dos planos (do menor para o maior). */
export const PLAN_ORDER: readonly Plan[] = ["BASICO", "CLASSICO", "PREMIUM"] as const;

/** Metadados dos tres planos para o seletor do form e o painel. */
export const PLANOS_INFO: PlanoInfo[] = [
  {
    key: "BASICO",
    label: "Básico",
    descricaoCurta: "O convite essencial: capa, convite, evento e presentes.",
    recursos: recursosLiberados("BASICO"),
  },
  {
    key: "CLASSICO",
    label: "Clássico",
    descricaoCurta: "Tudo do Básico + confirmação de presença, recados e galeria.",
    recursos: recursosLiberados("CLASSICO"),
  },
  {
    key: "PREMIUM",
    label: "Premium",
    descricaoCurta: "Tudo do Clássico + white-label (sua marca) e domínio próprio.",
    recursos: recursosLiberados("PREMIUM"),
  },
];

/** Rotulo legivel de um plano (para badges). */
export function rotuloPlano(plan: Plan): string {
  return PLANOS_INFO.find((p) => p.key === plan)?.label ?? plan;
}

// ----------------------------------------------------------------------------
// Compat shim (componente DORMANT `components/Convite.tsx`)
//
// `Convite.tsx` (convite single-page, ainda nao usado em rota) consome `SecoesPlano`
// /`secoesDoPlano`. Mantidos como fina camada derivada da matriz para nao quebrar o
// tsc; quando esse componente for religado, migra para `recursosDoPlano`.
// ----------------------------------------------------------------------------

export interface SecoesPlano {
  /** Album de fotos (galeria). */
  album: boolean;
  /** Trilha sonora / player de musica. */
  musica: boolean;
  /** Remove a marca da plataforma (white-label). */
  semMarcaPlataforma: boolean;
}

export function secoesDoPlano(plan: Plan): SecoesPlano {
  const r = recursosDoPlano(plan);
  return {
    album: r.galeria,
    musica: r.galeria,
    semMarcaPlataforma: r.whiteLabel,
  };
}
