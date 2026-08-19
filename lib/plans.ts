// Planos da plataforma + FEATURE GATING (fonte unica de verdade).
//
// MODELO DE NEGOCIO (17/08/2026): o convite e GRATIS e completo, e a plataforma
// ganha na taxa dos presentes. A assinatura existe para o PROFISSIONAL, que
// precisa de escala (convites ilimitados) e da propria marca.
//
// Matriz:
//   BASICO   -> o GRATUITO: convite COMPLETO (RSVP, recados, album, presentes).
//   CLASSICO -> profissional: o mesmo convite + convites ilimitados + marca propria.
//   PREMIUM  -> estudio: tudo + dominio proprio do cliente.
//
// Decisao do Joao em 17/08/2026, depois do levantamento de mercado: FestaLab,
// Wedy e Conviter entregam o site do evento INTEIRO de graca e ganham na taxa
// dos presentes. Tirar RSVP ou album do gratuito nos tirava do jogo na primeira
// comparacao. O que se vende agora e ESCALA (ilimitado) e MARCA, nao recurso.

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
        // O convite gratuito e COMPLETO (17/08/2026). Antes RSVP/recados/album
        // eram pagos, e isso perdia a comparacao com a FestaLab e a Wedy, que
        // dao os tres de graca. Quem paga, paga por escala e marca.
        rsvp: true,
        recados: true,
        galeria: true,
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
/**
 * Modelo VITRINE (grade de cards com foto) da lista de presentes.
 *
 * Liberado para TODOS desde 17/08/2026: a lista bonita e o que faz o convidado
 * presentear, e presente e a receita da plataforma — cobrar por ela era cobrar
 * para ganhar dinheiro. A funcao fica como ponto de extensao caso um dia a
 * vitrine volte a ser degrau de plano.
 */
export function podeVitrine(_plan: Plan): boolean {
  return true;
}

/**
 * A conta ainda pode criar convite?
 *
 * Existia so a checagem na HORA DE SALVAR: a pessoa do Basico clicava em "Novo
 * convite", montava o convite inteiro e so no fim levava um "seu plano inclui
 * ate 1 convite". Trabalho perdido e frustacao — a porta tem de estar fechada,
 * nao a saida.
 *
 * Conta so os convites VALIDOS (nao vencidos): festa que ja passou nao ocupa
 * vaga, senao o Basico virava uso unico para sempre.
 */
export function podeCriarEvento(plan: Plan, eventosAtivos: number): boolean {
  const limite = limiteEventos(plan);
  return limite === null || eventosAtivos < limite;
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

/**
 * Metadados dos planos, para a landing e o painel.
 *
 * DESENHO (decisao do Joao, 17/08/2026, com o mercado na mesa): o GRATUITO
 * entrega o convite inteiro — e o que FestaLab, Wedy e Conviter fazem, e quem
 * cobra pelo site perde na primeira comparacao. A receita vem da taxa (3,5%,
 * abaixo dos 3,69% do melhor plano deles).
 *
 * O que se vende: ESCALA e MARCA. O cerimonialista assina porque precisa de
 * convites ilimitados e da marca dele no site do cliente — nao porque falta
 * recurso no gratuito. Por isso as listas dos pagos falam de ilimitado, marca e
 * dominio, e nao de RSVP ou album.
 *
 * As listas tem o MESMO numero de itens de proposito: cards do mesmo tamanho
 * comparam melhor. A taxa sai da lista e vira `taxaLinha`, no rodape do card.
 *
 * Precos sao DECISAO DE NEGOCIO. As taxas moram em `lib/pagamentos/taxa.ts`.
 */
export const PLANOS_INFO: PlanoInfo[] = [
  {
    key: "BASICO",
    label: "Grátis",
    descricaoCurta: "Seu convite completo, de graça. Você só paga quando recebe presente.",
    paraQuem: "Para quem está fazendo a própria festa.",
    mensalidadeCents: 0,
    taxaLinha: "Taxa de 3,5% sobre os presentes",
    inclui: [
      "1 convite completo",
      "Confirmação de presença",
      "Mural de recados e álbum de fotos",
      "Lista de presentes com Pix",
      "Recebimento por Pix, sem taxa de saque",
    ],
  },
  {
    key: "CLASSICO",
    label: "Profissional",
    descricaoCurta: "Convites ilimitados com a sua marca no lugar da nossa.",
    paraQuem: "Para cerimonialista que faz festa o ano inteiro.",
    preco: "R$ 59",
    mensalidadeCents: 5_900,
    taxaLinha: "Taxa de 2,9% sobre os presentes",
    inclui: [
      "Convites ilimitados",
      "Sua marca no lugar da nossa",
      "Painel com todos os eventos",
      "Taxa menor nos presentes",
      "Tudo do plano grátis",
    ],
    destaque: true,
  },
  {
    key: "PREMIUM",
    label: "Estúdio",
    descricaoCurta: "Domínio próprio do cliente e a menor taxa da plataforma.",
    paraQuem: "Para estúdio com time e clientes de alto padrão.",
    preco: "R$ 149",
    mensalidadeCents: 14_900,
    taxaLinha: "Taxa de 2,5% sobre os presentes",
    inclui: [
      "Tudo do Profissional",
      "Domínio próprio do cliente",
      "Suporte prioritário",
      "Atendimento em até 1 dia útil",
      "A menor taxa da plataforma",
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
 * Campos MINIMOS que um `select` do Prisma precisa trazer para o plano efetivo
 * ser calculado: `select: { ...SELECT_ASSINATURA, name: true }`.
 *
 * Selecionar so `plan` e o erro classico — a linha continua dizendo PREMIUM
 * depois de a assinatura vencer.
 */
export const SELECT_ASSINATURA = {
  plan: true,
  assinaturaStatus: true,
  assinaturaAte: true,
} as const;

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

/**
 * Plano que vale para o SITE PUBLICO daquele convite.
 *
 * O convite NUNCA sai do ar por causa de pagamento — ele vive ate `expiresAt`,
 * que e logo depois da festa. O que a assinatura controla e o que ele TEM:
 * marca propria, dominio e a taxa menor. Quando a assinatura acaba, o convite
 * volta a ser o gratuito, e como o gratuito e completo o convidado nao perde
 * nada (RSVP, recados e album continuam) — volta a nossa marca no rodape.
 *
 * Antes isto lia `event.plan`, congelado na criacao: quem assinava, publicava e
 * cancelava ficava com o convite pago PARA SEMPRE. Era o vazamento do teste
 * gratis.
 *
 * Sem `professional` carregado, cai no plano gravado no evento — defensivo, para
 * uma consulta que esqueceu o include nao derrubar recurso de quem paga.
 */
export function planoDoSite(
  event: { plan: Plan; professional?: ContaAssinatura | null },
  agora: Date,
): Plan {
  if (!event.professional) return event.plan;
  return planoEfetivo(event.professional, agora);
}

/** Descer de plano (inclui cancelar, que e descer para o Basico). */
export function ehDowngrade(de: Plan, para: Plan): boolean {
  return PLAN_ORDER.indexOf(para) < PLAN_ORDER.indexOf(de);
}
