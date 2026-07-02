/**
 * Fontes do SITE DO EVENTO (todas as duplas de `lib/fontes.ts`), carregadas via
 * next/font num modulo unico — compartilhado pelo layout do site publico
 * (`app/%5Fsites/[sub]/layout.tsx`) e pelas paginas do editor (que renderizam os
 * cards de "Estilo das letras" e o preview com as fontes REAIS).
 *
 * Cada fonte expoe uma variavel CSS estavel (`--font-*`) que os presets de
 * `lib/fontes.ts` referenciam. Aplicar `EVT_FONTS_CLASS` num wrapper deixa
 * TODAS as variaveis disponiveis; a dupla escolhida so decide quais sao usadas.
 */
import {
  Cormorant,
  Dancing_Script,
  Jost,
  Marcellus,
  Pacifico,
  Playfair_Display,
} from "next/font/google";
import localFont from "next/font/local";

// ── Dupla "classica" (a tipografia exata da festa) ───────────────────────────
export const milton = localFont({
  src: "./fonts/MiltonOneBold.otf",
  variable: "--font-milton",
  display: "swap",
});
export const vogue = localFont({
  src: "./fonts/ClassyVogueRegular.ttf",
  variable: "--font-vogue",
  display: "swap",
});
export const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});
export const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jost",
  display: "swap",
});

// ── Demais duplas (romantica / moderna / minimalista / festiva) ──────────────
export const dancing = Dancing_Script({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-dancing",
  display: "swap",
});
export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});
export const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marcellus",
  display: "swap",
});
export const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pacifico",
  display: "swap",
});

/** Classe unica com TODAS as variaveis de fonte do site do evento. */
export const EVT_FONTS_CLASS = [
  milton.variable,
  vogue.variable,
  cormorant.variable,
  jost.variable,
  dancing.variable,
  playfair.variable,
  marcellus.variable,
  pacifico.variable,
].join(" ");
