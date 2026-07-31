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

import { hexParaRgb } from "./cor";

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

/** Chave sentinela de "cor personalizada" (usa `temaCor` em vez de um preset). */
export const TEMA_CUSTOM = "custom";

// ── Cor personalizada: deriva a FAMÍLIA inteira `--ev-*` de UMA cor escolhida ──
// O cliente escolhe qualquer cor; derivamos uma paleta coerente por HSL (mesma
// matiz, variando saturação/luminosidade por papel), igual à estrutura dos presets.

/** [r,g,b] 0-255 -> [h(0-360), s(0-1), l(0-1)]. */
function rgbParaHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

/** [h(0-360), s(0-1), l(0-1)] -> "#rrggbb". */
function hslParaHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.min(1, Math.max(0, s));
  l = Math.min(1, Math.max(0, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Hex escolhido -> família completa `--ev-*` (coerente, mesma matiz). */
export function deriveTemaVars(hex: string): TemaVars {
  const [r, g, b] = hexParaRgb(hex);
  const [h, s0] = rgbParaHsl(r, g, b);
  const s = Math.min(0.75, Math.max(0.42, s0)); // evita cor "lavada" ou neon
  const rosa = hslParaHex(h, s, 0.62);
  const ink = hslParaHex(h, 0.28, 0.14);
  const [ir, ig, ib] = hexParaRgb(ink);
  const [rr, rg, rb] = hexParaRgb(rosa);
  return {
    "--ev-ink": ink,
    "--ev-ink-soft": hslParaHex(h, 0.2, 0.38),
    "--ev-rosa": rosa,
    "--ev-rosa-ink": hslParaHex(h, Math.min(0.85, s + 0.1), 0.4),
    "--ev-rose": hslParaHex(h, s * 0.85, 0.78),
    "--ev-blush": hslParaHex(h, s * 0.55, 0.88),
    "--ev-blush-soft": hslParaHex(h, s * 0.4, 0.96),
    "--ev-blush-section": hslParaHex(h, s * 0.45, 0.92),
    "--ev-framboesa": hslParaHex(h, Math.min(0.8, s + 0.05), 0.56),
    "--ev-framboesa-deep": hslParaHex(h, Math.min(0.85, s + 0.12), 0.4),
    "--ev-framboesa-bright": hslParaHex(h, s, 0.66),
    "--ev-ivory": hslParaHex(h, s * 0.22, 0.972),
    "--line": `rgba(${ir},${ig},${ib},0.10)`,
    "--line-rosa": `rgba(${rr},${rg},${rb},0.55)`,
  };
}

/** Lê a cor personalizada (`temaCor`, hex) de um customization; undefined se ausente/inválida. */
export function lerTemaCor(customization: unknown): string | undefined {
  if (customization && typeof customization === "object" && "temaCor" in customization) {
    const c = (customization as { temaCor?: unknown }).temaCor;
    if (typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c.trim())) return c.trim();
  }
  return undefined;
}

/**
 * Devolve o objeto de estilo inline com TODAS as variaveis do tema, pronto para
 * o `style={...}` do wrapper `.evt`. Cor personalizada (`tema="custom"` + hex) =
 * família derivada; senao cai para o preset, ou "rose" se desconhecido.
 */
export function varsDoTema(tema?: string | null, corCustom?: string | null): Record<string, string> {
  if (tema === TEMA_CUSTOM && corCustom) return { ...deriveTemaVars(corCustom) };
  const escolhido = (tema && TEMAS[tema]) || TEMAS[TEMA_PADRAO];
  return { ...escolhido.vars };
}

/** Hex do acento principal do tema (`--ev-rosa`) — usado p/ derivar particulas. */
export function acentoDoTema(tema?: string | null, corCustom?: string | null): string {
  if (tema === TEMA_CUSTOM && corCustom) return deriveTemaVars(corCustom)["--ev-rosa"];
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
    if (typeof t === "string" && (t === TEMA_CUSTOM || TEMAS[t])) return t;
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
