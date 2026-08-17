// Planos da plataforma (ASSINATURA) + FEATURE GATING (fonte unica de verdade).
//
// Modelo: o profissional ASSINA um plano; o evento HERDA o plano da conta. Os
// recursos liberam por NIVEL do plano (nao sao compras avulsas). A base do
// convite (capa, convite, evento, lista de presentes) e sempre visivel.
//
// Matriz (atualizada em 12/08/2026 — o RSVP saiu do Basico por decisao do dono):
//   BASICO   -> base (convite, evento, contador, programacao, presentes + Pix).
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
        // Confirmacao de presenca saiu do Basico (12/08/2026): e o recurso que
        // o profissional mais pede, e vira o motivo forte pra subir pro Classico.
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

/**
 * Limite de EVENTOS por plano (`null` = ilimitado). O numero do Basico e um
 * PLACEHOLDER de negocio (decisao do dono — ajustar aqui quando ele definir);
 * Classico/Premium sao ilimitados, como anunciado em PLANOS_INFO.
 */
/** Modelo VITRINE (grade de cards) da lista de presentes: só nos planos pagos. */
export function podeVitrine(plan: Plan): boolean {
  return plan !== "BASICO";
}

export function limiteEventos(plan: Plan): number | null {
  // Basico = 1 convite (decisao do Joao, 12/08/2026): quem faz festa o ano
  // inteiro precisa do Classico, que e onde a escada quer que a pessoa fique.
  return plan === "BASICO" ? 1 : null;
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
  /** Preço mensal exibido nos cards (ex.: "R$ 59"); `undefined` = grátis. */
  preco?: string;
  /** Mensalidade em centavos — usada no cálculo de "se paga com". */
  mensalidadeCents: number;
  /** Para quem é este plano, em uma linha (ajuda a pessoa a se reconhecer). */
  paraQuem: string;
  /**
   * Linha da taxa, exibida no RODAPE do card (decisao do Joao, 12/08/2026: a
   * taxa aparece uma vez so, embaixo, e nao grande no topo).
   */
  taxaLinha: string;
}

/** Ordem de exibicao dos planos (do menor para o maior). */
export const PLAN_ORDER: readonly Plan[] = ["BASICO", "CLASSICO", "PREMIUM"] as const;

/** Metadados dos tres planos para o cadastro e o painel. */
/**
 * Metadados dos tres planos.
 *
 * DESENHO DA ESCADA (decisao do Joao, 12/08/2026): o plano do MEIO tem que ser
 * o obviamente melhor negocio. Por isso a queda de taxa e assimetrica —
 * Basico -> Classico cai 2,5 pontos (a assinatura se paga com pouco mais de uma
 * festa), Classico -> Premium cai so 0,8 ponto (so compensa pra quem faz
 * volume). O Basico e gratis de proposito: enche a base e a plataforma ganha na
 * taxa desde o primeiro convite.
 *
 * Precos sao DECISAO DE NEGOCIO — mexer aqui muda a UI inteira e o calculo de
 * "se paga com". As taxas moram em `lib/pagamentos/taxa.ts`.
 */
/**
 * Metadados dos tres planos.
 *
 * DESENHO DA ESCADA (decisao do Joao, 12/08/2026): o plano do MEIO tem que ser
 * o obviamente melhor negocio. A queda de taxa e assimetrica — Basico ->
 * Classico cai 2,5 pontos, Classico -> Premium cai so 0,8. Somado ao limite de
 * 1 convite no Basico, quem faz festa com frequencia sobe pro Classico.
 *
 * As listas tem o MESMO numero de itens de proposito: cards do mesmo tamanho
 * comparam melhor. A taxa sai da lista e vira `taxaLinha`, no rodape do card.
 *
 * Precos sao DECISAO DE NEGOCIO. As taxas moram em `lib/pagamentos/taxa.ts`.
 */
export const PLANOS_INFO: PlanoInfo[] = [
  {
    key: "BASICO",
    label: "Básico",
    descricaoCurta: "Comece de graça. Você só paga quando recebe presente.",
    paraQuem: "Para quem está fazendo o primeiro convite.",
    mensalidadeCents: 0,
    taxaLinha: "Taxa de 5,9% sobre os presentes",
    inclui: [
      "1 convite",
      "Convite digital completo",
      "Contagem regressiva e programação",
      "Lista de presentes e recebimento por Pix",
      "Endereço próprio (subdomínio)",
    ],
  },
  {
    key: "CLASSICO",
    label: "Clássico",
    descricaoCurta: "Convites ilimitados e a taxa quase pela metade.",
    paraQuem: "Para quem faz festa o ano inteiro.",
    preco: "R$ 59",
    mensalidadeCents: 5_900,
    taxaLinha: "Taxa de 3,4% sobre os presentes",
    inclui: [
      "Tudo do Básico",
      "Confirmação de presença",
      "Convites ilimitados",
      "Mural de recados",
      "Álbum de fotos",
    ],
    destaque: true,
  },
  {
    key: "PREMIUM",
    label: "Premium",
    descricaoCurta: "Sua marca no lugar da nossa, e a menor taxa da plataforma.",
    paraQuem: "Para estúdio com time e clientes de alto padrão.",
    preco: "R$ 149",
    mensalidadeCents: 14_900,
    taxaLinha: "Taxa de 2,6% sobre os presentes",
    inclui: [
      "Tudo do Clássico",
      "Sua marca no lugar da nossa",
      "Domínio próprio do cliente",
      "Suporte prioritário",
      "Atendimento em até 1 dia útil",
    ],
  },
];

/** Rotulo legivel de um plano (para badges). */
export function rotuloPlano(plan: Plan): string {
  return PLANOS_INFO.find((p) => p.key === plan)?.label ?? plan;
}

/** O que a conta precisa expor para o plano efetivo ser calculado. */
export type ContaAssinatura = {
  plan: Plan;
  assinaturaStatus: string | null;
  assinaturaAte: Date | null;
};

/**
 * Plano que a conta REALMENTE tem agora.
 *
 * A coluna `plan` sozinha mente: ela guarda o plano CONTRATADO, e o direito
 * acaba quando o periodo pago vence. Derivar na leitura — em vez de rebaixar
 * por cron — elimina a janela em que o banco diz PREMIUM e a pessoa ja nao
 * paga. Toda decisao de direito (limite de eventos, vitrine, white-label)
 * deve passar por aqui, nao por `prof.plan`.
 *
 * Cancelar NAO corta na hora: quem cancelou ja pagou o mes corrente e fica ate
 * `assinaturaAte`. O que corta e o VENCIMENTO, nao o status.
 */
export function planoEfetivo(conta: ContaAssinatura, agora: Date): Plan {
  if (conta.plan === "BASICO") return "BASICO";
  if (!conta.assinaturaAte) return "BASICO";
  return conta.assinaturaAte.getTime() > agora.getTime() ? conta.plan : "BASICO";
}

/** Descer de plano (inclui cancelar, que e descer para o Basico). */
export function ehDowngrade(de: Plan, para: Plan): boolean {
  return PLAN_ORDER.indexOf(para) < PLAN_ORDER.indexOf(de);
}
