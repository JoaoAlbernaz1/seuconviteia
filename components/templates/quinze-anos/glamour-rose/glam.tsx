// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVOS PRÓPRIOS do template "Glamour Rosé" (quinze-anos).
// ─────────────────────────────────────────────────────────────────────────────
// Este template é o mais GLAM/brilho da família 15 anos: foil rosé com brilho
// perolado, faíscas (sparkles) e superfícies glossy. NADA de Card/SectionHeading
// compartilhados — estes primitivos são só deste corpo. Server-safe (sem estado):
// podem ser usados por Server Components. As animações são scoped em `qgr-*` e
// têm reset sob prefers-reduced-motion (ver QgrStyle).
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import Link from "next/link";

// ── Faísca de 4 pontas (assinatura glam) ─────────────────────────────────────
export function QgrSparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable={false} className={className}>
      <path d="M12 0c.5 5.4 3.6 8.5 12 9-8.4.5-11.5 3.6-12 9-.5-5.4-3.6-8.5-12-9 8.4-.5 11.5-3.6 12-9Z" />
    </svg>
  );
}

// ── Trio de faíscas decorativo (twinkle) ─────────────────────────────────────
export function QgrSparkleTrio({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`pointer-events-none inline-flex items-center gap-1.5 text-evt-rosa ${className}`}>
      <QgrSparkle className="qgr-twinkle h-2.5 w-2.5 opacity-70" />
      <QgrSparkle className="qgr-twinkle h-4 w-4" />
      <QgrSparkle className="qgr-twinkle h-2 w-2 opacity-60" />
    </span>
  );
}

// ── Eyebrow com foil (letras rosa, brilho perolado que desliza) ──────────────
export function QgrEyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`qgr-foil font-evt-util text-[0.72rem] font-medium uppercase tracking-[0.36em] ${className}`}
    >
      {children}
    </p>
  );
}

// ── Divisor: filete rosé → faísca central → filete rosé (com rótulo opcional) ─
export function QgrDivider({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="qgr-rule h-px w-[clamp(2.5rem,14vw,6rem)]" />
      {label ? (
        <span className="qgr-foil font-evt-util text-[0.6rem] font-semibold uppercase tracking-[0.4em]">
          {label}
        </span>
      ) : (
        <QgrSparkle className="qgr-twinkle h-3.5 w-3.5 text-evt-rosa" />
      )}
      <span className="qgr-rule h-px w-[clamp(2.5rem,14vw,6rem)]" />
    </div>
  );
}

// ── Título de seção — eyebrow foil + heading em cursiva + divisor de faíscas ──
export function QgrHeading({
  eyebrow,
  titulo,
  align = "center",
  className = "",
}: {
  eyebrow?: string;
  titulo: string;
  align?: "center" | "left";
  className?: string;
}) {
  const left = align === "left";
  return (
    <div className={`${left ? "text-left" : "text-center"} ${className}`}>
      {eyebrow && <QgrEyebrow>{eyebrow}</QgrEyebrow>}
      <h2
        className={`font-evt-script leading-[1.02] text-evt-ink text-[calc(clamp(2.9rem,9vw,4.6rem)*var(--ev-fonte-fator,1))] ${
          eyebrow ? "mt-4" : ""
        }`}
      >
        {titulo}
      </h2>
      <div className={`mt-5 flex ${left ? "justify-start" : "justify-center"}`}>
        <QgrSparkleTrio />
      </div>
    </div>
  );
}

// ── Painel glossy com moldura foil (double-bezel) — para os momentos "hero" ──
export function QgrPanel({
  children,
  className = "",
  autoSheen = false,
  style,
}: {
  children: ReactNode;
  className?: string;
  autoSheen?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div className="qgr-frame rounded-[calc(1.9rem+3px)] p-[3px]" style={style}>
      <div className="qgr-glass relative overflow-hidden rounded-[1.9rem]">
        <span className="qgr-toplight pointer-events-none absolute inset-x-0 top-0 h-32" aria-hidden />
        <span className={`qgr-sheen ${autoSheen ? "qgr-sheen--auto" : ""}`} aria-hidden />
        {/* layout (padding/grid) vai no wrapper de conteúdo, ACIMA do sheen (z-10) */}
        <div className={`relative z-10 ${className}`}>{children}</div>
      </div>
    </div>
  );
}

// ── Cartão glossy simples — brilho no topo + sweep no hover ───────────────────
export function QgrCard({
  children,
  className = "",
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`qgr-glass qgr-hover-sheen group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] ${
        interactive ? "qgr-lift" : ""
      }`}
    >
      <span className="qgr-toplight pointer-events-none absolute inset-x-0 top-0 h-24" aria-hidden />
      <span className="qgr-sheen" aria-hidden />
      {/* layout (flex/padding) vai no wrapper de conteúdo, que preenche a altura (flex-1) e fica acima do sheen (z-10) */}
      <div className={`relative z-10 flex-1 ${className}`}>{children}</div>
    </div>
  );
}

