/**
 * Duplas de fontes do site de evento — espelha o desenho de `lib/temas.ts`:
 * presets CURADOS, trocaveis por evento via `customization.fontes`, aplicados
 * como variaveis de runtime (`--ev-font-*`) no wrapper `.evt`.
 *
 * O card do editor mostra o NOME REAL da fonte (decisao do Joao: melhor que
 * inventar nomes de estilo) + o nome do evento renderizado naquela fonte.
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
  /** Nome REAL da fonte (o do "nome" do convite), mostrado no card do editor. */
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
  /**
   * Fator de tamanho do NOME na CAPA do site (exposto como `--ev-capa-fator`),
   * calibrado por fonte para o nome caber bem no celular e no PC. 1 = base
   * (Milton, a festa original). Template novo: multiplicar o nome do hero
   * pela var e herda a calibração.
   */
  capaFator?: number;
  /**
   * Fator dos DEMAIS textos na fonte do evento (headings/assinaturas/etc.,
   * exposto como `--ev-fonte-fator`). Calibrado pelo pior caso medido (título
   * de seção no celular); versais espaçadas precisam de fator menor que o da
   * capa. Ausente = herda `capaFator`.
   */
  fonteFator?: number;
  /**
   * A fonte do slot SCRIPT (o nome na capa) tem peso forte publicado? So as
   * duplas marcadas aqui engrossam o nome quando a opcao "Letra em negrito" do
   * editor esta ligada — nas demais o Google so publica 400 e sintetizar peso
   * deixa o traco sujo (ver `app/evt-fonts.ts` para os pesos carregados).
   * Os outros slots (display/body/util) sempre tem 600 e nao dependem disto.
   */
  negritoNoNome?: boolean;
};

const CURSIVE_FALLBACK = '"Pinyon Script", cursive';
const SERIF_FALLBACK = '"Cormorant Garamond", Georgia, serif';
const SANS_FALLBACK = "ui-sans-serif, system-ui, sans-serif";

