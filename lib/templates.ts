// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO CENTRAL DE TEMPLATES (metadados puros)
// ─────────────────────────────────────────────────────────────────────────────
//
// Um "template" e um LAYOUT proprio do site do evento (estrutura/clima da capa e
// da home), distinto de COR (`customization.tema`, lib/temas) e FONTE
// (`customization.fontes`, lib/fontes) — que sao eixos separados aplicados por
// cima de QUALQUER template via os tokens `--ev-*`.
//
// Este arquivo e PURO (so metadados + helpers) para poder ser importado em
// qualquer lugar (lib/eventoFesta, server actions, UI do painel) sem puxar a
// arvore de componentes React. O MAPA id -> componentes vive em
// `components/templates/registro.tsx` (lado de render), keyado pelos MESMOS ids.
//
// Contrato: todo template consome o mesmo `EventoFesta` (lib/eventoFesta) e
// respeita os recursos ativos (plano ∩ toggle). Campo ausente = template ignora.

import type { Plan } from "./plans";
import type { RecursoSite } from "./recursos";

/** Ocasioes atendidas hoje. */
export type TemplateOccasion = "casamento" | "quinze-anos" | "aniversario";

/** Familia visual do template (usada como rotulo/badge de categoria). */
export type TemplateCategory =
  | "classico-elegante"
  | "editorial"
  | "noite"
  | "glamour"
  | "princesa"
  | "adulto-elegante"
  | "infantil"
  | "tropical"
  | "cinematografico"; // legado (design original da festa)

/** Rotulo pt-BR de cada categoria (badge no card). */
export const CATEGORIA_LABEL: Record<TemplateCategory, string> = {
  "classico-elegante": "Clássico",
  editorial: "Editorial",
  noite: "Black Tie",
  glamour: "Glamour",
  princesa: "Delicado",
  "adulto-elegante": "Elegante",
  infantil: "Lúdico",
  tropical: "Tropical",
  cinematografico: "Cinematográfico",
};

/** Rotulo pt-BR de cada ocasiao. */
export const OCASIAO_LABEL: Record<TemplateOccasion, string> = {
  casamento: "Casamento",
  "quinze-anos": "15 anos",
  aniversario: "Aniversário",
};

/**
 * Definicao de um template (metadados). Os componentes de render ficam no
 * registro paralelo `components/templates/registro.tsx` (mesmo id).
 */
/** Tag de estilo (para filtros da galeria). */
export type TemplateTag = string;

/** Grupos de edicao que a tela "Personalizar layout" abre para um template. */
export type TemplateEditableGroup =
  | "capa"
  | "nomes-data"
  | "fontes"
  | "cores"
  | "menu"
  | "modulos"
  | "conteudo"
  | "css";

/** Modo de visualizacao do preview grande. */
export type TemplatePreviewMode = "desktop" | "tablet" | "mobile";

export type TemplateDefinition = {
  /** Id estavel — vai em `customization.template`. Ex.: "casamento-classico-elegante". */
  id: string;
  /** Nome comercial curto exibido no card. Ex.: "Clássico Elegante". */
  nome: string;
  ocasiao: TemplateOccasion;
  categoria: TemplateCategory;
  /** Descricao de uma linha (o que a pessoa sente ao ver). */
  descricao: string;
  /** Imagem de preview (thumbnail). Ausente = card usa gradiente da paleta. */
  previewImage?: string;
  /** Plano em que o template brilha (badge informativo; nao trava o render). */
  planoRecomendado: Plan;
  /** Recursos que o layout sabe exibir (todos hoje; campo ausente e ignorado). */
  recursosSuportados: RecursoSite[];
  /** Paleta padrao (chave de lib/temas) — a pessoa pode trocar por qualquer uma. */
  paletaPadrao: string;
  /** Dupla de fontes padrao (chave de lib/fontes) — trocavel. */
  fontesPadrao: string;
  /** Clima da capa: "claro" (foto/off-white) ou "escuro" (cinematografico). */
  clima: "claro" | "escuro";
  /** `false` = aparece no seletor como "em breve" (nao selecionavel ainda). */
  disponivel: boolean;
  /** `true` = design legado (renderiza, mas some do seletor novo). */
  legado?: boolean;
  /** Tags de estilo (filtros da galeria). Default = `tagsDoTemplate(id)`. */
  tags?: TemplateTag[];
  /** Grupos de edicao no estudio de personalizacao. Default = todos. */
  editableGroups?: TemplateEditableGroup[];
};

