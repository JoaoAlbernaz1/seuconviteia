/**
 * Fontes do SITE DO EVENTO (todas as duplas de `lib/fontes.ts`), carregadas via
 * next/font/local num modulo unico — compartilhado pelo layout do site publico
 * (`app/%5Fsites/[sub]/layout.tsx`) e pelas paginas do editor (que renderizam os
 * cards de "Estilo das letras" e o preview com as fontes REAIS).
 *
 * Os arquivos vivem em `app/fonts/<familia>/` (subset `latin`, os MESMOS .woff2
 * que o Google serve) para o build nao depender do CDN do Google — quando eles
 * rotacionam os arquivos, `next/font/google` quebra o build inteiro com 404.
 * Licencas (SIL OFL) ao lado de cada familia, em `OFL.txt`.
 *
 * Cada fonte expoe uma variavel CSS estavel (`--font-*`) que os presets de
 * `lib/fontes.ts` referenciam. Aplicar `EVT_FONTS_CLASS` num wrapper deixa
 * TODAS as variaveis disponiveis; a dupla escolhida so decide quais sao usadas.
 */
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
export const cormorant = localFont({
  src: [
    { path: "./fonts/cormorant/cormorant-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/cormorant/cormorant-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/cormorant/cormorant-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/cormorant/cormorant-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/cormorant/cormorant-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/cormorant/cormorant-600-italic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});
export const jost = localFont({
  src: [
    { path: "./fonts/jost/jost-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/jost/jost-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/jost/jost-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-jost",
  display: "swap",
});

// ── Demais duplas (romantica / moderna / minimalista / festiva) ──────────────
export const dancing = localFont({
  src: [
    { path: "./fonts/dancingscript/dancingscript-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/dancingscript/dancingscript-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-dancing",
  display: "swap",
});
export const playfair = localFont({
  src: [
    { path: "./fonts/playfairdisplay/playfairdisplay-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/playfairdisplay/playfairdisplay-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/playfairdisplay/playfairdisplay-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/playfairdisplay/playfairdisplay-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/playfairdisplay/playfairdisplay-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/playfairdisplay/playfairdisplay-600-italic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-playfair",
  display: "swap",
});
export const marcellus = localFont({
  src: [
    { path: "./fonts/marcellus/marcellus-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-marcellus",
  display: "swap",
});
export const pacifico = localFont({
  src: [
    { path: "./fonts/pacifico/pacifico-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-pacifico",
  display: "swap",
});

// ── Fontes extras (mais opções + combinações personalizadas do Premium) ──────
export const greatVibes = localFont({
  src: [
    { path: "./fonts/greatvibes/greatvibes-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-greatvibes",
  display: "swap",
});
export const fraunces = localFont({
  src: [
    { path: "./fonts/fraunces/fraunces-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/fraunces/fraunces-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/fraunces/fraunces-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/fraunces/fraunces-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/fraunces/fraunces-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/fraunces/fraunces-600-italic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});
export const cinzel = localFont({
  src: [
    { path: "./fonts/cinzel/cinzel-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/cinzel/cinzel-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/cinzel/cinzel-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-cinzel",
  display: "swap",
});
export const ebGaramond = localFont({
  src: [
    { path: "./fonts/ebgaramond/ebgaramond-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ebgaramond/ebgaramond-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/ebgaramond/ebgaramond-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ebgaramond/ebgaramond-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/ebgaramond/ebgaramond-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ebgaramond/ebgaramond-600-italic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-ebgaramond",
  display: "swap",
});
export const montserrat = localFont({
  src: [
    { path: "./fonts/montserrat/montserrat-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/montserrat/montserrat-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/montserrat/montserrat-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-montserrat",
  display: "swap",
});

// ── Estilos NOVOS (mais opcoes p/ o cliente escolher) — `preload: false` porque
//    so carregam quando a dupla e escolhida (evita preload de fonte nao usada). ─
export const allura = localFont({
  src: [
    { path: "./fonts/allura/allura-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-allura",
  display: "swap",
  preload: false,
});
export const bodoni = localFont({
  src: [
    { path: "./fonts/bodonimoda/bodonimoda-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/bodonimoda/bodonimoda-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/bodonimoda/bodonimoda-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/bodonimoda/bodonimoda-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/bodonimoda/bodonimoda-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/bodonimoda/bodonimoda-600-italic.woff2", weight: "600", style: "italic" },
    { path: "./fonts/bodonimoda/bodonimoda-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/bodonimoda/bodonimoda-700-italic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-bodoni",
  display: "swap",
  preload: false,
});
export const parisienne = localFont({
  src: [
    { path: "./fonts/parisienne/parisienne-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-parisienne",
  display: "swap",
  preload: false,
});
export const sacramento = localFont({
  src: [
    { path: "./fonts/sacramento/sacramento-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-sacramento",
  display: "swap",
  preload: false,
});
export const lora = localFont({
  src: [
    { path: "./fonts/lora/lora-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/lora/lora-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/lora/lora-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/lora/lora-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/lora/lora-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/lora/lora-600-italic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-lora",
  display: "swap",
  preload: false,
});
export const cinzelDeco = localFont({
  src: [
    { path: "./fonts/cinzeldecorative/cinzeldecorative-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/cinzeldecorative/cinzeldecorative-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-cinzeldeco",
  display: "swap",
  preload: false,
});
export const yeseva = localFont({
  src: [
    { path: "./fonts/yesevaone/yesevaone-400.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-yeseva",
  display: "swap",
  preload: false,
});
export const tangerine = localFont({
  src: [
    { path: "./fonts/tangerine/tangerine-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/tangerine/tangerine-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-tangerine",
  display: "swap",
  preload: false,
});
export const josefin = localFont({
  src: [
    { path: "./fonts/josefinsans/josefinsans-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/josefinsans/josefinsans-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/josefinsans/josefinsans-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-josefin",
  display: "swap",
  preload: false,
});
export const poppins = localFont({
  src: [
    { path: "./fonts/poppins/poppins-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/poppins/poppins-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/poppins/poppins-600.woff2", weight: "600", style: "normal" },
  ],
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