// ── Link glam — pílula com brilho (primary preenchido / ghost contorno) ───────
type QgrLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
} & Omit<ComponentProps<typeof Link>, "href" | "children" | "className">;

export function QgrLink({ href, children, variant = "ghost", className = "", ...rest }: QgrLinkProps) {
  const base =
    "group relative inline-flex min-h-[52px] items-center justify-center gap-2.5 overflow-hidden rounded-full px-8 py-3.5 font-evt-util text-[0.7rem] font-semibold uppercase tracking-[0.26em] transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98]";
  const skin =
    variant === "primary"
      ? "qgr-btn-primary text-white hover:-translate-y-0.5"
      : "qgr-btn-ghost text-evt-rosa-ink hover:-translate-y-0.5";
  return (
    <Link href={href} className={`${base} ${skin} ${className}`} {...rest}>
      <span className="relative z-10 inline-flex items-center gap-2.5">{children}</span>
      <span className="qgr-sheen" aria-hidden />
    </Link>
  );
}

// ── Numeral "15" gigante com foil perolado (elemento visual forte) ────────────
export function QgrNumeral({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span aria-hidden className={`qgr-numeral font-evt-display leading-[0.8] ${className}`}>
      {n}
    </span>
  );
}

// ── Faíscas soltas de fundo (campo decorativo) ────────────────────────────────
const CAMPO_FAISCAS = [
  { top: "12%", left: "8%", size: "h-3 w-3", op: "opacity-50", d: "0s" },
  { top: "22%", left: "88%", size: "h-4 w-4", op: "opacity-70", d: "0.8s" },
  { top: "68%", left: "14%", size: "h-2.5 w-2.5", op: "opacity-40", d: "1.4s" },
  { top: "78%", left: "82%", size: "h-3.5 w-3.5", op: "opacity-60", d: "0.4s" },
  { top: "44%", left: "94%", size: "h-2 w-2", op: "opacity-40", d: "2s" },
  { top: "52%", left: "5%", size: "h-2.5 w-2.5", op: "opacity-45", d: "1.1s" },
] as const;

export function QgrSparkleField() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {CAMPO_FAISCAS.map((m, i) => (
        <span key={i} className="absolute" style={{ top: m.top, left: m.left, animationDelay: m.d }}>
          <QgrSparkle className={`qgr-twinkle text-evt-rosa ${m.size} ${m.op}`} />
        </span>
      ))}
    </div>
  );
}

