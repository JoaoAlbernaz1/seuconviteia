import Link from "next/link";
import type { ReactNode } from "react";
import { ATUALIZADO_EM } from "./dados-da-empresa";

/**
 * Moldura das paginas juridicas (Termos e Privacidade). Fundo e tipografia da
 * landing, sem as animacoes: aqui a pessoa esta LENDO, nao sendo convencida.
 * Medida de linha curta (~68ch) porque texto juridico longo em linha larga e o
 * jeito mais rapido de fazer ninguem ler.
 */
export function LegalPage({ titulo, resumo, children }: { titulo: string; resumo: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080808] text-[rgba(255,255,255,0.78)] antialiased">
      <header className="border-b border-white/8">
        <div className="mx-auto flex max-w-[76ch] items-center justify-between px-6 py-6">
          <Link href="/" className="text-[15px] font-semibold text-white no-underline">
            seuconvite
          </Link>
          <Link href="/" className="text-[13px] text-[#C4B5FD] no-underline hover:text-white">
            ← Voltar ao site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[76ch] px-6 py-14">
        <h1 className="text-[32px] font-semibold leading-[1.15] text-white sm:text-[40px]">{titulo}</h1>
        <p className="mt-4 text-[15px] leading-[1.7] text-[rgba(255,255,255,0.62)]">{resumo}</p>
        <p className="mt-6 text-[13px] text-[rgba(255,255,255,0.45)]">Última atualização: {ATUALIZADO_EM}</p>

        <div className="legal mt-12 space-y-10">{children}</div>
      </main>

      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-[76ch] flex-wrap gap-x-6 gap-y-2 px-6 py-8 text-[13px] text-[rgba(255,255,255,0.5)]">
          <Link href="/termos" className="no-underline hover:text-white">Termos de uso</Link>
          <Link href="/privacidade" className="no-underline hover:text-white">Privacidade</Link>
          <span className="ml-auto">uma marca Orivya</span>
        </div>
      </footer>
    </div>
  );
}

/** Secao numerada do documento. O `id` permite citar a clausula por link. */
export function Clausula({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  const id = `clausula-${n}`;
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-[19px] font-semibold leading-snug text-white">
        <a href={`#${id}`} className="no-underline text-white hover:text-[#C4B5FD]">
          {n}. {titulo}
        </a>
      </h2>
      <div className="mt-3 space-y-3 text-[15px] leading-[1.75]">{children}</div>
    </section>
  );
}

/** Destaque para o que o leitor precisa entender mesmo que pule o resto. */
export function EmDestaque({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-[#7C3AED]/35 bg-[#7C3AED]/10 px-4 py-3 text-[15px] leading-[1.7] text-white">
      {children}
    </p>
  );
}
