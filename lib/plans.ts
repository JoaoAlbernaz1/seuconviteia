// Planos da plataforma (ASSINATURA) + FEATURE GATING (fonte unica de verdade).
//
// Modelo: o profissional ASSINA um plano; o evento HERDA o plano da conta. Os
// recursos liberam por NIVEL do plano (nao sao compras avulsas). A base do
// convite (capa, convite, evento, lista de presentes) e sempre visivel.
//
// Matriz (conforme o brief):
//   BASICO   -> base + RSVP.
//   CLASSICO -> base + RSVP + recados + galeria (album).
//   PREMIUM  -> tudo do CLASSICO + white-label + dominio proprio.

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

/** Rotulos legiveis (pt-BR) de cada recurso. */
export const RECURSO_LABEL: Record<Recurso, string> = {
  rsvp: "Confirmação de presença (RSVP)",
  recados: "Mural de recados",
  galeria: "Álbum de fotos",
  whiteLabel: "White-label (sua marca)",
  dominioProprio: "Domínio próprio",
};

/** Quais recursos cada plano libera. */
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
        rsvp: true,
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

/**
 * Limite de EVENTOS por plano (`null` = ilimitado). O numero do Basico e um
 * PLACEHOLDER de negocio (decisao do dono — ajustar aqui quando ele definir);
 * Classico/Premium sao ilimitados, como anunciado em PLANOS_INFO.
 */
export function limiteEventos(plan: Plan): number | null {
  return plan === "BASICO" ? 3 : null;
}

// ----------------------------------------------------------------------------
// Metadados para UI (seletor de plano no cadastro + "Gerenciar plano" no painel)
// ----------------------------------------------------------------------------

export interface PlanoInfo {
  key: Plan;
  label: string;
  descricaoCurta: string;
  /** Itens exibidos no card do plano (cumulativos). */
  inclui: string[];
  destaque?: boolean;
  /**
   * Preço mensal exibido nos cards (ex.: "R$ 39"). DECISÃO DE NEGÓCIO do dono —
   * fica `undefined` até ser definido; a UI mostra "Assinatura mensal" no lugar.
   */
  preco?: string;
}

/** Ordem de exibicao dos planos (do menor para o maior). */
export const PLAN_ORDER: readonly Plan[] = ["BASICO", "CLASSICO", "PREMIUM"] as const;

/** Metadados dos tres planos para o cadastro e o painel. */
export const PLANOS_INFO: PlanoInfo[] = [
  {
    key: "BASICO",
    label: "Básico",
    descricaoCurta: "O essencial para começar: convite, RSVP e presentes.",
    inclui: [
      "Até 3 eventos",
      "Templates essenciais",
      "Convite digital",
      "Confirmação de presença (RSVP)",
      "Lista de presentes (Pix)",
      "Endereço próprio (subdomínio)",
    ],
  },
  {
    key: "CLASSICO",
    label: "Clássico",
    descricaoCurta: "O mais popular: todos os recursos da festa, eventos ilimitados.",
    inclui: [
      "Tudo do Básico",
      "Todos os templates e nichos",
      "Álbum de fotos",
      "Mural de recados",
      "Save the date",
      "Eventos ilimitados",
      "Taxa reduzida na lista de presentes",
    ],
    destaque: true,
  },
  {
    key: "PREMIUM",
    label: "Premium",
    descricaoCurta: "Sua marca: white-label, domínio próprio e suporte prioritário.",
    inclui: [
      "Tudo do Clássico",
      "White-label (sua marca)",
      "Domínio personalizado",
      "Suporte prioritário",
    ],
  },
];

/** Rotulo legivel de um plano (para badges). */
export function rotuloPlano(plan: Plan): string {
  return PLANOS_INFO.find((p) => p.key === plan)?.label ?? plan;
}
