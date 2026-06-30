/**
 * Temas (presets de cor) do site de evento "festa" — portado do
 * festa-15-maria-clara, que era hardcoded em ROSA. Aqui a familia rosa vira
 * uma de varias paletas coerentes, trocaveis por evento.
 *
 * Como funciona: o `app/globals.css` mapeia tokens Tailwind namespaced `evt-`
 * para variaveis de runtime `--ev-*` via `@theme inline`. Setando os `--ev-*`
 * (+ `--line`/`--line-rosa`) num wrapper `.evt` re-tinge TODO o site. Cada preset
 * abaixo fornece a familia completa.
 *
 * Regras das paletas:
 *  - ink / ink-soft / ivory: neutro-quente (estrutura/texto/fundo) — pouca variacao.
 *  - acento (rosa / rosa-ink / rose / blush* / framboesa*): varia harmonicamente.
 *  - O preset "rose" tem os valores EXATOS do festa original.
 */

/** Conjunto completo de variaveis de runtime de um tema. */
export type TemaVars = {
  "--ev-ink": string;
  "--ev-ink-soft": string;
  "--ev-rosa": string;
  "--ev-rosa-ink": string;
  "--ev-rose": string;
  "--ev-blush": string;
  "--ev-blush-soft": string;
  "--ev-blush-section": string;
  "--ev-framboesa": string;
  "--ev-framboesa-deep": string;
  "--ev-framboesa-bright": string;
  "--ev-ivory": string;
  "--line": string;
  "--line-rosa": string;
};

export type Tema = {
  /** Chave estavel (vai no `customization.tema`). */
  key: string;
  /** Rotulo amigavel (UI futura de escolha de tema). */
  label: string;
  vars: TemaVars;
};

export const TEMAS: Record<string, Tema> = {
  // ── ROSE — valores EXATOS do festa original (default) ──────────────────────
  rose: {
    key: "rose",
    label: "Rosé",
    vars: {
      "--ev-ink": "#2E1A20",
      "--ev-ink-soft": "#6B4A54",
      "--ev-rosa": "#E86FA6",
      "--ev-rosa-ink": "#B83D6B",
      "--ev-rose": "#F4A7B9",
      "--ev-blush": "#FADADD",
      "--ev-blush-soft": "#FCEFEF",
      "--ev-blush-section": "#F6E4DF",
      "--ev-framboesa": "#CE578B",
      "--ev-framboesa-deep": "#B83D6B",
      "--ev-framboesa-bright": "#D06A95",
      "--ev-ivory": "#FBF6F2",
      "--line": "rgba(46,26,32,0.10)",
      "--line-rosa": "rgba(232,111,166,0.55)",
    },
  },

  // ── DOURADO — champagne / ouro ─────────────────────────────────────────────
  dourado: {
    key: "dourado",
    label: "Dourado",
    vars: {
      "--ev-ink": "#2A2520",
      "--ev-ink-soft": "#6B5E4A",
      "--ev-rosa": "#C9A24B",
      "--ev-rosa-ink": "#8A6A1F",
      "--ev-rose": "#E4CC8F",
      "--ev-blush": "#F5EBD2",
      "--ev-blush-soft": "#FBF5E6",
      "--ev-blush-section": "#F1E6CC",
      "--ev-framboesa": "#C19A3E",
      "--ev-framboesa-deep": "#8A6A1F",
      "--ev-framboesa-bright": "#D4B468",
      "--ev-ivory": "#FCF8F0",
      "--line": "rgba(42,37,32,0.10)",
      "--line-rosa": "rgba(201,162,75,0.55)",
    },
  },

  // ── AZUL — serenity / azul sereno ──────────────────────────────────────────
  azul: {
    key: "azul",
    label: "Azul Sereno",
    vars: {
      "--ev-ink": "#1E2530",
      "--ev-ink-soft": "#4F5A6B",
      "--ev-rosa": "#6E97C9",
      "--ev-rosa-ink": "#345785",
      "--ev-rose": "#A9C2E0",
      "--ev-blush": "#DCE7F2",
      "--ev-blush-soft": "#EEF3F9",
      "--ev-blush-section": "#DCE6F0",
      "--ev-framboesa": "#5B86B8",
      "--ev-framboesa-deep": "#345785",
      "--ev-framboesa-bright": "#7AA0CB",
      "--ev-ivory": "#F4F7FB",
      "--line": "rgba(30,37,48,0.10)",
      "--line-rosa": "rgba(110,151,201,0.55)",
    },
  },

  // ── LAVANDA — violeta suave ────────────────────────────────────────────────
  lavanda: {
    key: "lavanda",
    label: "Lavanda",
    vars: {
      "--ev-ink": "#29222E",
      "--ev-ink-soft": "#5E5168",
      "--ev-rosa": "#A98BD0",
      "--ev-rosa-ink": "#674A95",
      "--ev-rose": "#CBB6E6",
      "--ev-blush": "#E7DDF3",
      "--ev-blush-soft": "#F4EFFA",
      "--ev-blush-section": "#E6DCF1",
      "--ev-framboesa": "#8E6DBE",
      "--ev-framboesa-deep": "#674A95",
      "--ev-framboesa-bright": "#A07FCB",
      "--ev-ivory": "#F8F5FC",
      "--line": "rgba(41,34,46,0.10)",
      "--line-rosa": "rgba(169,139,208,0.55)",
    },
  },

  // ── VERDE — sage / oliva ───────────────────────────────────────────────────
  verde: {
    key: "verde",
    label: "Verde Sálvia",
    vars: {
      "--ev-ink": "#22271F",
      "--ev-ink-soft": "#525C49",
      "--ev-rosa": "#7B9B6E",
      "--ev-rosa-ink": "#48643B",
      "--ev-rose": "#B3C9A6",
      "--ev-blush": "#DCE7D4",
      "--ev-blush-soft": "#EEF3EA",
      "--ev-blush-section": "#DDE6D5",
      "--ev-framboesa": "#6B8B5E",
      "--ev-framboesa-deep": "#48643B",
      "--ev-framboesa-bright": "#87A579",
      "--ev-ivory": "#F5F8F2",
      "--line": "rgba(34,39,31,0.10)",
      "--line-rosa": "rgba(123,155,110,0.55)",
    },
  },

  // ── TERRACOTA — terra / argila quente ──────────────────────────────────────
  terracota: {
    key: "terracota",
    label: "Terracota",
    vars: {
      "--ev-ink": "#2E2019",
      "--ev-ink-soft": "#6B5145",
      "--ev-rosa": "#C97B57",
      "--ev-rosa-ink": "#974A2A",
      "--ev-rose": "#E5B19A",
      "--ev-blush": "#F5DDD0",
      "--ev-blush-soft": "#FBEFE8",
      "--ev-blush-section": "#F1DDD0",
      "--ev-framboesa": "#C0663F",
      "--ev-framboesa-deep": "#974A2A",
      "--ev-framboesa-bright": "#D08763",
      "--ev-ivory": "#FBF5F0",
      "--line": "rgba(46,32,25,0.10)",
      "--line-rosa": "rgba(201,123,87,0.55)",
    },
  },
};