/** Todos os recursos do site (atalho para `recursosSuportados`). */
const TODOS_RECURSOS: RecursoSite[] = [
  "rsvp",
  "presentes",
  "contador",
  "programacao",
  "recados",
  "galeria",
];

// ─────────────────────────────────────────────────────────────────────────────
// O REGISTRO — 9 templates reais (3 por ocasiao) + legados
// ─────────────────────────────────────────────────────────────────────────────

export const TEMPLATES: Record<string, TemplateDefinition> = {
  // ═══ LEGADO — designs ja existentes (renderizam; fora do seletor novo) ═══
  classico: {
    id: "classico",
    nome: "Cinematográfico",
    ocasiao: "quinze-anos",
    categoria: "cinematografico",
    descricao: "Capa cinematográfica escura com a foto em tela cheia.",
    planoRecomendado: "BASICO",
    recursosSuportados: TODOS_RECURSOS,
    paletaPadrao: "rose",
    fontesPadrao: "classica",
    clima: "escuro",
    disponivel: true,
    legado: true,
  },
  editorial: {
    id: "editorial",
    nome: "Editorial (legado)",
    ocasiao: "casamento",
    categoria: "editorial",
    descricao: "Capa dividida foto | papel serifado, estilo revista.",
    planoRecomendado: "BASICO",
    recursosSuportados: TODOS_RECURSOS,
    paletaPadrao: "rose",
    fontesPadrao: "classica",
    clima: "claro",
    disponivel: true,
    legado: true,
  },

  // ═══ CASAMENTO ═══
  "casamento-classico-elegante": {
    id: "casamento-classico-elegante",
    nome: "Clássico Elegante",
    ocasiao: "casamento",
    categoria: "classico-elegante",
    descricao: "Off-white, dourado e serifas — sofisticado e atemporal.",
    planoRecomendado: "BASICO",
    recursosSuportados: TODOS_RECURSOS,
    paletaPadrao: "dourado",
    fontesPadrao: "classica",
    clima: "claro",
    disponivel: true,
  },
  "casamento-editorial-moderno": {
    id: "casamento-editorial-moderno",
    nome: "Editorial Moderno",
    ocasiao: "casamento",
    categoria: "editorial",
    descricao: "Revista de casamento: fotos grandes, muito respiro e tipografia forte.",
    planoRecomendado: "CLASSICO",
    recursosSuportados: TODOS_RECURSOS,
    paletaPadrao: "verde",
    fontesPadrao: "moderna",
    clima: "claro",
    disponivel: true,
  },
  "casamento-noite-luxo": {
    id: "casamento-noite-luxo",
    nome: "Noite Luxo",
    ocasiao: "casamento",
    categoria: "noite",
    descricao: "Capa cinematográfica escura com dourado — clima de gala black tie.",
    planoRecomendado: "PREMIUM",
    recursosSuportados: TODOS_RECURSOS,
    paletaPadrao: "dourado",
    fontesPadrao: "moderna",
    clima: "escuro",
    disponivel: true,
  },

  // ═══ 15 ANOS ═══
  "quinze-anos-glamour-rose": {
    id: "quinze-anos-glamour-rose",
    nome: "Glamour Rosé",
    ocasiao: "quinze-anos",
    categoria: "glamour",
    descricao: "Rosé e champagne com brilho — festa premium e feminina.",
    planoRecomendado: "BASICO",
    recursosSuportados: TODOS_RECURSOS,
    paletaPadrao: "rose",
    fontesPadrao: "romantica",
    clima: "claro",
    disponivel: true,
  },
  "quinze-anos-fashion-editorial": {
    id: "quinze-anos-fashion-editorial",
    nome: "Fashion Editorial",
    ocasiao: "quinze-anos",
    categoria: "editorial",
    descricao: "Ensaio de revista: foto em destaque e tipografia marcante.",
    planoRecomendado: "CLASSICO",
    recursosSuportados: TODOS_RECURSOS,
    paletaPadrao: "azul",
    fontesPadrao: "moderna",
    clima: "claro",
    disponivel: true,
  },
  "quinze-anos-princesa-delicado": {
    id: "quinze-anos-princesa-delicado",
    nome: "Princesa Delicado",
    ocasiao: "quinze-anos",
    categoria: "princesa",
    descricao: "Tons claros, floral e brilho leve — romântico e delicado.",
    planoRecomendado: "BASICO",
    recursosSuportados: TODOS_RECURSOS,
    paletaPadrao: "lavanda",
    fontesPadrao: "romantica",
    clima: "claro",
    disponivel: true,
  },

  // ═══ ANIVERSÁRIO ═══
  "aniversario-adulto-elegante": {
    id: "aniversario-adulto-elegante",
    nome: "Adulto Elegante",
    ocasiao: "aniversario",
    categoria: "adulto-elegante",
    descricao: "Moderno, limpo e neutro — elegante sem parecer infantil.",
    planoRecomendado: "BASICO",
    recursosSuportados: TODOS_RECURSOS,
    paletaPadrao: "azul",
    fontesPadrao: "moderna",
    clima: "claro",
    disponivel: true,
  },
  "aniversario-infantil-ludico": {
    id: "aniversario-infantil-ludico",
    nome: "Infantil Lúdico",
    ocasiao: "aniversario",
    categoria: "infantil",
    descricao: "Alegre e colorido, formas arredondadas — divertido e leve.",
    planoRecomendado: "BASICO",
    recursosSuportados: TODOS_RECURSOS,
    paletaPadrao: "rose",
    fontesPadrao: "festiva",
    clima: "claro",
    disponivel: true,
  },
  "aniversario-tropical-festa": {
    id: "aniversario-tropical-festa",
    nome: "Tropical Festa",
    ocasiao: "aniversario",
    categoria: "tropical",
    descricao: "Cores vivas e clima de comemoração — descontraído e festivo.",
    planoRecomendado: "CLASSICO",
    recursosSuportados: TODOS_RECURSOS,
    paletaPadrao: "terracota",
    fontesPadrao: "festiva",
    clima: "claro",
    disponivel: true,
  },
};

