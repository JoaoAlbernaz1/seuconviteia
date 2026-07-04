// Primitivas PRÓPRIAS do template "Casamento · Clássico Elegante".
// NADA compartilhado com _base/secoes nem com Card/SectionHeading de components/evt
// (evita o "look da Maria"). A linguagem visual daqui é: off-white/champagne, ouro
// suave, serifas, molduras concêntricas (double-bezel), medalhão-monograma,
// filigranas discretas e simetria — o clima clássico/romântico/premium.
//
// Server-only (sem "use client"): tudo aqui é puro/estrutural. Themeável por
// tokens .evt (var(--ev-*), font-evt-*, var(--line)/--line-rosa/--radius-card),
// então funciona em qualquer paleta. Animações extras usam o prefixo scoped `cce-`
// (ver <CceEstilo/>), com guarda de prefers-reduced-motion.
import type { ReactNode } from "react";
import { Flourish, ArrowRight } from "@/components/evt/icons";

/** Ritmo/gutter/largura próprios (ligeiramente diferentes das outras famílias). */
export const CCE_PAD = "px-[clamp(1.25rem,5vw,2rem)]";
export const CCE_RITMO = "py-[clamp(4.75rem,10vw,8rem)]";
export const CCE_WRAP = "mx-auto max-w-[1080px]";

/** Folha de estilo scoped do template — só animações `cce-*` (com guarda RM). */
export function CceEstilo() {
  return (
    <style>{`
      @keyframes cceRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
      @keyframes cceFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      .cce-rise { opacity: 0; animation: cceRise 0.95s cubic-bezier(0.16,1,0.3,1) both; }
      .cce-float { animation: cceFloat 5.5s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .cce-rise, .cce-float { opacity: 1 !important; animation: none !important; transform: none !important; }
      }
    `}</style>
  );
}

/**
 * Medalhão-monograma — círculo com anel duplo e a inicial do casal em cursiva.
 * Assinatura clássica do template; flutua de leve (cce-float, guardado por RM).
 */
export function Medalhao({ inicial }: { inicial: string }) {
  return (
    <span className="cce-float relative inline-flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border border-[var(--line-rosa)] bg-white/50 shadow-[0_18px_40px_-30px_rgba(46,26,32,0.55)]">
      <span className="absolute inset-[6px] rounded-full border border-[var(--line)]" aria-hidden />
      <span className="font-evt-script text-[1.9rem] leading-none text-evt-rosa-ink">{inicial}</span>
    </span>
  );
}

/** Filigrana horizontal entre filetes finos — divisor ornamental discreto. */
export function Divisor({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center justify-center gap-4 text-evt-rosa ${className}`} aria-hidden>
      <span className="h-px w-14 bg-[var(--line-rosa)]" />
      <span className="rotate-45 text-[0.55rem] leading-none">◆</span>
      <span className="h-px w-14 bg-[var(--line-rosa)]" />
    </span>
  );
}

/**
 * Cabeçalho de seção CENTRADO — eyebrow util + filigrana + título em display
 * serifado com tracking generoso. (Distinto do SectionHeading e do editorial.)
 */
export function TituloSecao({
  eyebrow,
  titulo,
  className = "",
}: {
  eyebrow: string;
  titulo: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <p className="eyebrow text-evt-rosa-ink">{eyebrow}</p>
      <Flourish className="mt-5 h-4 w-28 text-evt-rosa" />
      <h2 className="mt-5 font-evt-display text-[clamp(2.1rem,6vw,3.1rem)] leading-[1.05] tracking-[0.06em] text-evt-ink">
        {titulo}
      </h2>
    </div>
  );
}

/**
 * Moldura double-bezel — bandeja externa (filete dourado) + carta interna
 * (filete neutro + creme translúcido). O motivo concêntrico é a "cara" clássica.
 */
export function Moldura({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-[calc(var(--radius-card)+0.55rem)] border border-[var(--line-rosa)] bg-white/40 p-1.5 shadow-[0_34px_82px_-58px_rgba(46,26,32,0.55)]">
      <div className={`rounded-[var(--radius-card)] border border-[var(--line)] bg-white/70 ${className}`}>
        {children}
      </div>
    </div>
  );
}

/** Link elegante (pílula com filete dourado) — usa <a> puro por design do sistema. */
export function LinkElegante({
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
    <a
      href={href}
      target={target}
      rel={rel}
      className="group inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-full border border-[var(--line-rosa)] bg-white/40 px-8 py-3 font-evt-util text-[0.66rem] font-medium uppercase tracking-[0.26em] text-evt-rosa-ink transition-[background-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-[0_16px_40px_-26px_rgba(46,26,32,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
    </a>
  );
}
