// ─────────────────────────────────────────────────────────────────────────────
// Aniversário · Tropical Festa — SISTEMA VISUAL PRÓPRIO deste template.
// Nada de `_base/secoes` nem de Card/SectionHeading de `components/evt`: aqui vivem
// as peças bespoke (folhas, ondas, sol, confete, chips, headings, cartões) que dão
// o clima TROPICAL / VIBRANTE / FESTIVO. Tudo derivado dos tokens `--ev-*` via
// var()/color-mix (nenhum hex de marca), então re-tinge com qualquer paleta.
// Animações CSS escopadas no prefixo `atf-` (com reset de reduced-motion no
// <AtfStyle/>). Componentes SERVER (o interativo mora em arquivos client próprios).
import type { CSSProperties, ReactNode } from "react";

// ── Ritmo / larguras (próprio; não é o PAD/RHYTHM/WRAP compartilhado) ──────────
export const ATF_PAD = "px-[clamp(1.25rem,5vw,2.25rem)]";
export const ATF_RHYTHM = "py-[clamp(4.5rem,10vw,8rem)]";
export const ATF_WRAP = "mx-auto w-full max-w-[1120px]";

// ── Gradientes vivos (multi-tom, derivados dos tokens) ────────────────────────
export const ATF_GRAD_HOT =
  "radial-gradient(120% 92% at 12% 6%, color-mix(in srgb, var(--ev-rose) 80%, white) 0%, transparent 52%)," +
  "radial-gradient(120% 96% at 90% 12%, color-mix(in srgb, var(--ev-framboesa-bright) 78%, white) 0%, transparent 50%)," +
  "linear-gradient(150deg, var(--ev-rosa) 0%, var(--ev-framboesa) 56%, var(--ev-framboesa-deep) 100%)";

export const ATF_GRAD_SUNSET =
  "linear-gradient(122deg, color-mix(in srgb, var(--ev-rose) 88%, white) 0%, var(--ev-framboesa-bright) 46%, var(--ev-framboesa) 100%)";

export const ATF_GRAD_LAGOON =
  "linear-gradient(160deg, var(--ev-framboesa) 0%, var(--ev-framboesa-deep) 100%)";