/** Tema padrao quando a chave nao existe / nao foi setada. */
export const TEMA_PADRAO = "rose";

/**
 * Devolve o objeto de estilo inline com TODAS as variaveis do tema, pronto para
 * o `style={...}` do wrapper `.evt`. Cai para "rose" se a chave for desconhecida.
 */
export function varsDoTema(tema?: string | null): Record<string, string> {
  const escolhido = (tema && TEMAS[tema]) || TEMAS[TEMA_PADRAO];
  return { ...escolhido.vars };
}

/** Hex do acento principal do tema (`--ev-rosa`) — usado p/ derivar particulas. */
export function acentoDoTema(tema?: string | null): string {
  const escolhido = (tema && TEMAS[tema]) || TEMAS[TEMA_PADRAO];
  return escolhido.vars["--ev-rosa"];
}

/**
 * Le a chave do tema de um `customization` (JSON do evento). Cai para o padrao
 * se ausente/desconhecida. Reusado pelo painel (banners) e pelo editor.
 */
export function lerTemaKey(customization: unknown): string {
  if (customization && typeof customization === "object" && "tema" in customization) {
    const t = (customization as { tema?: unknown }).tema;
    if (typeof t === "string" && TEMAS[t]) return t;
  }
  return TEMA_PADRAO;
}

/**
 * Gradiente de "banner" (capa em miniatura) derivado da paleta do evento — usado
 * nos cards do painel e no preview. Vai do tom profundo ao claro do acento.
 */
export function gradienteDoTema(tema?: string | null): string {
  const t = (tema && TEMAS[tema]) || TEMAS[TEMA_PADRAO];
  return `linear-gradient(135deg, ${t.vars["--ev-framboesa-deep"]} 0%, ${t.vars["--ev-rosa"]} 58%, ${t.vars["--ev-framboesa-bright"]} 100%)`;
}

/** Uma paleta no seletor visual do form (`{ key, label, dots }`). */
export type PaletaSeletor = { key: string; label: string; dots: string[] };

/**
 * Monta as opcoes de paleta para o seletor do form (criar/editar). Cada swatch
 * leva 4 cores (forte -> clara) + o ink. Reusado pelas duas paginas do painel.
 */
export function paletasSeletor(): PaletaSeletor[] {
  return Object.values(TEMAS).map((t) => ({
    key: t.key,
    label: t.label,
    dots: [
      t.vars["--ev-framboesa"],
      t.vars["--ev-rosa"],
      t.vars["--ev-blush"],
      t.vars["--ev-ink"],
    ],
  }));
}
