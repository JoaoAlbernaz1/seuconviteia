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
  Great_Vibes,
  Fraunces,
  Cinzel,
  EB_Garamond,
  Montserrat,
  Allura,
  Bodoni_Moda,
  Parisienne,
  Sacramento,
  Lora,
  Cinzel_Decorative,
  Yeseva_One,
  Tangerine,
  Josefin_Sans,
  Poppins,
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

// ── Fontes extras (mais opções + combinações personalizadas do Premium) ──────
export const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-greatvibes",
  display: "swap",
});
export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});
export const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cinzel",
  display: "swap",
});
export const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-ebgaramond",
  display: "swap",
});
export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-montserrat",
  display: "swap",
});

// ── Estilos NOVOS (mais opcoes p/ o cliente escolher) — `preload: false` porque
//    so carregam quando a dupla e escolhida (evita preload de fonte nao usada). ─
export const allura = Allura({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-allura",
  display: "swap",
  preload: false,
});
export const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-bodoni",
  display: "swap",
  preload: false,
});
export const parisienne = Parisienne({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-parisienne",
  display: "swap",
  preload: false,
});
export const sacramento = Sacramento({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sacramento",
  display: "swap",
  preload: false,
});
export const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
  preload: false,
});
export const cinzelDeco = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-cinzeldeco",
  display: "swap",
  preload: false,
});
export const yeseva = Yeseva_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-yeseva",
  display: "swap",
  preload: false,
});
export const tangerine = Tangerine({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-tangerine",
  display: "swap",
  preload: false,
});
export const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-josefin",
  display: "swap",
  preload: false,
});
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
  preload: false,
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
  greatVibes.variable,
  fraunces.variable,
  cinzel.variable,
  ebGaramond.variable,
  montserrat.variable,
  allura.variable,
  bodoni.variable,
  parisienne.variable,
  sacramento.variable,
  lora.variable,
  cinzelDeco.variable,
  yeseva.variable,
  tangerine.variable,
  josefin.variable,
  poppins.variable,
].join(" ");
