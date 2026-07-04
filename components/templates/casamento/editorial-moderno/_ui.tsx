// Primitivas do template Casamento · Editorial Moderno (estilo REVISTA).
// TODO o corpo deste template e proprio — NAO usa `_base/secoes` nem
// Card/SectionHeading. Aqui vivem os blocos de layout compartilhados ENTRE as 4
// paginas DESTE template (Home/Evento/Presentes/Galeria): kicker editorial, titulo
// display caixa-alta, numeral-indice gigante, links, CTA, foto sem moldura e o
// bloco de estilos `cem-` (com reset de reduced-motion). Server components (sem
// interatividade) — os interativos (contador/pix/galeria) sao arquivos `use client`.
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowRight } from "@/components/evt/icons";

// ── Ritmo & container: MUITO espaco em branco, goteira larga (revista) ──
export const CEM_SHELL =
  "mx-auto w-full max-w-[1200px] px-[clamp(1.25rem,5vw,3.5rem)]";
export const CEM_BLOCK = "py-[clamp(4.5rem,10vw,8.5rem)]";
export const CEM_BLOCK_SM = "py-[clamp(3rem,7vw,5.5rem)]";
/** Folga do topo para escapar da nav fixa (paginas internas). */
export const CEM_TOP = "pt-[clamp(7.5rem,13vw,9.5rem)]";
/** Goteira lateral do SHELL — usada por blocos full-bleed (timeline). */
export const CEM_GUTTER_NEG = "-mx-[clamp(1.25rem,5vw,3.5rem)]";
export const CEM_GUTTER_PAD = "px-[clamp(1.25rem,5vw,3.5rem)]";

/** Kicker editorial: filete curto + rotulo caixa-alta com tracking largo. */
export function CemKicker({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-4 ${className}`}>
      <span aria-hidden className="h-px w-9 bg-evt-rosa-ink/50" />
      <span className="font-evt-util text-[0.64rem] font-medium uppercase tracking-[0.42em] text-evt-rosa-ink">
        {children}
      </span>
    </span>
  );
}

/** Titulo display, caixa-alta, entrelinha fechada — a voz forte da revista. */
export function CemHeading({
  children,
  className = "",
  as: Tag = "h2",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag
      className={`font-evt-display uppercase leading-[0.94] tracking-[0.005em] text-evt-ink text-[clamp(2.1rem,6.4vw,4.2rem)] ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Numeral-indice gigante e quase apagado — assinatura editorial de secao. */
export function CemIndex({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none block select-none font-evt-display leading-[0.8] text-evt-rosa/12 text-[clamp(4.5rem,15vw,10rem)]"
    >
      {children}
    </span>
  );
}

/** Link-texto fantasma (caixa-alta + seta que avanca no hover). */
export function CemLink({
  href,
  children,
  target,
  rel,
}: {
  href: string;
  children: ReactNode;
  target?: string;
  rel?: string;
}) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className="group inline-flex items-center gap-2.5 font-evt-util text-[0.68rem] font-medium uppercase tracking-[0.26em] text-evt-ink transition-colors duration-200 hover:text-evt-rosa-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-4 focus-visible:ring-offset-evt-ivory"
    >
      <span className="border-b border-[var(--line-rosa)] pb-1 transition-colors duration-200 group-hover:border-evt-rosa-ink">
        {children}
      </span>
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
    </Link>
  );
}

/** CTA preenchido, RETANGULAR (editorial-moderno) — tinta -> acento no hover. */
export function CemCta({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-[54px] items-center justify-center gap-3 bg-evt-ink px-9 py-4 font-evt-util text-[0.68rem] font-medium uppercase tracking-[0.28em] text-evt-ivory transition-[background-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-evt-rosa-ink hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-evt-ivory"
    >
      <span>{children}</span>
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
    </Link>
  );
}

/** Foto editorial SEM cantos arredondados (revista) — filete fino + zoom hover. */
export function CemPhoto({
  src,
  alt,
  ratio = "aspect-[4/5]",
  sizes = "(max-width: 768px) 100vw, 40vw",
  priority = false,
  className = "",
}: {
  src?: string;
  alt: string;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={`group relative overflow-hidden ${ratio} ${className}`}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 ring-1 ring-inset ring-[var(--line)]"
      />
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.045]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))]">
          <span className="font-evt-util text-[0.56rem] uppercase tracking-[0.3em] text-evt-ink-soft/70">
            Em breve
          </span>
        </div>
      )}
    </figure>
  );
}

/**
 * Estilos `cem-` deste template (injetados 1x por pagina). So classes utilitarias
 * de layout + uma animacao decorativa, todas com reset sob reduced-motion.
 */
export function CemStyles() {
  return (
    <style>{`
      .cem-spine { writing-mode: vertical-rl; text-orientation: mixed; }
      .cem-hscroll { scrollbar-width: none; -ms-overflow-style: none; }
      .cem-hscroll::-webkit-scrollbar { display: none; }
      @keyframes cemDraw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      .cem-draw { transform-origin: left center; animation: cemDraw 0.9s cubic-bezier(0.16,1,0.3,1) both; }
      @media (prefers-reduced-motion: reduce) {
        .cem-draw { animation: none !important; transform: none !important; }
      }
    `}</style>
  );
}