// ── <style> scoped do template (uma vez por página) ───────────────────────────
export function QgrStyle() {
  return (
    <style>{`
      /* Glamour Rosé — brilho perolado, faíscas, superfícies glossy. Scoped qgr-*. */
      @keyframes qgrShimmer { 0% { background-position: 220% 50%; } 100% { background-position: -120% 50%; } }
      @keyframes qgrSheen { 0% { transform: translateX(-130%); } 55%, 100% { transform: translateX(240%); } }
      @keyframes qgrTwinkle { 0%, 100% { opacity: .25; transform: scale(.65) rotate(0deg); } 50% { opacity: 1; transform: scale(1.08) rotate(18deg); } }
      @keyframes qgrFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
      @keyframes qgrGlow { 0%, 100% { opacity: .45; } 50% { opacity: .9; } }
      @keyframes qgrRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }

      /* Foil rosé com highlight perolado que desliza (eyebrows, rótulos). */
      .qgr-foil {
        background: linear-gradient(100deg,
          var(--ev-rosa-ink) 0%,
          var(--ev-framboesa) 20%,
          color-mix(in srgb, var(--ev-rose) 52%, #ffffff) 40%,
          var(--ev-framboesa-bright) 60%,
          var(--ev-rosa-ink) 100%);
        background-size: 220% 100%;
        -webkit-background-clip: text; background-clip: text;
        color: transparent;
        animation: qgrShimmer 7s linear infinite;
      }
      /* Numeral gigante — foil mais fundo, brilho champanhe no centro. */
      .qgr-numeral {
        background: linear-gradient(118deg,
          var(--ev-framboesa-deep) 0%,
          var(--ev-framboesa) 24%,
          color-mix(in srgb, var(--ev-rose) 60%, #fff7ec) 46%,
          var(--ev-framboesa-bright) 64%,
          var(--ev-rosa-ink) 100%);
        background-size: 260% 100%;
        -webkit-background-clip: text; background-clip: text;
        color: transparent;
        animation: qgrShimmer 9s linear infinite;
      }
      /* Filete com gradiente rosé (some nas pontas). */
      .qgr-rule {
        border: 0;
        background: linear-gradient(90deg, transparent, var(--ev-rosa), transparent);
        opacity: .8;
      }
      /* Superfície glossy: branco translúcido, hairline rosé, sombra rosada. */
      .qgr-glass {
        background:
          linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.90)),
          color-mix(in srgb, var(--ev-blush-soft) 60%, #fffdf9);
        border: 1px solid color-mix(in srgb, var(--ev-rosa) 26%, transparent);
        box-shadow:
          0 30px 66px -44px color-mix(in srgb, var(--ev-framboesa) 60%, transparent),
          inset 0 1px 0 rgba(255,255,255,.7);
      }
      /* Moldura foil (double-bezel) dos painéis hero. */
      .qgr-frame {
        background: linear-gradient(135deg,
          color-mix(in srgb, var(--ev-rosa) 70%, #fff),
          color-mix(in srgb, var(--ev-rose) 55%, #fff7ec) 42%,
          color-mix(in srgb, var(--ev-framboesa) 60%, #fff) 100%);
        box-shadow: 0 40px 90px -56px color-mix(in srgb, var(--ev-framboesa) 70%, transparent);
      }
      /* Brilho superior (top-light) das superfícies. */
      .qgr-toplight {
        background: linear-gradient(180deg, rgba(255,255,255,.85), transparent);
      }
      /* Sweep de luz (sheen) — barra branca diagonal clipada no formato. */
      .qgr-sheen { position: absolute; inset: 0; overflow: hidden; border-radius: inherit; pointer-events: none; z-index: 5; }
      .qgr-sheen::before {
        content: ""; position: absolute; top: -20%; bottom: -20%; left: 0; width: 42%;
        background: linear-gradient(100deg, transparent, rgba(255,255,255,.6), transparent);
        transform: translateX(-130%);
      }
      .qgr-sheen--auto::before { animation: qgrSheen 6.5s ease-in-out 1.5s infinite; }
      .qgr-hover-sheen:hover .qgr-sheen::before { animation: qgrSheen 1.1s ease-out; }
      .qgr-btn-primary:hover .qgr-sheen::before,
      .qgr-btn-ghost:hover .qgr-sheen::before { animation: qgrSheen 1.1s ease-out; }

      /* Faíscas / flutuação. */
      .qgr-twinkle { animation: qgrTwinkle 3.4s ease-in-out infinite; transform-origin: center; }
      .qgr-float { animation: qgrFloat 6.5s ease-in-out infinite; }
      .qgr-glow { animation: qgrGlow 4.5s ease-in-out infinite; }
      .qgr-rise { opacity: 0; animation: qgrRise .95s cubic-bezier(.16,1,.3,1) both; }

      /* Lift dos cards interativos. */
      .qgr-lift { transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s ease; }
      .qgr-lift:hover {
        transform: translateY(-6px);
        box-shadow: 0 42px 80px -46px color-mix(in srgb, var(--ev-framboesa) 75%, transparent), inset 0 1px 0 rgba(255,255,255,.8);
      }

      /* Botões glam. */
      .qgr-btn-primary {
        background: linear-gradient(120deg, var(--ev-framboesa-bright) 0%, var(--ev-framboesa) 50%, var(--ev-framboesa-deep) 100%);
        box-shadow: 0 18px 40px -20px color-mix(in srgb, var(--ev-framboesa) 80%, transparent);
      }
      .qgr-btn-primary:hover { box-shadow: 0 24px 52px -18px color-mix(in srgb, var(--ev-framboesa) 90%, transparent); }
      .qgr-btn-ghost {
        background: color-mix(in srgb, var(--ev-blush-soft) 55%, #fff);
        border: 1px solid color-mix(in srgb, var(--ev-rosa) 45%, transparent);
      }
      .qgr-btn-ghost:hover { border-color: var(--ev-rosa); background: color-mix(in srgb, var(--ev-rose) 16%, #fff); }

      /* Tiles do contador — glossy com brilho suave ambiente. */
      .qgr-tile {
        position: relative; overflow: hidden;
        background:
          linear-gradient(180deg, rgba(255,255,255,.97), rgba(255,255,255,.88)),
          color-mix(in srgb, var(--ev-blush-soft) 70%, #fff);
        border: 1px solid color-mix(in srgb, var(--ev-rosa) 30%, transparent);
        border-radius: 1.15rem;
        box-shadow: 0 24px 54px -40px color-mix(in srgb, var(--ev-framboesa) 70%, transparent), inset 0 1px 0 rgba(255,255,255,.75);
      }

      @media (prefers-reduced-motion: reduce) {
        .qgr-foil, .qgr-numeral { animation: none !important; background-position: 50% 50% !important; }
        .qgr-sheen::before { animation: none !important; display: none !important; }
        .qgr-twinkle, .qgr-float, .qgr-glow, .qgr-rise { animation: none !important; opacity: 1 !important; transform: none !important; }
        .qgr-lift:hover { transform: none !important; }
      }
    `}</style>
  );
}
