// Primitivas DELICADAS deste template (Princesa Delicado). Corpo PRÓPRIO — nada
// de Card/SectionHeading compartilhados. Tudo em curvas suaves, filigranas
// florais (Flourish), fio-de-cabelo e brilho leve. Server-safe: só compõe
// <Reveal> (client) quando precisa revelar ao rolar. Animações scoped `qpd-`
// (keyframes em <EstiloPrincesa/>, com reset de reduced-motion).
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/evt/Reveal";
import { Flourish, ArrowRight } from "@/components/evt/icons";

// Ritmo/medidas do template (mais ar que o base — clima romântico e respirado).
export const QPD_PAD = "px-[clamp(1.25rem,5vw,2rem)]";
export const QPD_RHYTHM = "py-[clamp(4.75rem,10vw,8rem)]";
export const QPD_RHYTHM_SM = "py-[clamp(3.25rem,7vw,5rem)]";
export const QPD_WRAP = "mx-auto w-full max-w-[1080px]";
export const QPD_WRAP_TXT = "mx-auto w-full max-w-[680px]";

/** Keyframes `qpd-*` (float / petal / pulse) + reset de reduced-motion. Uma vez por página. */
export function EstiloPrincesa() {
  return (
    <style>{`
      @keyframes qpdFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }
      @keyframes qpdPetal {
        0%   { transform: translate3d(0,0,0) scale(1);      opacity: .42 }
        50%  { transform: translate3d(8px,-16px,0) scale(1.08); opacity: .72 }
        100% { transform: translate3d(0,0,0) scale(1);      opacity: .42 }
      }
      @keyframes qpdPulse { 0%,100% { opacity: .35; transform: scale(1) } 50% { opacity: .7; transform: scale(1.045) } }
      .evt .qpd-float { animation: qpdFloat 6s ease-in-out infinite }
      .evt .qpd-petal { animation: qpdPetal 12s ease-in-out infinite; will-change: transform, opacity }
      .evt .qpd-pulse { animation: qpdPulse 4.6s ease-in-out infinite }
      @media (prefers-reduced-motion: reduce) {
        .evt .qpd-float, .evt .qpd-petal, .evt .qpd-pulse {
          animation: none !important; transform: none !important; opacity: 1 !important;
        }
      }
    `}</style>
  );
}

/**
 * Cabeçalho de seção delicado: eyebrow (util) + filigrana floral flutuante +
 * título em cursiva + intro opcional. Centrado, com muito ar.
 */
export function CabecalhoPrincesa({
  eyebrow,
  titulo,
  intro,
  className = "",
}: {
  eyebrow: string;
  titulo: string;
  intro?: string;
  className?: string;
}) {
  return (
    <Reveal className={`flex flex-col items-center gap-4 text-center ${className}`}>
      <p className="eyebrow text-evt-rosa-ink">{eyebrow}</p>
      <Flourish className="qpd-float h-4 w-24 text-evt-rosa" />
      <h2 className="font-evt-script leading-[1.02] text-evt-ink text-[clamp(2.4rem,7.5vw,3.7rem)]">
        {titulo}
      </h2>
      {intro && (
        <p className="mt-1 max-w-[46ch] font-evt-body text-[1.14rem] leading-relaxed text-evt-ink-soft">
          {intro}
        </p>
      )}
    </Reveal>
  );
}

/**
 * Cartão suave: bandeja translúcida externa (fio) + carta interna com hairline
 * rosa e arco de brilho no topo. Deixa a atmosfera (foto + partículas) passar.
 */
