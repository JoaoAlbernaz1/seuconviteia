/**
 * Recursos do site CONFIGURAVEIS POR EVENTO — a camada de toggles em cima do
 * gating por plano (`lib/plans.ts`).
 *
 * Modelo (Painel v2): recurso ATIVO no site = plano permite ∩ toggle ligado.
 *  - O plano (assinatura da conta) define o que PODE ser usado — `lib/plans.ts`
 *    continua sendo a fonte unica da monetizacao.
 *  - O toggle (`customization.recursos`) define o que o profissional QUER neste
 *    evento. Ausente = ligado (eventos existentes nao mudam nada).
 *  - So os DESLIGADOS sao gravados no JSON (`{ rsvp: false }`) — JSON limpo.
 *
 * A UI (tela "Recursos do site" do editor) e o site (nav, paginas, secoes) leem
 * SO daqui. Se um dia a monetizacao mudar (recurso avulso em vez de plano), so a
 * ponte com `lib/plans.ts` muda.
 */
import { planoPermite, type Plan, type Recurso } from "./plans";

/** Recursos do site do evento que o profissional liga/desliga. */
export type RecursoSite =
  | "rsvp"
  | "presentes"
  | "contador"
  | "programacao"
  | "recados"
  | "galeria";

export type RecursoSiteDef = {
  key: RecursoSite;
  titulo: string;
  /** Explicacao de UMA linha do que o convidado ve no site. */
  descricao: string;
  /**
   * Recurso de plano que precisa estar liberado (`lib/plans.ts`); `null` = base
   * do convite (todo plano tem).
   */
  gate: Recurso | null;
  /** Tem configuracao propria no editor (link "Configurar")? */
  temConfig?: boolean;
};

/** Definicao dos cards da tela "Recursos do site" (ordem de exibicao). */
export const RECURSOS_SITE: readonly RecursoSiteDef[] = [
  {
    key: "rsvp",
    titulo: "Confirmação de presença",
    descricao: "Os convidados respondem “eu vou” direto no site.",
    gate: "rsvp",
  },
  {
    key: "presentes",
    titulo: "Lista de presentes + Pix",
    descricao: "Presentes com valor e chave Pix, sem aplicativo.",
    gate: null,
    temConfig: true,
  },
  {
    key: "contador",
    titulo: "Contador regressivo",
    descricao: "Quantos dias faltam, batendo na página do evento.",
    gate: null,
  },
  {
    key: "programacao",
    titulo: "Programação",
    descricao: "A linha do tempo da festa, hora a hora.",
    gate: null,
  },
  {
    key: "recados",
    titulo: "Mural de recados",
    descricao: "Convidados deixam mensagens de carinho no site.",
    gate: "recados",
  },
  {
    key: "galeria",
    titulo: "Galeria de fotos",
    descricao: "Um álbum elegante, com foto em tela cheia.",
    gate: "galeria",
  },
] as const;

export type TogglesSite = Record<RecursoSite, boolean>;

const TODOS_LIGADOS: TogglesSite = {
  rsvp: true,
  presentes: true,
  contador: true,
  programacao: true,
  recados: true,
  galeria: true,
};

/**
 * Le os toggles de um `customization` (JSON do evento). Chave ausente = ligado
 * (default). Tolerante a JSON malformado (qualquer coisa nao-false vira true).
 */
export function lerToggles(customization: unknown): TogglesSite {
  const out = { ...TODOS_LIGADOS };
  if (customization && typeof customization === "object" && "recursos" in customization) {
    const rec = (customization as { recursos?: unknown }).recursos;
    if (rec && typeof rec === "object") {
      for (const def of RECURSOS_SITE) {
        if ((rec as Record<string, unknown>)[def.key] === false) out[def.key] = false;
      }
    }
  }
  return out;
}

/**
 * Recursos ATIVOS no site do evento = plano permite ∩ toggle ligado.
 * E o que o site publico (nav, paginas, secoes) consulta.
 */
export function recursosDoSite(plan: Plan, customization: unknown): TogglesSite {
  const toggles = lerToggles(customization);
  const out = { ...TODOS_LIGADOS };
  for (const def of RECURSOS_SITE) {
    out[def.key] =
      (def.gate === null || planoPermite(plan, def.gate)) && toggles[def.key];
  }
  return out;
}

/**
 * Serializa os toggles para o `customization` — so os DESLIGADOS entram
 * (`undefined` quando todos ligados, mantendo o JSON limpo).
 */
export function togglesParaCustomization(
  toggles: TogglesSite,
): Partial<Record<RecursoSite, false>> | undefined {
  const off: Partial<Record<RecursoSite, false>> = {};
  let algum = false;
  for (const def of RECURSOS_SITE) {
    if (!toggles[def.key]) {
      off[def.key] = false;
      algum = true;
    }
  }
  return algum ? off : undefined;
}
