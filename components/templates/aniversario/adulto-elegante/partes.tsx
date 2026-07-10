// Primitivas de UI PRÓPRIAS do template "Aniversário Adulto Elegante" (prefixo aae).
// Nada de Card/SectionHeading compartilhados: este template traz o seu vocabulário
// visual — editorial, neutro, adulto. Server components (sem interatividade); a
// paleta/fonte vêm dos tokens .evt (var(--ev-*), font-evt-*), então re-tinge junto
// com o tema do evento. Usadas por Home/Evento/Presentes/Galeria deste template.
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "@/components/evt/icons";

// ── Ritmo/gutter comuns (respiro largo = ar de "caro") ──────────────────────
export const AAE_PAD = "px-[clamp(1.25rem,5vw,2.25rem)]";
export const AAE_RHYTHM = "py-[clamp(4.5rem,10vw,8rem)]";
export const AAE_WRAP = "mx-auto w-full max-w-[1080px]";

/** Atraso da entrada `aae-rise` (custom property), tipado para o `style` prop. */
export function aaeDelay(ms: number): React.CSSProperties {
  return { "--aae-delay": `${ms}ms` } as React.CSSProperties;
}

/**
 * Rótulo editorial (kicker) — filete curto + caixa-alta muito espaçada. É a
 * assinatura tipográfica do template. `center` põe filetes dos dois lados.
 */
export function Kicker({
  children,
  center = false,
  className = "",
}: {
  children: ReactNode;
  center?: boolean;
  className?: string;
}) {
  const line = <span className="h-px w-8 bg-evt-rosa-ink/40" aria-hidden />;
  return (
    <span
      className={`flex items-center gap-3 font-evt-util text-[0.7rem] font-medium uppercase leading-none tracking-[0.34em] text-evt-rosa-ink ${
        center ? "justify-center" : ""
      } ${className}`}
    >
      {line}
      <span>{children}</span>
      {center && line}
    </span>
  );
}

/**
 * Cabeçalho de seção próprio — kicker + título em display versal, com um índice
 * numérico opcional ("01") que dá cadência de revista. `center` centraliza.
 */
export function TituloSecao({
  kicker,
  titulo,
  indice,
  center = false,
  className = "",
}: {
  kicker: string;
  titulo: ReactNode;
  indice?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={`${center ? "text-center" : ""} ${className}`}>
      <div className={`flex items-center gap-4 ${center ? "justify-center" : ""}`}>
        <Kicker center={center}>{kicker}</Kicker>
        {indice && !center && (
          <span className="font-evt-util text-[0.7rem] tracking-[0.2em] text-evt-ink-soft/60">
            {indice}
          </span>
        )}
      </div>
      <h2 className="mt-6 font-evt-display uppercase leading-[1.03] tracking-[0.02em] text-evt-ink text-[clamp(1.95rem,5.4vw,3.1rem)]">
        {titulo}
      </h2>
    </div>
  );
}

/** Cartão moderno — filete fino, superfície translúcida, sombra baixa e larga. */
export function Carta({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-[var(--line)] bg-white/65 shadow-[0_28px_70px_-52px_rgba(15,23,42,0.55)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** Filete horizontal fino (divisor discreto). */
export function Filete({ className = "" }: { className?: string }) {
  return <span className={`block h-px w-full bg-[var(--line)] ${className}`} aria-hidden />;
}

/**
 * CTA "Confirmar presença" próprio — pílula preenchida (framboesa do tema),
 * brilho que desliza no hover (`aae-cta`), lift discreto e seta que avança.
 * Leva sempre a /confirmar (formulário compartilhado, tematizado).
 */
export function BotaoConfirmar({
  children = "Confirmar presença",
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href="/confirmar"
      className={`aae-cta group relative inline-flex min-h-[56px] items-center justify-center gap-3 rounded-full bg-evt-framboesa px-10 py-4 font-evt-util text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white shadow-[0_18px_44px_-22px_var(--ev-framboesa)] transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
    </Link>
  );
}

/** Link secundário em contorno fino (ghost), caixa-alta espaçada. */
export function LinkGhost({
  href,
  children,
  external = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  const cls = `group inline-flex min-h-[50px] items-center justify-center gap-2.5 rounded-full border border-[var(--line-rosa)] px-8 py-3 font-evt-util text-[0.66rem] font-medium uppercase tracking-[0.24em] text-evt-rosa-ink transition-[color,border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-evt-rosa hover:bg-evt-rosa/[0.07] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white ${className}`;
  const inner = (
    <>
      <span>{children}</span>
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

/**
 * Estilos scoped `aae-` (keyframes próprios) + reset de reduced-motion. Renderizado
 * uma vez no topo de cada página do template. Movimento é enfeite: quem pede menos
 * movimento recebe tudo estático.
 */
export function AaeStyle() {
  return (
    <style>{`
      @keyframes aaeRise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
      .aae-rise { opacity: 0; animation: aaeRise 0.9s cubic-bezier(0.16,1,0.3,1) both; animation-delay: var(--aae-delay, 0ms); }
      .aae-cta { position: relative; overflow: hidden; }
      .aae-cta::after {
        content: ""; position: absolute; inset: 0; z-index: 0;
        transform: translateX(-130%) skewX(-18deg);
        background: linear-gradient(105deg, transparent, rgba(255,255,255,0.38), transparent);
        transition: transform 0.8s ease;
      }
      .aae-cta:hover::after { transform: translateX(130%) skewX(-18deg); }
      @media (prefers-reduced-motion: reduce) {
        .aae-rise { opacity: 1 !important; animation: none !important; transform: none !important; }
        .aae-cta::after { transition: none !important; }
      }
    `}</style>
  );
}