export function CartaoSuave({
  children,
  className = "",
  glow = true,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className="rounded-[1.9rem] border border-[var(--line)] bg-white/40 p-[6px] shadow-[0_36px_84px_-60px_rgba(46,26,32,0.42)] backdrop-blur-[2px]">
      <div className={`relative overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white/72 ${className}`}>
        {glow && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-16 mx-auto h-32 w-3/4 rounded-[50%] blur-2xl"
            style={{ background: "color-mix(in srgb, var(--ev-rose) 34%, transparent)" }}
          />
        )}
        {/* filete rosa interno — moldura de renda */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[9px] rounded-[1.15rem] border border-[var(--line-rosa)] opacity-40"
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

/** Botão/laço suave (ghost): pílula fio-de-cabelo rosa com lift no hover. */
export function BotaoSuave({
  href,
  children,
  target,
  rel,
  prefetch,
  variant = "ghost",
}: {
  href: string;
  children: ReactNode;
  target?: string;
  rel?: string;
  prefetch?: boolean;
  variant?: "ghost" | "solid";
}) {
  const solid =
    "cta-confirmar text-white shadow-[0_16px_40px_-22px_rgba(46,26,32,0.5)]";
  const ghost =
    "border border-[var(--line-rosa)] bg-white/55 text-evt-rosa-ink backdrop-blur-sm hover:border-evt-rosa hover:bg-white/85 hover:shadow-[0_18px_42px_-28px_rgba(46,26,32,0.42)]";
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      prefetch={prefetch}
      className={`group inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full px-8 py-3 font-evt-util text-[0.68rem] font-medium uppercase tracking-[0.24em] transition-[transform,background-color,box-shadow,border-color] duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
        variant === "solid" ? solid : ghost
      }`}
    >
      <span className="relative z-10">{children}</span>
      <ArrowRight className="relative z-10 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

/** Divisor filigrana — flourish central com filetes que se dissolvem. */
export function Filigrana({ className = "" }: { className?: string }) {
  return (
    <Reveal className={`flex items-center justify-center gap-4 text-evt-rosa ${className}`}>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--line-rosa)]" aria-hidden />
      <Flourish className="qpd-float h-4 w-20" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--line-rosa)]" aria-hidden />
    </Reveal>
  );
}

/** Pétalas de brilho — bokeh floral macio que flutua atrás de uma seção. */
export function PetalasFundo() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className="qpd-petal absolute left-[7%] top-[14%] h-40 w-40 rounded-full blur-3xl"
        style={{ background: "color-mix(in srgb, var(--ev-rose) 46%, transparent)", animationDelay: "0s" }}
      />
      <span
        className="qpd-petal absolute right-[9%] top-[22%] h-32 w-32 rounded-full blur-3xl"
        style={{ background: "color-mix(in srgb, var(--ev-blush) 70%, transparent)", animationDelay: "1.6s" }}
      />
      <span
        className="qpd-petal absolute bottom-[12%] left-[16%] h-36 w-36 rounded-full blur-3xl"
        style={{ background: "color-mix(in srgb, var(--ev-blush) 62%, transparent)", animationDelay: "3s" }}
      />
    </div>
  );
}

/**
 * Programação em RENDA — trilho tracejado vertical + horário em medalhão oval.
 * Cada item revela escalonado ao rolar (reduced-motion safe). Usado na Home e na
 * /evento para manter o mesmo desenho delicado.
 */
export function AgendaRenda({ itens }: { itens: { hora: string; titulo: string }[] }) {
  if (itens.length === 0) return null;
  return (
    <ol className="relative mx-auto max-w-lg">
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-6 left-8 top-6 border-l border-dashed border-[var(--line-rosa)] opacity-60"
      />
      {itens.map((item, i) => (
        <Reveal
          as="li"
          key={`${item.hora}-${item.titulo}-${i}`}
          delay={i * 90}
          className="relative flex items-center gap-5 py-3.5"
        >
          <span className="relative z-10 grid h-16 w-16 shrink-0 place-items-center rounded-[50%] border border-[var(--line-rosa)] bg-white/75 shadow-[0_16px_36px_-28px_rgba(46,26,32,0.4)] backdrop-blur-sm">
            <span className="font-evt-display text-[0.98rem] leading-none tabular-nums text-evt-rosa-ink">
              {item.hora}
            </span>
          </span>
          <span className="font-evt-body text-[1.16rem] leading-snug text-evt-ink">
            {item.titulo}
          </span>
        </Reveal>
      ))}
    </ol>
  );
}

/** Moldura OVAL de foto — motivo de curvas do template, com halo de fio. */
export function MolduraOval({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <span
        aria-hidden
        className="absolute -inset-3 rounded-[50%] border border-[var(--line-rosa)] opacity-50"
      />
      <div className="relative rounded-[50%] border border-[var(--line-rosa)] bg-white/45 p-[7px] shadow-[0_40px_92px_-58px_rgba(46,26,32,0.42)]">
        <div className="relative overflow-hidden rounded-[50%]">{children}</div>
      </div>
    </div>
  );
}