/** Fallback global quando o evento nao tem template ou o id e invalido. */
export const TEMPLATE_PADRAO_ID = "casamento-classico-elegante";

/** Alias de compatibilidade (codigo antigo esperava esse nome). */
export const TEMPLATE_PADRAO = TEMPLATE_PADRAO_ID;

/**
 * Le `customization.template` com fallback seguro.
 * Retorna sempre um id VALIDO do registro (ausente/invalido -> TEMPLATE_PADRAO_ID).
 */
export function lerTemplateId(customization: unknown): string {
  if (customization && typeof customization === "object" && "template" in customization) {
    const t = (customization as { template?: unknown }).template;
    if (typeof t === "string" && t in TEMPLATES) return t;
  }
  return TEMPLATE_PADRAO_ID;
}

/** Definicao de um template pelo id (fallback para o padrao). */
export function templatePorId(id: string): TemplateDefinition {
  return TEMPLATES[id] ?? TEMPLATES[TEMPLATE_PADRAO_ID];
}

/**
 * Templates oferecidos no seletor de uma ocasiao (exclui os legados),
 * disponiveis primeiro, "em breve" depois. Ocasiao desconhecida cai em casamento.
 */
export function templatesPorOcasiao(ocasiao: string): TemplateDefinition[] {
  const alvo = (["casamento", "quinze-anos", "aniversario"].includes(ocasiao)
    ? ocasiao
    : "casamento") as TemplateOccasion;
  return Object.values(TEMPLATES)
    .filter((t) => t.ocasiao === alvo && !t.legado)
    .sort((a, b) => Number(b.disponivel) - Number(a.disponivel));
}

