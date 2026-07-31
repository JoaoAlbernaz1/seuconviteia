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

  // ── DELICADA — cursiva fina (Great Vibes) + serifada variável (Fraunces) ────
  delicada: {
    key: "delicada",
    label: "Delicada",
    scriptScale: 0.95,
    vars: {
      "--ev-font-script": `var(--font-greatvibes), ${CURSIVE_FALLBACK}`,
      "--ev-font-display": `var(--font-fraunces), ${SERIF_FALLBACK}`,
      "--ev-font-body": `var(--font-ebgaramond), ${SERIF_FALLBACK}`,
      "--ev-font-util": `var(--font-jost), ${SANS_FALLBACK}`,
    },
  },

  // ── IMPERIAL — versal romana (Cinzel) + Garamond ───────────────────────────
  imperial: {
    key: "imperial",
    label: "Imperial",
    caps: true,
    scriptScale: 0.62,
    vars: {
      "--ev-font-script": `var(--font-cinzel), ${SERIF_FALLBACK}`,
      "--ev-font-display": `var(--font-cinzel), ${SERIF_FALLBACK}`,
      "--ev-font-body": `var(--font-ebgaramond), ${SERIF_FALLBACK}`,
      "--ev-font-util": `var(--font-montserrat), ${SANS_FALLBACK}`,
    },
  },

  // ── ENCANTADA — cursiva (Great Vibes) + Playfair + sans moderna ────────────
  encantada: {
    key: "encantada",
    label: "Encantada",
    scriptScale: 0.95,
    vars: {
      "--ev-font-script": `var(--font-greatvibes), ${CURSIVE_FALLBACK}`,
      "--ev-font-display": `var(--font-playfair), ${SERIF_FALLBACK}`,
      "--ev-font-body": `var(--font-montserrat), ${SANS_FALLBACK}`,
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

// ─────────────────────────────────────────────────────────────────────────────
// COMBINAR FONTES (Premium): o cliente escolhe uma "fonte principal" (dos nomes/
// títulos) e vê quais fontes de TEXTO combinam. Cada cabeça (`FonteHead`) define
// o par script+display; cada corpo (`FonteCorpo`) define body+util. `combina`
// lista os corpos recomendados para aquela cabeça.
// ─────────────────────────────────────────────────────────────────────────────

/** Cabeça = estilo dos NOMES/TÍTULOS (script + display). */
export type FonteHead = {
  key: string;
  label: string;
  script: string;
  display: string;
  caps?: boolean;
  scriptScale: number;
  /** Chaves de `FONTE_CORPOS` recomendadas para esta cabeça. */
  combina: string[];
};

/** Corpo = fonte dos TEXTOS (body + util). */
export type FonteCorpo = { key: string; label: string; body: string; util: string };

export const FONTE_HEADS: Record<string, FonteHead> = {
  classica: { key: "classica", label: "Clássica", script: `var(--font-milton), ${CURSIVE_FALLBACK}`, display: `var(--font-vogue), ${SERIF_FALLBACK}`, scriptScale: 1, combina: ["cormorant", "ebgaramond", "jost"] },
  romantica: { key: "romantica", label: "Romântica", script: `var(--font-dancing), ${CURSIVE_FALLBACK}`, display: `var(--font-playfair), ${SERIF_FALLBACK}`, scriptScale: 0.92, combina: ["cormorant", "ebgaramond", "montserrat"] },
  delicada: { key: "delicada", label: "Delicada", script: `var(--font-greatvibes), ${CURSIVE_FALLBACK}`, display: `var(--font-fraunces), ${SERIF_FALLBACK}`, scriptScale: 0.95, combina: ["ebgaramond", "cormorant", "montserrat"] },
  imperial: { key: "imperial", label: "Imperial", script: `var(--font-cinzel), ${SERIF_FALLBACK}`, display: `var(--font-cinzel), ${SERIF_FALLBACK}`, caps: true, scriptScale: 0.62, combina: ["ebgaramond", "montserrat", "cormorant"] },
  festiva: { key: "festiva", label: "Festiva", script: `var(--font-pacifico), ${CURSIVE_FALLBACK}`, display: `var(--font-jost), ${SANS_FALLBACK}`, scriptScale: 0.74, combina: ["jost", "montserrat"] },
  moderna: { key: "moderna", label: "Moderna", script: `var(--font-marcellus), ${SERIF_FALLBACK}`, display: `var(--font-marcellus), ${SERIF_FALLBACK}`, caps: true, scriptScale: 0.62, combina: ["jost", "montserrat", "ebgaramond"] },
  encantada: { key: "encantada", label: "Encantada", script: `var(--font-greatvibes), ${CURSIVE_FALLBACK}`, display: `var(--font-playfair), ${SERIF_FALLBACK}`, scriptScale: 0.95, combina: ["montserrat", "ebgaramond", "cormorant"] },
};

export const FONTE_CORPOS: Record<string, FonteCorpo> = {
  cormorant: { key: "cormorant", label: "Cormorant · serifada clássica", body: `var(--font-cormorant), ${SERIF_FALLBACK}`, util: `var(--font-jost), ${SANS_FALLBACK}` },
  ebgaramond: { key: "ebgaramond", label: "EB Garamond · serifada elegante", body: `var(--font-ebgaramond), ${SERIF_FALLBACK}`, util: `var(--font-jost), ${SANS_FALLBACK}` },
  jost: { key: "jost", label: "Jost · sem serifa limpa", body: `var(--font-jost), ${SANS_FALLBACK}`, util: `var(--font-jost), ${SANS_FALLBACK}` },
  montserrat: { key: "montserrat", label: "Montserrat · sem serifa moderna", body: `var(--font-montserrat), ${SANS_FALLBACK}`, util: `var(--font-montserrat), ${SANS_FALLBACK}` },
};

export type FontesCustom = { head: string; corpo: string };

/** Combinação custom válida? (as duas chaves existem nos catálogos). */
function customValido(c: FontesCustom | undefined): c is FontesCustom {
  return !!c && !!FONTE_HEADS[c.head] && !!FONTE_CORPOS[c.corpo];
}

/**
 * Variaveis da dupla — se houver combinação custom válida (Premium), usa a
 * cabeça (script+display) + o corpo (body+util) escolhidos; senão, o preset.
 */
export function varsDaFonteCombinada(
  key?: string | null,
  custom?: FontesCustom | null,
): Record<string, string> {
  if (customValido(custom ?? undefined)) {
    const h = FONTE_HEADS[custom!.head];
    const c = FONTE_CORPOS[custom!.corpo];
    return {
      "--ev-font-script": h.script,
      "--ev-font-display": h.display,
      "--ev-font-body": c.body,
      "--ev-font-util": c.util,
    };
  }
  return { ...fonteDupla(key).vars };
}

/** A tipografia (preset ou custom) é caixa-alta espaçada? (classe evt-fonte-caps). */
export function fonteCapsCombinada(key?: string | null, custom?: FontesCustom | null): boolean {
  if (customValido(custom ?? undefined)) return !!FONTE_HEADS[custom!.head].caps;
  return !!fonteDupla(key).caps;
}

/** Escala da script (preset ou custom) — para o tamanho dos cards do editor. */
export function fonteScriptScale(key?: string | null, custom?: FontesCustom | null): number {
  if (customValido(custom ?? undefined)) return FONTE_HEADS[custom!.head].scriptScale;
  return fonteDupla(key).scriptScale;
}

/** Le a combinação custom de um `customization` (Premium). undefined se ausente/inválida. */
export function lerFontesCustom(customization: unknown): FontesCustom | undefined {
  if (customization && typeof customization === "object" && "fontesCustom" in customization) {
    const fc = (customization as { fontesCustom?: unknown }).fontesCustom;
    if (fc && typeof fc === "object") {
      const head = (fc as { head?: unknown }).head;
      const corpo = (fc as { corpo?: unknown }).corpo;
      if (typeof head === "string" && typeof corpo === "string" && FONTE_HEADS[head] && FONTE_CORPOS[corpo]) {
        return { head, corpo };
      }
    }
  }
  return undefined;
}
