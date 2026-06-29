import type { Metadata } from "next";
import { Fraunces, Sora } from "next/font/google";
import "./globals.css";

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
      className={`${fraunces.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-nevoa font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