export const FONTES: Record<string, FonteDupla> = {
  // ── CLASSICA — a tipografia EXATA da festa original (default) ──────────────
  classica: {
    key: "classica",
    label: "Milton One",
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
    negritoNoNome: true,
    fonteFator: 0.8,
    capaFator: 0.88,
    label: "Dancing Script",
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
    fonteFator: 0.6,
    label: "Marcellus",
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
    negritoNoNome: true,
    fonteFator: 0.63,
    label: "Jost",
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
    fonteFator: 0.69,
    capaFator: 0.72,
    label: "Pacifico",
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
    capaFator: 0.85,
    label: "Great Vibes · Fraunces",
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
    negritoNoNome: true,
    fonteFator: 0.58,
    label: "Cinzel",
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
    capaFator: 0.85,
    label: "Great Vibes · Playfair",
    scriptScale: 0.95,
    vars: {
      "--ev-font-script": `var(--font-greatvibes), ${CURSIVE_FALLBACK}`,
      "--ev-font-display": `var(--font-playfair), ${SERIF_FALLBACK}`,
      "--ev-font-body": `var(--font-montserrat), ${SANS_FALLBACK}`,
      "--ev-font-util": `var(--font-jost), ${SANS_FALLBACK}`,
    },
  },

  // ── GLAMOUR — cursiva fluida + serifada Didone de alto contraste ────────────
  glamour: {
    key: "glamour",
    capaFator: 0.83,
    label: "Allura",
    scriptScale: 1,
    vars: {
      "--ev-font-script": `var(--font-allura), ${CURSIVE_FALLBACK}`,
      "--ev-font-display": `var(--font-bodoni), ${SERIF_FALLBACK}`,
      "--ev-font-body": `var(--font-montserrat), ${SANS_FALLBACK}`,
      "--ev-font-util": `var(--font-montserrat), ${SANS_FALLBACK}`,
    },
  },

  // ── VINTAGE — cursiva romantica + Cormorant + Garamond ──────────────────────
  vintage: {
    key: "vintage",
    fonteFator: 0.76,
    capaFator: 0.8,
    label: "Parisienne",
    scriptScale: 0.92,
    vars: {
      "--ev-font-script": `var(--font-parisienne), ${CURSIVE_FALLBACK}`,
      "--ev-font-display": `var(--font-cormorant), ${SERIF_FALLBACK}`,
      "--ev-font-body": `var(--font-ebgaramond), ${SERIF_FALLBACK}`,
      "--ev-font-util": `var(--font-jost), ${SANS_FALLBACK}`,
    },
  },

  // ── SUAVE — cursiva fina monolinha + serifadas leves ────────────────────────
  suave: {
    key: "suave",
    capaFator: 0.81,
    label: "Sacramento",
    scriptScale: 1,
    vars: {
      "--ev-font-script": `var(--font-sacramento), ${CURSIVE_FALLBACK}`,
      "--ev-font-display": `var(--font-cormorant), ${SERIF_FALLBACK}`,
      "--ev-font-body": `var(--font-lora), ${SERIF_FALLBACK}`,
      "--ev-font-util": `var(--font-jost), ${SANS_FALLBACK}`,
    },
  },

  // ── REALEZA — versal romana ornamentada (Cinzel Decorative) + Garamond ───────
  realeza: {
    key: "realeza",
    negritoNoNome: true,
    fonteFator: 0.57,
    label: "Cinzel Decorative",
    caps: true,
    scriptScale: 0.55,
    vars: {
      "--ev-font-script": `var(--font-cinzeldeco), ${SERIF_FALLBACK}`,
      "--ev-font-display": `var(--font-cinzeldeco), ${SERIF_FALLBACK}`,
      "--ev-font-body": `var(--font-ebgaramond), ${SERIF_FALLBACK}`,
      "--ev-font-util": `var(--font-josefin), ${SANS_FALLBACK}`,
    },
  },

  // ── EDITORIAL — display serifada marcante (Yeseva One) + Lora ───────────────
  editorial: {
    key: "editorial",
    fonteFator: 0.57,
    capaFator: 0.66,
    label: "Yeseva One",
    scriptScale: 0.7,
    vars: {
      "--ev-font-script": `var(--font-yeseva), ${SERIF_FALLBACK}`,
      "--ev-font-display": `var(--font-yeseva), ${SERIF_FALLBACK}`,
      "--ev-font-body": `var(--font-lora), ${SERIF_FALLBACK}`,
      "--ev-font-util": `var(--font-josefin), ${SANS_FALLBACK}`,
    },
  },

  // ── FINA — cursiva finissima (Tangerine) + Playfair ─────────────────────────
  fina: {
    key: "fina",
    negritoNoNome: true,
    fonteFator: 0.86,
    label: "Tangerine",
    scriptScale: 1.2,
    vars: {
      "--ev-font-script": `var(--font-tangerine), ${CURSIVE_FALLBACK}`,
      "--ev-font-display": `var(--font-playfair), ${SERIF_FALLBACK}`,
      "--ev-font-body": `var(--font-ebgaramond), ${SERIF_FALLBACK}`,
      "--ev-font-util": `var(--font-jost), ${SANS_FALLBACK}`,
    },
  },

  // ── URBANA — versal sans geometrica (Josefin) + Poppins ─────────────────────
  urbana: {
    key: "urbana",
    negritoNoNome: true,
    fonteFator: 0.58,
    label: "Josefin Sans",
    caps: true,
    scriptScale: 0.6,
    vars: {
      "--ev-font-script": `var(--font-josefin), ${SANS_FALLBACK}`,
      "--ev-font-display": `var(--font-josefin), ${SANS_FALLBACK}`,
      "--ev-font-body": `var(--font-poppins), ${SANS_FALLBACK}`,
      "--ev-font-util": `var(--font-poppins), ${SANS_FALLBACK}`,
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
  const d = fonteDupla(key);
  return {
    ...d.vars,
    "--ev-capa-fator": String(d.capaFator ?? 1),
    "--ev-fonte-fator": String(d.fonteFator ?? d.capaFator ?? 1),
  };
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
  /** Mesma regra de `FonteDupla.negritoNoNome` — a script tem peso forte? */
  negritoNoNome?: boolean;
  /** Chaves de `FONTE_CORPOS` recomendadas para esta cabeça. */
  combina: string[];
};

/** Corpo = fonte dos TEXTOS (body + util). */
export type FonteCorpo = { key: string; label: string; body: string; util: string };

export const FONTE_HEADS: Record<string, FonteHead> = {
  classica: { key: "classica", label: "Milton One", script: `var(--font-milton), ${CURSIVE_FALLBACK}`, display: `var(--font-vogue), ${SERIF_FALLBACK}`, scriptScale: 1, combina: ["cormorant", "ebgaramond", "jost"] },
  romantica: { key: "romantica", negritoNoNome: true, label: "Dancing Script", script: `var(--font-dancing), ${CURSIVE_FALLBACK}`, display: `var(--font-playfair), ${SERIF_FALLBACK}`, scriptScale: 0.92, combina: ["cormorant", "ebgaramond", "montserrat"] },
  delicada: { key: "delicada", label: "Great Vibes · Fraunces", script: `var(--font-greatvibes), ${CURSIVE_FALLBACK}`, display: `var(--font-fraunces), ${SERIF_FALLBACK}`, scriptScale: 0.95, combina: ["ebgaramond", "cormorant", "montserrat"] },
  imperial: { key: "imperial", negritoNoNome: true, label: "Cinzel", script: `var(--font-cinzel), ${SERIF_FALLBACK}`, display: `var(--font-cinzel), ${SERIF_FALLBACK}`, caps: true, scriptScale: 0.62, combina: ["ebgaramond", "montserrat", "cormorant"] },
  festiva: { key: "festiva", label: "Pacifico", script: `var(--font-pacifico), ${CURSIVE_FALLBACK}`, display: `var(--font-jost), ${SANS_FALLBACK}`, scriptScale: 0.74, combina: ["jost", "montserrat"] },
  moderna: { key: "moderna", label: "Marcellus", script: `var(--font-marcellus), ${SERIF_FALLBACK}`, display: `var(--font-marcellus), ${SERIF_FALLBACK}`, caps: true, scriptScale: 0.62, combina: ["jost", "montserrat", "ebgaramond"] },
  encantada: { key: "encantada", label: "Great Vibes · Playfair", script: `var(--font-greatvibes), ${CURSIVE_FALLBACK}`, display: `var(--font-playfair), ${SERIF_FALLBACK}`, scriptScale: 0.95, combina: ["montserrat", "ebgaramond", "cormorant"] },
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

// ─────────────────────────────────────────────────────────────────────────────
// TAMANHO DOS TEXTOS — a opcao "Tamanho dos textos" do editor. Multiplica os
// fatores calibrados por fonte (capa e demais textos). Sem isto o seletor nao
// mudava nada no convite (reclamacao do Joao, 17/08).
// ─────────────────────────────────────────────────────────────────────────────

export type TamanhoTexto = "pequeno" | "medio" | "grande";

/** Multiplicadores por tamanho: capa (nome/idade) e demais textos do convite. */
export const FATOR_TAMANHO: Record<TamanhoTexto, { capa: number; texto: number }> = {
  pequeno: { capa: 0.82, texto: 0.9 },
  medio: { capa: 1, texto: 1 },
  grande: { capa: 1.22, texto: 1.12 },
};

/** Escala do lockup da capa (`capaEscala` do customization) para cada tamanho. */
export const ESCALA_CAPA: Record<TamanhoTexto, number> = { pequeno: 0.85, medio: 1, grande: 1.18 };

/** Chave do editor ("small"/"medium"/"large") -> tamanho interno. */
export function tamanhoDaChave(chave?: string | null): TamanhoTexto {
  if (chave === "small" || chave === "pequeno") return "pequeno";
  if (chave === "large" || chave === "grande") return "grande";
  return "medio";
}

/** Le o tamanho dos textos de um `customization` (JSON do evento). */
export function lerTamanhoTexto(customization: unknown): TamanhoTexto {
  if (customization && typeof customization === "object" && "tamanhoTexto" in customization) {
    return tamanhoDaChave((customization as { tamanhoTexto?: unknown }).tamanhoTexto as string);
  }
  return "medio";
}

/**
 * Variaveis da dupla — se houver combinação custom válida (Premium), usa a
 * cabeça (script+display) + o corpo (body+util) escolhidos; senão, o preset.
 *
 * `tamanho` multiplica os fatores calibrados: e o que faz a opcao "Tamanho dos
 * textos" mudar a letra de verdade, na previa e no site publicado.
 */
export function varsDaFonteCombinada(
  key?: string | null,
  custom?: FontesCustom | null,
  tamanho: TamanhoTexto = "medio",
): Record<string, string> {
  const fator = FATOR_TAMANHO[tamanho] ?? FATOR_TAMANHO.medio;
  if (customValido(custom ?? undefined)) {
    const h = FONTE_HEADS[custom!.head];
    const c = FONTE_CORPOS[custom!.corpo];
    const dh = fonteDupla(custom!.head);
    return {
      "--ev-font-script": h.script,
      "--ev-font-display": h.display,
      "--ev-font-body": c.body,
      "--ev-font-util": c.util,
      "--ev-capa-fator": String((dh.capaFator ?? 1) * fator.capa),
      "--ev-fonte-fator": String((dh.fonteFator ?? dh.capaFator ?? 1) * fator.texto),
    };
  }
  const d = fonteDupla(key);
  return {
    ...d.vars,
    "--ev-capa-fator": String((d.capaFator ?? 1) * fator.capa),
    "--ev-fonte-fator": String((d.fonteFator ?? d.capaFator ?? 1) * fator.texto),
  };
}

/** A tipografia (preset ou custom) é caixa-alta espaçada? (classe evt-fonte-caps). */
export function fonteCapsCombinada(key?: string | null, custom?: FontesCustom | null): boolean {
  if (customValido(custom ?? undefined)) return !!FONTE_HEADS[custom!.head].caps;
  return !!fonteDupla(key).caps;
}

/**
 * A letra do NOME na capa aceita negrito? (classe `evt-negrito-nome`). Falso nas
 * manuscritas de peso único — nelas a opção "Letra em negrito" continua valendo
 * para títulos e textos, e o editor avisa que o nome não engrossa.
 */
export function fonteTemNegritoNoNome(key?: string | null, custom?: FontesCustom | null): boolean {
  if (customValido(custom ?? undefined)) return !!FONTE_HEADS[custom!.head].negritoNoNome;
  return !!fonteDupla(key).negritoNoNome;
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
