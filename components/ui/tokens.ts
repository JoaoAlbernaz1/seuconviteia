// Tokens visuais do design system (claro/premium) — espelham os CSS vars/utilities
// definidos em app/globals.css (bloco "DESIGN SYSTEM do PAINEL/SaaS").
//
// Nas telas, PREFIRA os componentes de components/ui/* e as utilities Tailwind
// (bg-ui-surface, text-ui-ink, border-ui-line, rounded-ui-lg, .ui-shadow…) em vez
// de repetir classes. Este arquivo é só referência/constantes p/ uso em JS.

/** Cores (utilities Tailwind geradas: bg-ui-*, text-ui-*, border-ui-*). */
export const UI_CORES = {
  bg: "#faf7f1", // off-white quente (fundo base)
  bgWarm: "#f2eadf", // bege claro (seções)
  surface: "#ffffff", // card
  surface2: "#fbf6ee", // champagne clara (card secundário)
  ink: "#2b2926", // grafite (texto forte)
  inkSoft: "#6e6860", // texto secundário
  inkFaint: "#a69e93", // sutil / placeholder
  line: "rgba(43,41,38,0.10)", // borda suave
  lineStrong: "rgba(43,41,38,0.18)",
  rose: "#c77e88", // acento rosé
  roseInk: "#a85562", // rosé profundo (texto/hover)
  roseSoft: "#f5e7e8", // wash rosé
  champagne: "#c9b08a", // acento champagne/ouro
  champagneSoft: "#f3ead8",
  danger: "#be4b3b",
  dangerSoft: "#f7e4e0",
  success: "#5b8768",
  successSoft: "#e7efe9",
} as const;

/** Raios (utilities: rounded-ui-sm | rounded-ui | rounded-ui-lg | rounded-ui-xl). */
export const UI_RADIUS = { sm: "10px", md: "14px", lg: "20px", xl: "28px" } as const;

/** Sombras (classes: .ui-shadow-sm | .ui-shadow | .ui-shadow-lg | .ui-shadow-rose). */
export const UI_SHADOW = {
  sm: "ui-shadow-sm",
  md: "ui-shadow",
  lg: "ui-shadow-lg",
  rose: "ui-shadow-rose",
} as const;

/** Escala de espaçamento sugerida (respiro generoso). */
export const UI_SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40, "2xl": 64 } as const;

/** Foco acessível: aplicar a classe utilitária `.ui-ring` (anel rosé no focus-visible). */
export const UI_FOCUS_CLASS = "ui-ring";
