/**
 * Duplas de fontes do site de evento — espelha o desenho de `lib/temas.ts`:
 * presets CURADOS, trocaveis por evento via `customization.fontes`, aplicados
 * como variaveis de runtime (`--ev-font-*`) no wrapper `.evt`.
 *
 * Regra de ouro (brief do editor): o cliente NUNCA ve nome tecnico de fonte —
 * cada dupla tem um NOME DE ESTILO ("Classica", "Romantica"...) e o card do
 * editor mostra o nome do evento renderizado naquela dupla.
 *
 * A dupla "classica" e EXATAMENTE a tipografia da festa original (Milton One +
 * Classy Vogue + Cormorant + Jost) — e o padrao, entao eventos existentes nao
 * mudam nada. As demais usam Google Fonts carregadas em `app/evt-fonts.ts`.
 *
 * PURO: este modulo so descreve os presets (strings de CSS). O carregamento
 * real das fontes (next/font) fica em `app/evt-fonts.ts`.
 */

/** Conjunto de variaveis de runtime de uma dupla (slots do site). */
export type FonteVars = {
  /** Nome do evento na capa / assinaturas cursivas. */
  "--ev-font-script": string;
  /** Display serifada ("15 ANOS", titulos grandes, drop-cap). */
  "--ev-font-display": string;
  /** Corpo de texto. */
  "--ev-font-body": string;
  /** Utility (eyebrows, botoes, navegacao). */
  "--ev-font-util": string;
};

export type FonteDupla = {
  /** Chave estavel (vai no `customization.fontes`). */
  key: string;
  /** Nome de estilo mostrado ao cliente (nunca o nome tecnico da fonte). */
  label: string;
  vars: FonteVars;
  /**
   * A "script" e caixa-alta com tracking (estilos sem cursiva)? O wrapper `.evt`
   * ganha a classe `evt-fonte-caps` e o nome na capa vira VERSAL espacada.
   */
  caps?: boolean;
  /**
   * Escala do tamanho da fonte script nos CARDS/PREVIEW do editor (cursivas
   * ocupam mais caixa que versais — 1 = tamanho cheio).
   */
  scriptScale: number;
};

const CURSIVE_FALLBACK = '"Pinyon Script", cursive';
const SERIF_FALLBACK = '"Cormorant Garamond", Georgia, serif';
const SANS_FALLBACK = "ui-sans-serif, system-ui, sans-serif";

export const FONTES: Record<string, FonteDupla> = {
  // ── CLASSICA — a tipografia EXATA da festa original (default) ──────────────
  classica: {
    key: "classica",
    label: "Clássica",
    scriptScale: 1,
    vars: {
      "--ev-font-script": `var(--font-milton), ${CURSIVE_FALLBACK}`,
      "--ev-font-display": `var(--font-vogue), ${SERIF_FALLBACK}`,
      "--ev-font-body": `var(--font-cormorant), ${SERIF_FALLBACK}`,
      "--ev-font-util": `var(--font-jost), ${SANS_FALLBACK}`,
    },
  },

  // ── ROMANTICA — cursiva fluida + serifada editorial ────────────────────────
  romantica: {
    key: "romantica",
    label: "Romântica",
    scriptScale: 0.92,
    vars: {
      "--ev-font-script": `var(--font-dancing), ${CURSIVE_FALLBACK}`,
      "--ev-font-display": `var(--font-playfair), ${SERIF_FALLBACK}`,
      "--ev-font-body": `var(--font-playfair), ${SERIF_FALLBACK}`,
      "--ev-font-util": `var(--font-jost), ${SANS_FALLBACK}`,
    },
  },

  // ── MODERNA — versal serifada espacada + sans limpa ────────────────────────
  moderna: {
    key: "moderna",
    label: "Moderna",
    caps: true,
    scriptScale: 0.62,
    vars: {
      "--ev-font-script": `var(--font-marcellus), ${SERIF_FALLBACK}`,
      "--ev-font-display": `var(--font-marcellus), ${SERIF_FALLBACK}`,
      "--ev-font-body": `var(--font-jost), ${SANS_FALLBACK}`,
      "--ev-font-util": `var(--font-jost), ${SANS_FALLBACK}`,
    },
  },

  // ── MINIMALISTA — so sans, quase tipografico ───────────────────────────────
  minimalista: {
    key: "minimalista",
    label: "Minimalista",
    caps: true,
    scriptScale: 0.52,
    vars: {
      "--ev-font-script": `var(--font-jost), ${SANS_FALLBACK}`,
      "--ev-font-display": `var(--font-jost), ${SANS_FALLBACK}`,
      "--ev-font-body": `var(--font-jost), ${SANS_FALLBACK}`,
      "--ev-font-util": `var(--font-jost), ${SANS_FALLBACK}`,
    },
  },

  // ── FESTIVA — cursiva cheia de energia + sans ──────────────────────────────
  festiva: {
    key: "festiva",
    label: "Festiva",
    scriptScale: 0.74,
    vars: {
      "--ev-font-script": `var(--font-pacifico), ${CURSIVE_FALLBACK}`,
      "--ev-font-display": `var(--font-jost), ${SANS_FALLBACK}`,
      "--ev-font-body": `var(--font-jost), ${SANS_FALLBACK}`,
      "--ev-font-util": `var(--font-jost), ${SANS_FALLBACK}`,
    },
  },
};

/** Dupla padrao (a da festa) quando a chave nao existe / nao foi setada. */
export const FONTE_PADRAO = "classica";

/** Chaves validas (para a validacao do form na action). */
export const FONTE_KEYS = Object.keys(FONTES);

/** Dupla pela chave, caindo para a padrao se desconhecida. */
export function fonteDupla(key?: string | null): FonteDupla {
  return (key && FONTES[key]) || FONTES[FONTE_PADRAO];
}

/**
 * Variaveis de runtime da dupla, prontas para o `style={...}` do wrapper `.evt`
 * (mesmo padrao de `varsDoTema`).
 */
export function varsDaFonte(key?: string | null): Record<string, string> {
  return { ...fonteDupla(key).vars };
}

/**
 * Le a chave da dupla de um `customization` (JSON do evento). Cai para a padrao
 * se ausente/desconhecida. Reusado pelo layout do site e pelo editor.
 */
export function lerFonteKey(customization: unknown): string {
  if (customization && typeof customization === "object" && "fontes" in customization) {
    const f = (customization as { fontes?: unknown }).fontes;
    if (typeof f === "string" && FONTES[f]) return f;
  }
  return FONTE_PADRAO;
}
