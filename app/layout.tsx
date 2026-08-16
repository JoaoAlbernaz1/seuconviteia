import type { Metadata } from "next";
import localFont from "next/font/local";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";

// As fontes vivem em `app/fonts/<familia>/` (subset `latin`, os MESMOS .woff2 que
// o Google serve) em vez de `next/font/google`: o build nao pode depender do CDN
// do Google, que rotaciona os arquivos e derruba o build com 404. Licencas (SIL
// OFL) ao lado de cada familia, em `OFL.txt`.

// Inter — corpo/UI da landing (fonte dominante do jitter.video) e do PAINEL
// (dashboard do Claude Design). Pesos 300..800 para o dashboard violeta.
const inter = localFont({
  src: [
    { path: "./fonts/inter/inter-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/inter/inter-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter/inter-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/inter/inter-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/inter/inter-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/inter/inter-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

// Playfair Display — serifa do "nome" no mini-convite do dashboard (Claude Design).
const playfair = localFont({
  src: [
    { path: "./fonts/playfairdisplay/playfairdisplay-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/playfairdisplay/playfairdisplay-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-playfair",
  display: "swap",
});

// Hanken Grotesk — display da landing (substituto livre da "TWK Lausanne"
// usada no jitter.video): grotesk neutra p/ títulos gigantes e tracking apertado.
const hanken = localFont({
  src: [
    { path: "./fonts/hankengrotesk/hankengrotesk-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/hankengrotesk/hankengrotesk-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/hankengrotesk/hankengrotesk-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/hankengrotesk/hankengrotesk-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-hanken",
  display: "swap",
});

// Fraunces — display / titulos (com italico).
const fraunces = localFont({
  src: [
    { path: "./fonts/fraunces/fraunces-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/fraunces/fraunces-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/fraunces/fraunces-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/fraunces/fraunces-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/fraunces/fraunces-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/fraunces/fraunces-600-italic.woff2", weight: "600", style: "italic" },
    { path: "./fonts/fraunces/fraunces-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/fraunces/fraunces-700-italic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

// Sora — marca / UI / corpo.
const sora = localFont({
  src: [
    { path: "./fonts/sora/sora-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/sora/sora-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/sora/sora-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/sora/sora-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/sora/sora-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sora",
  display: "swap",
});

// Space Grotesk — display TECH da landing (titulos fortes, cara de SaaS/IA).
// Substitui a serifa Fraunces no escopo `.mkt` (marketing), nao no evento/painel.
const spaceGrotesk = localFont({
  src: [
    { path: "./fonts/spacegrotesk/spacegrotesk-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/spacegrotesk/spacegrotesk-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/spacegrotesk/spacegrotesk-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/spacegrotesk/spacegrotesk-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-space",
  display: "swap",
});

// Jost — corpo da LANDING escura (leve, geométrica, geométrica leve).
const jost = localFont({
  src: [
    { path: "./fonts/jost/jost-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/jost/jost-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/jost/jost-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-jost",
  display: "swap",
});

// Cormorant Garamond — serifa display dos sites de evento (escopo `.cv`).
// Exposta como `--font-serif` (consumida pelo bloco `.cv` em globals.css);
// nao afeta o painel/landing, que usam Fraunces/Sora.
const cormorant = localFont({
  src: [
    { path: "./fonts/cormorantgaramond/cormorantgaramond-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/cormorantgaramond/cormorantgaramond-300-italic.woff2", weight: "300", style: "italic" },
    { path: "./fonts/cormorantgaramond/cormorantgaramond-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/cormorantgaramond/cormorantgaramond-400-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/cormorantgaramond/cormorantgaramond-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/cormorantgaramond/cormorantgaramond-500-italic.woff2", weight: "500", style: "italic" },
    { path: "./fonts/cormorantgaramond/cormorantgaramond-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/cormorantgaramond/cormorantgaramond-600-italic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SeuConvite IA — o seu site de convite em minutos",
  description:
    "Crie o site do seu evento em minutos: convites, confirmacao de presenca (RSVP), lista de presentes e muito mais. Sem complicacao.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${sora.variable} ${spaceGrotesk.variable} ${cormorant.variable} ${inter.variable} ${hanken.variable} ${playfair.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-nevoa font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
