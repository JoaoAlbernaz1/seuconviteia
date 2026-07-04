// Primitivos DARK PRÓPRIOS do template Casamento · Noite Luxo (black tie).
// NÃO são compartilhados com outros templates — vivem só nesta pasta. Server
// components; os fundos são grafite fixos (site inteiro escuro) e os acentos
// dourados vêm da paleta do evento (var(--ev-rosa)/--ev-rose/--ev-framboesa).
// Animações/gradientes com prefixo `cnl-`; reduced-motion resetado em <CnlStyles/>.
import type { ReactNode } from "react";
import Link from "next/link";
import { Reveal } from "@/components/evt/Reveal";
import { ArrowRight } from "@/components/evt/icons";

// ── Tokens de LAYOUT (escuros, próprios) ──
export const CNL_PAD = "px-[clamp(1.25rem,5vw,2.25rem)]";
export const CNL_RHYTHM = "py-[clamp(4.5rem,10vw,8rem)]";
export const CNL_WRAP = "mx-auto w-full max-w-[1120px]";

// ── Tokens de COR (grafite/preto fixos; ivory p/ texto) ──
export const CNL = {
  bg: "#14110C", // grafite quente (fundo padrão do main)
  bgDeep: "#0B0906", // preto profundo (seções alternadas)
  ink: "#F5EBD2", // ivory / champagne claro
  soft: "rgba(245,235,210,0.72)",
  mute: "rgba(245,235,210,0.50)",
  line: "rgba(245,235,210,0.10)",
} as const;

// Superfície dos cards escuros (com filete dourado + brilho superior).
const CARD_BG = "linear-gradient(180deg, #1F1810 0%, #16110A 100%)";
const CARD_BORDER = "1px solid color-mix(in srgb, var(--ev-rosa) 26%, transparent)";
const CARD_SHADOW =
  "0 34px 80px -56px rgba(0,0,0,0.95), inset 0 1px 0 rgba(245,235,210,0.05)";

/** Filete dourado com losango ◆ — divisor black-tie reutilizado. */
export function CnlDivider({ w = "3rem" }: { w?: string }) {
  return (
    <span className="flex items-center justify-center gap-3" aria-hidden>
      <span
        className="h-px"
        style={{ width: w, background: "color-mix(in srgb, var(--ev-rosa) 62%, transparent)" }}
      />
      <span className="rotate-45 text-[0.5rem]" style={{ color: "var(--ev-rosa)" }}>
        ◆
      </span>
      <span
        className="h-px"
        style={{ width: w, background: "color-mix(in srgb, var(--ev-rosa) 62%, transparent)" }}
      />
    </span>
  );
}

/** Eyebrow dourado (util caixa-alta, tracking largo). */
export function CnlEyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`font-evt-util text-[0.72rem] font-medium uppercase tracking-[0.42em] ${className}`}
      style={{ color: "var(--ev-rose)" }}
    >
      {children}
    </p>
  );
}

/** Cabeçalho de seção: eyebrow + título cursivo dourado + filete ◆. */
export function CnlHeading({
  eyebrow,
  title,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  align?: "center" | "left";
}) {
  const left = align === "left";
  return (
    <div className={left ? "text-left" : "text-center"}>
      {eyebrow && <CnlEyebrow>{eyebrow}</CnlEyebrow>}
      <h2
        className={`cnl-gold font-evt-script leading-[1.0] text-[clamp(2.9rem,9vw,4.6rem)] [text-wrap:balance] ${
          eyebrow ? "mt-4" : ""
        }`}
      >
        {title}
      </h2>
      <div className={`mt-6 flex ${left ? "justify-start" : "justify-center"}`}>
        <CnlDivider w="4rem" />
      </div>
    </div>
  );
}