/** Mapeia o `event.type` (enum) para a ocasiao do template. */
export function ocasiaoDoNicho(nicho: string): TemplateOccasion {
  switch (nicho) {
    case "CASAMENTO":
    case "BODAS":
      return "casamento";
    case "QUINZE_ANOS":
      return "quinze-anos";
    default:
      return "aniversario";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TAGS + FILTROS (galeria de modelos)
// ─────────────────────────────────────────────────────────────────────────────

/** Tags de estilo por template (para filtros e chips no card). */
const TAGS_POR_TEMPLATE: Record<string, TemplateTag[]> = {
  "casamento-classico-elegante": ["classico", "romantico", "elegante", "dourado"],
  "casamento-editorial-moderno": ["moderno", "editorial", "minimalista"],
  "casamento-noite-luxo": ["luxo", "moderno", "dourado", "noturno"],
  "quinze-anos-glamour-rose": ["glamour", "romantico", "elegante", "rose"],
  "quinze-anos-fashion-editorial": ["fashion", "editorial", "moderno"],
  "quinze-anos-princesa-delicado": ["romantico", "delicado", "floral"],
  "aniversario-adulto-elegante": ["moderno", "minimalista", "elegante", "neutro"],
  "aniversario-infantil-ludico": ["infantil", "divertido", "colorido"],
  "aniversario-tropical-festa": ["tropical", "vibrante", "festivo"],
};

/** Tags de um template (do campo `tags` ou do mapa). */
export function tagsDoTemplate(id: string): TemplateTag[] {
  return TEMPLATES[id]?.tags ?? TAGS_POR_TEMPLATE[id] ?? [];
}

/** Chips de filtro por estilo (label visivel -> tag interna). */
export const ESTILOS_FILTRO: { label: string; tag: TemplateTag }[] = [
  { label: "Clássico", tag: "classico" },
  { label: "Moderno", tag: "moderno" },
  { label: "Luxo", tag: "luxo" },
  { label: "Editorial", tag: "editorial" },
  { label: "Romântico", tag: "romantico" },
  { label: "Infantil", tag: "infantil" },
  { label: "Tropical", tag: "tropical" },
  { label: "Minimalista", tag: "minimalista" },
];

/**
 * Filtra os templates de uma ocasiao por estilo (tag) e/ou busca por nome.
 * Sempre exclui legados; disponiveis primeiro.
 */
export function templatesFiltrados(
  ocasiao: string,
  filtros?: { tag?: TemplateTag | null; busca?: string },
): TemplateDefinition[] {
  const tag = filtros?.tag ?? null;
  const busca = (filtros?.busca ?? "").trim().toLowerCase();
  return templatesPorOcasiao(ocasiao).filter((t) => {
    if (tag && !tagsDoTemplate(t.id).includes(tag)) return false;
    if (busca && !`${t.nome} ${t.descricao}`.toLowerCase().includes(busca)) return false;
    return true;
  });
}

/** Grupos de edicao (todos) na ordem do estudio de personalizacao. */
export const GRUPOS_EDICAO: TemplateEditableGroup[] = [
  "capa",
  "nomes-data",
  "fontes",
  "cores",
  "menu",
  "modulos",
  "conteudo",
  "css",
];

/** Grupos de edicao de um template (default = todos). */
export function gruposDoTemplate(id: string): TemplateEditableGroup[] {
  return TEMPLATES[id]?.editableGroups ?? GRUPOS_EDICAO;
}
