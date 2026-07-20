import type { Metadata } from "next";
import { Cormorant_Garamond, Fraunces, Hanken_Grotesk, Inter, Playfair_Display, Sora, Space_Grotesk } from "next/font/google";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";

// Inter — corpo/UI da landing (fonte dominante do jitter.video) e do PAINEL
// (dashboard do Claude Design). Pesos 300..800 para o dashboard violeta.
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

// Playfair Display — serifa do "nome" no mini-convite do dashboard (Claude Design).
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-playfair",
  display: "swap",
});

// Hanken Grotesk — display da landing (substituto livre da "TWK Lausanne"
// usada no jitter.video): grotesk neutra p/ títulos gigantes e tracking apertado.
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});

// Fraunces — display / titulos (com italico).
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

// Sora — marca / UI / corpo.
const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

// Space Grotesk — display TECH da landing (titulos fortes, cara de SaaS/IA).
// Substitui a serifa Fraunces no escopo `.mkt` (marketing), nao no evento/painel.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});

// Cormorant Garamond — serifa display dos sites de evento (escopo `.cv`).
// Exposta como `--font-serif` (consumida pelo bloco `.cv` em globals.css);
// nao afeta o painel/landing, que usam Fraunces/Sora.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
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
      className={`${fraunces.variable} ${sora.variable} ${spaceGrotesk.variable} ${cormorant.variable} ${inter.variable} ${hanken.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-nevoa font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
