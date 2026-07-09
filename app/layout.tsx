import type { Metadata } from "next";
import { Cormorant_Garamond, Fraunces, Hanken_Grotesk, Inter, Sora, Space_Grotesk } from "next/font/google";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";

// Inter — corpo da landing clara (escopo `.mkt`). Igual à referência do dono.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

// Hanken Grotesk — display PESADO da landing clara (substituto grátis do TWK
// Lausanne, que é licenciado). Só no escopo `.mkt`; não toca painel/evento.
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-mktdisplay",
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
      className={`${fraunces.variable} ${sora.variable} ${spaceGrotesk.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-nevoa font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