// Medalhões de ícone — rotação de gradientes para variar por card/seção.
export const ATF_MEDALHOES = [
  "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))",
  "linear-gradient(135deg, var(--ev-framboesa-bright), var(--ev-framboesa-deep))",
  "linear-gradient(135deg, var(--ev-rosa), var(--ev-framboesa-bright))",
  "linear-gradient(135deg, var(--ev-framboesa), var(--ev-rosa))",
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// Keyframes + classes `atf-*` (um <AtfStyle/> por página). Reduced-motion neutro.
// ═══════════════════════════════════════════════════════════════════════════
export function AtfStyle() {
  return (
    <style>{`
      @keyframes atfSway { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
      @keyframes atfFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
      @keyframes atfSpin { to { transform: rotate(360deg); } }
      @keyframes atfPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      @keyframes atfRise { from { opacity: 0; transform: translateY(22px) scale(0.97); } to { opacity: 1; transform: none; } }
      @keyframes atfBob { 0%,100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-10px) rotate(3deg); } }
      .atf-sway { animation: atfSway 7s ease-in-out infinite; transform-origin: 50% 92%; }
      .atf-float { animation: atfFloat 6s ease-in-out infinite; }
      .atf-spin { animation: atfSpin 30s linear infinite; }
      .atf-pulse { animation: atfPulse 3.4s ease-in-out infinite; }
      .atf-bob { animation: atfBob 5.5s ease-in-out infinite; }
      .atf-rise { opacity: 0; animation: atfRise 0.95s cubic-bezier(0.16,1,0.3,1) both; }
      @media (prefers-reduced-motion: reduce) {
        .atf-sway, .atf-float, .atf-spin, .atf-pulse, .atf-bob, .atf-rise {
          animation: none !important; opacity: 1 !important; transform: none !important;
        }
      }
    `}</style>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMAS TROPICAIS
// ═══════════════════════════════════════════════════════════════════════════

/** Folha tropical (nervura + veios), fill = currentColor → tinge pela cor de texto. */
export function Leaf({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 100 128" fill="none" aria-hidden focusable={false}>
      <path d="M50 3C28 30 6 56 50 124C94 56 72 30 50 3Z" fill="currentColor" />
      <path d="M50 15V116" stroke="rgba(0,0,0,0.14)" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M50 40C41 45 32 45 24 40M50 40c9 5 18 5 26 0M50 64c-10 6-21 6-30 0M50 64c9 6 20 6 30 0M50 88c-8 5-17 5-24 0M50 88c8 5 17 5 24 0"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Sol nascente com raios (fan em conic-gradient), gira devagar quando decorativo. */
export function SunRays({
  className = "",
  style,
  spin = true,
}: {
  className?: string;
  style?: CSSProperties;
  spin?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`${spin ? "atf-spin" : ""} ${className}`}
      style={{
        borderRadius: "50%",
        background:
          "repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--ev-rose) 55%, transparent) 0deg 7deg, transparent 7deg 20deg)",
        maskImage: "radial-gradient(circle, transparent 34%, black 36%)",
        WebkitMaskImage: "radial-gradient(circle, transparent 34%, black 36%)",
        ...style,
      }}
    />
  );
}

/** Onda orgânica que emenda uma seção na cor da seguinte (`fill` = qualquer cor CSS). */
export function WaveDivider({
  fill,
  flip = false,
  className = "",
}: {
  fill: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none relative w-full overflow-hidden leading-[0] ${flip ? "rotate-180" : ""} ${className}`}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="block h-[clamp(38px,7vw,86px)] w-full"
      >
        {/* Fill ocupa o TOPO; a borda ondulada revela a seção abaixo. Usado com
            fill = cor da seção ANTERIOR (ivory) → transição contínua e orgânica. */}
        <path
          d="M0 0H1440V60C1260 100 1080 100 900 64 760 36 620 36 480 62 320 92 160 92 0 60Z"
          style={{ fill }}
        />
      </svg>
    </div>
  );
}

/** Confete flutuante — camada absoluta de pastilhas em tokens (funciona em qualquer paleta). */
const CONFETE: { top: string; left: string; size: number; cor: string; delay: string }[] = [
  { top: "14%", left: "9%", size: 13, cor: "rgba(255,255,255,0.9)", delay: "0s" },
  { top: "24%", left: "86%", size: 17, cor: "var(--ev-rose)", delay: "0.7s" },
  { top: "70%", left: "7%", size: 11, cor: "var(--ev-blush)", delay: "1.3s" },
  { top: "78%", left: "84%", size: 15, cor: "rgba(255,255,255,0.72)", delay: "0.4s" },
  { top: "44%", left: "4%", size: 9, cor: "var(--ev-framboesa-bright)", delay: "1s" },
  { top: "18%", left: "58%", size: 10, cor: "rgba(255,255,255,0.85)", delay: "1.7s" },
  { top: "86%", left: "44%", size: 12, cor: "var(--ev-rose)", delay: "0.2s" },
];
export function ConfettiLayer({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {CONFETE.map((c, i) => (
        <span
          key={i}
          className="atf-float absolute rounded-full"
          style={{
            top: c.top,
            left: c.left,
            width: c.size,
            height: c.size,
            background: c.cor,
            animationDelay: c.delay,
            boxShadow: "0 4px 10px -4px rgba(0,0,0,0.25)",
          }}
        />
      ))}
    </div>
  );
}

/** Par de folhas balançando nos cantos — moldura tropical para bandas coloridas. */
export function LeafCorners({ tone = "white" }: { tone?: "white" | "rose" }) {
  const cor = tone === "white" ? "text-white/25" : "text-evt-rose/40";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Leaf className={`atf-sway absolute -left-[3%] top-[-6%] h-[26vw] max-h-[240px] w-auto ${cor}`} />
      <Leaf
        className={`atf-sway absolute -right-[2%] bottom-[-8%] h-[22vw] max-h-[210px] w-auto rotate-[160deg] ${cor}`}
        style={{ animationDelay: "0.8s" }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ÍCONES (inline, currentColor) — próprios deste template
// ═══════════════════════════════════════════════════════════════════════════
type IconProps = { className?: string };
const svg = (paths: ReactNode) =>
  function Icon({ className }: IconProps) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        focusable={false}
      >
        {paths}
      </svg>
    );
  };

export const IconCalendar = svg(
  <>
    <rect x="3.5" y="5" width="17" height="15" rx="4" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
  </>,
);
export const IconClock = svg(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>,
);
export const IconPin = svg(
  <>
    <path d="M12 21c4.5-4.2 6.75-7.65 6.75-10.35A6.75 6.75 0 0 0 5.25 10.65C5.25 13.35 7.5 16.8 12 21Z" />
    <circle cx="12" cy="10.5" r="2.5" />
  </>,
);
export const IconGift = svg(
  <>
    <path d="M4 12h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7ZM3 8h18v4H3zM12 8v13" />
    <path d="M12 8S10.5 4 8.5 4A2 2 0 0 0 8.5 8H12ZM12 8s1.5-4 3.5-4A2 2 0 0 1 15.5 8H12Z" />
  </>,
);
export const IconCamera = svg(
  <>
    <path d="M4 8.5A2 2 0 0 1 6 6.5h1.2l.9-1.6h7.8l.9 1.6H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
    <circle cx="12" cy="12.5" r="3.2" />
  </>,
);
export const IconChat = svg(
  <>
    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-4 4v-4H6.5A2.5 2.5 0 0 1 4 13.5Z" />
    <path d="M8.5 10h7M8.5 12.5h4" />
  </>,
);
export const IconHeart = svg(
  <path d="M12 20s-7.5-4.35-7.5-9.75A4.25 4.25 0 0 1 12 6.9a4.25 4.25 0 0 1 7.5 3.35C19.5 15.65 12 20 12 20Z" />,
);
export const IconMusic = svg(
  <>
    <path d="M9 18V6l10-2v11" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="15" r="2.5" />
  </>,
);
export const IconArrow = svg(<path d="M5 12h14M13 6l6 6-6 6" />);

// ═══════════════════════════════════════════════════════════════════════════
// PEÇAS DE CONTEÚDO (próprias)
// ═══════════════════════════════════════════════════════════════════════════

/** Chip de rótulo (pílula) — substitui o "eyebrow" compartilhado, com bolinha. */
export function AtfChip({
  children,
  onColor = false,
  className = "",
}: {
  children: ReactNode;
  onColor?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-evt-util text-[0.64rem] font-semibold uppercase tracking-[0.26em] ${
        onColor ? "bg-white/20 text-white backdrop-blur-sm" : "text-evt-rosa-ink"
      } ${className}`}
      style={onColor ? undefined : { background: "color-mix(in srgb, var(--ev-rose) 26%, transparent)" }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

/** Cabeçalho de seção próprio: chip + título script + folhinha (não é o SectionHeading). */
export function AtfHeading({
  eyebrow,
  title,
  align = "center",
  onColor = false,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  align?: "center" | "left";
  onColor?: boolean;
  className?: string;
}) {
  const isCenter = align === "center";
  return (
    <div
      className={`flex flex-col gap-4 ${isCenter ? "items-center text-center" : "items-start text-left"} ${className}`}
    >
      {eyebrow && <AtfChip onColor={onColor}>{eyebrow}</AtfChip>}
      <h2
        className={`font-evt-script leading-[0.96] text-[clamp(2.7rem,8.5vw,4.4rem)] ${
          onColor ? "text-white [text-shadow:0_8px_28px_rgba(0,0,0,0.22)]" : "text-evt-ink"
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

/** Cartão-postal de informação (Quando/Onde/Traje): faixa de gradiente + ícone + valor. */
export function AtfInfoCard({
  Icon,
  label,
  value,
  extra,
  grad,
}: {
  Icon: (p: IconProps) => ReactNode;
  label: string;
  value: string;
  extra?: string;
  grad: string;
}) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-[var(--line)] bg-white/80 shadow-[0_26px_60px_-46px_rgba(46,26,32,0.5)] backdrop-blur-sm">
      {/* Faixa de topo em gradiente com o medalhão do ícone */}
      <div className="relative flex items-center justify-center py-6" style={{ background: grad }}>
        <ConfettiLayer className="opacity-70" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-evt-framboesa shadow-[0_10px_26px_-14px_rgba(0,0,0,0.5)]">
          <Icon className="h-7 w-7" />
        </span>
      </div>
      <div className="flex grow flex-col items-center gap-1.5 px-6 py-7 text-center">
        <AtfChip>{label}</AtfChip>
        <p className="mt-1 font-evt-body text-[1.35rem] leading-snug text-evt-ink">{value}</p>
        {extra && <p className="font-evt-body text-[1rem] leading-snug text-evt-ink-soft">{extra}</p>}
      </div>
    </div>
  );
}

/** Botão CTA próprio (pílula) — variante sólida (sobre claro) ou clara (sobre cor). */
export function AtfButton({
  href,
  children,
  tone = "solid",
  className = "",
}: {
  href: string;
  children: ReactNode;
  tone?: "solid" | "onColor" | "ghost";
  className?: string;
}) {
  const base =
    "group inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full px-8 py-3 font-evt-util text-[0.7rem] font-semibold uppercase tracking-[0.22em] transition-[transform,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]";
  const tones = {
    solid:
      "bg-evt-framboesa text-white shadow-[0_16px_38px_-20px_rgba(0,0,0,0.5)] hover:bg-evt-framboesa-deep focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-white",
    onColor:
      "bg-white text-evt-framboesa shadow-[0_16px_40px_-18px_rgba(0,0,0,0.55)] hover:bg-white/90 focus-visible:ring-white focus-visible:ring-offset-transparent",
    ghost:
      "border border-[var(--line-rosa)] text-evt-rosa-ink hover:border-evt-rosa hover:bg-evt-rosa/[0.07] focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-white",
  } as const;
  return (
    <a href={href} className={`${base} ${tones[tone]} ${className}`}>
      {children}
      <IconArrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
    </a>
  );
}

/** Programação em FAIXA COLORIDA — banda full-bleed com o roteiro em cartões alternados. */
export function AtfProgramaFaixa({ itens }: { itens: { hora: string; titulo: string }[] }) {
  if (itens.length === 0) return null;
  return (
    <ol className="relative mx-auto flex max-w-[760px] flex-col gap-3">
      {itens.map((item, i) => (
        <li
          key={`${item.hora}-${item.titulo}-${i}`}
          className="flex items-center gap-4 rounded-[1.15rem] bg-white/15 p-3 pr-5 backdrop-blur-sm sm:gap-6"
        >
          <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[1rem] bg-white/95 leading-none text-evt-framboesa sm:h-[4.6rem] sm:w-[4.6rem]">
            <span className="font-evt-display text-[clamp(1.3rem,4.5vw,1.7rem)] tabular-nums">{item.hora}</span>
          </span>
          <span className="font-evt-body text-[clamp(1.15rem,4vw,1.45rem)] leading-snug text-white">
            {item.titulo}
          </span>
          <span className="ml-auto hidden text-white/50 sm:block" aria-hidden>
            <Leaf className="h-8 w-auto rotate-[18deg]" />
          </span>
        </li>
      ))}
    </ol>
  );
}