/** Card escuro com filete dourado + brilho superior discreto. */
export function CnlCard({
  children,
  className = "",
  glow = true,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[16px] ${className}`}
      style={{ background: CARD_BG, border: CARD_BORDER, boxShadow: CARD_SHADOW }}
    >
      {glow && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-28"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 0%, color-mix(in srgb, var(--ev-rosa) 15%, transparent), transparent 72%)",
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

/** Seção escura padrão (bg grafite ou preto profundo). */
export function CnlSection({
  children,
  deep = false,
  className = "",
  id,
}: {
  children: ReactNode;
  deep?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`relative ${CNL_PAD} ${CNL_RHYTHM} ${className}`}
      style={{ background: deep ? CNL.bgDeep : CNL.bg }}
    >
      {children}
    </section>
  );
}

/** DRESS CODE valorizado — bloco de destaque (usado em Home e Evento). */
export function CnlDressCode({ traje }: { traje?: string }) {
  const dress = traje?.trim() || "Black tie";
  return (
    <Reveal className={CNL_WRAP}>
      <CnlCard className="mx-auto max-w-[760px] px-[clamp(1.75rem,6vw,3.5rem)] py-[clamp(2.75rem,7vw,4rem)] text-center">
        <CnlEyebrow>Dress code</CnlEyebrow>
        <div className="mt-6 flex justify-center">
          <CnlDivider />
        </div>
        <p className="cnl-gold mt-6 font-evt-script text-[clamp(2.6rem,9vw,4.2rem)] leading-[1.02]">
          {dress}
        </p>
        <p
          className="mx-auto mt-6 max-w-[460px] font-evt-body text-[clamp(1.05rem,3.4vw,1.2rem)] leading-relaxed"
          style={{ color: CNL.soft }}
        >
          Uma noite de gala sob a luz das velas. Capriche no traje e venha brilhar
          conosco.
        </p>
      </CnlCard>
    </Reveal>
  );
}

/** Link contorno dourado (ghost) — CTA secundário sobre fundo escuro. */
export function CnlGhostLink({
  href,
  children,
  prefetch,
  target,
  rel,
}: {
  href: string;
  children: ReactNode;
  prefetch?: boolean;
  target?: string;
  rel?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      target={target}
      rel={rel}
      className="group inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full px-8 py-3 font-evt-util text-[0.7rem] font-medium uppercase tracking-[0.24em] transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ev-rose)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110C]"
      style={{
        color: "var(--ev-rose)",
        border: "1px solid color-mix(in srgb, var(--ev-rosa) 55%, transparent)",
        background: "color-mix(in srgb, var(--ev-rosa) 6%, transparent)",
      }}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

/** Agenda de gala — timeline vertical escura com filete + marcadores dourados. */
export function AgendaGala({
  itens,
}: {
  itens: { hora: string; titulo: string }[];
}) {
  if (itens.length === 0) return null;
  return (
    <ol className="relative mx-auto max-w-[540px] pl-2">
      <span
        className="pointer-events-none absolute bottom-3 left-[9px] top-3 w-px"
        style={{ background: "color-mix(in srgb, var(--ev-rosa) 42%, transparent)" }}
        aria-hidden
      />
      {itens.map((item, i) => (
        <Reveal as="li" key={`${item.hora}-${item.titulo}-${i}`} delay={i * 90}>
          <div className="relative flex items-baseline gap-5 py-4 pl-8">
            <span
              className="absolute left-0 top-[0.62rem] h-[18px] w-[18px] rounded-full"
              style={{
                background: CNL.bg,
                boxShadow: "inset 0 0 0 3px var(--ev-rosa)",
                border: "1px solid color-mix(in srgb, var(--ev-rosa) 50%, transparent)",
              }}
              aria-hidden
            />
            <span
              className="min-w-[3.8rem] shrink-0 font-evt-display text-[clamp(1.5rem,5vw,2.1rem)] leading-none tabular-nums"
              style={{ color: "var(--ev-rose)" }}
            >
              {item.hora}
            </span>
            <span className="font-evt-body text-[1.12rem]" style={{ color: CNL.ink }}>
              {item.titulo}
            </span>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

/**
 * Estilos scoped `cnl-` (texto dourado + micro-animações). Renderizado UMA vez
 * no topo de cada página. Reduced-motion desliga tudo.
 */
export function CnlStyles() {
  return (
    <style>{`
      .cnl-gold { color: var(--ev-rose); }
      @supports ((-webkit-background-clip: text) or (background-clip: text)) {
        .cnl-gold {
          background-image: linear-gradient(178deg, #F8EDCB 0%, var(--ev-rose) 46%, var(--ev-rosa) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }
      }
      @keyframes cnlGlow { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      .cnl-glow { animation: cnlGlow 3.6s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .cnl-glow { animation: none !important; opacity: 1 !important; }
      }
    `}</style>
  );
}
