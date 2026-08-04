// CAPA — 15 anos Glamour Rosé. Clone FIEL da capa cinematográfica do site da
// Maria Clara (festa-15-maria-clara/components/HeroCinematic.tsx): foto full-bleed
// com fade + Ken Burns por CSS, lockup MINIMALISTA (nome em cursiva + "N anos" +
// filete ◆). Desktop = foto paisagem + lockup à esquerda; mobile = foto retrato
// full-bleed + lockup centrado embaixo. Server component (sem JS/motion lib);
// sob prefers-reduced-motion tudo fica visível e estático.
//
// Data-driven: nome/idade/fotos vêm de EventoFesta. Cores via vars do tema
// (`--ev-*`); SILVER é um neutro do lockup (fora da paleta).

const SILVER = "#D7D7D7";

export function CapaGlamour({
  nome,
  idade,
  fotoUrl,
  fotoDesktopUrl,
  escala,
  overlay,
}: {
  nome: string;
  idade?: number;
  /** ignorados nesta capa minimalista (mantidos p/ a assinatura do chamador) */
  kicker?: string;
  data?: string;
  horario?: string;
  local?: string;
  fotoUrl?: string;
  fotoDesktopUrl?: string;
  /** Multiplicador do tamanho do lockup (nome/idade juntos). 1 = padrão. */
  escala?: number;
  /** Escurecer a foto p/ melhorar a leitura do nome. */
  overlay?: boolean;
}) {
  const fotoMobile = fotoUrl || fotoDesktopUrl || "";
  const fotoDesktop = fotoDesktopUrl || fotoUrl || "";
  const esc = escala && escala > 0 ? escala : 1;

  return (
    <section
      data-sec="capa"
      className="relative min-h-[100svh] w-full overflow-hidden bg-[#160C12] text-[var(--ev-ivory)]"
      style={{ "--capa-escala": String(esc) } as import("react").CSSProperties}
    >
      {/* ── FOTO (fade + Ken Burns por CSS) ── */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="qgr-hero-photo absolute inset-x-[-4%] top-[-4%] bottom-0 md:inset-[-4%]" aria-hidden />
      </div>

      {/* ── Escurecimento opcional da foto (melhora a leitura do nome) ── */}
      {overlay && <div className="pointer-events-none absolute inset-0 bg-black/35" aria-hidden />}

      {/* ── Scrims MOBILE (lockup embaixo) ── */}
      <div className="pointer-events-none absolute inset-0 md:hidden">
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/92 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
      </div>

      {/* ── Scrims DESKTOP — esquerda (lockup) + topo (navbar) + base (cue) ── */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute inset-y-0 left-0 w-[64%] bg-gradient-to-r from-[#0f070b] from-12% via-[#0f070b]/72 via-42% to-transparent" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* ── LOCKUP — mobile: embaixo/centro · desktop: esquerda/centro-vertical ── */}
      <div className="relative z-10 flex min-h-[100svh] max-w-md flex-col px-7 pb-10 pt-0 md:max-w-[58%] md:items-start md:justify-center md:pb-0 md:pl-[clamp(3rem,7vw,6.5rem)] md:pr-10 md:pt-24">
        {/* espaçador FIXO: trava o nome em ~59% da altura em toda tela (capa idêntica em todos os tamanhos) */}
        <div className="h-[52svh] shrink-0 md:hidden" />

        {/* nome — cursiva (Milton) */}
        <h1
          data-sec="capa-nome"
          data-live="nome"
          className="qgr-hero-rise qgr-nome text-center font-evt-script leading-[1.05] text-[var(--ev-ivory)] drop-shadow-[0_2px_22px_rgba(0,0,0,0.9)] md:text-left"
          style={{ animationDelay: "0.15s" }}
        >
          {nome}
        </h1>

        {idade != null && (
          <>
            {/* MOBILE: N grande empilhado + anos */}
            <div data-sec="capa-idade" className="qgr-hero-rise mt-3 flex flex-col items-center md:hidden" style={{ animationDelay: "0.3s" }}>
              <span data-live="idade" className="qgr-idade-m font-evt-display leading-none drop-shadow-[0_2px_18px_rgba(0,0,0,0.6)] text-[var(--ev-blush)]">
                {idade}
              </span>
              <span className="qgr-anos-m mt-1.5 font-evt-body font-semibold uppercase tracking-[0.48em]" style={{ color: SILVER }}>
                anos
              </span>
            </div>

            {/* DESKTOP: N ANOS (alinhado à esquerda) + filete */}
            <div data-sec="capa-idade" className="qgr-hero-rise mt-6 hidden items-center gap-4 md:flex" style={{ animationDelay: "0.3s" }}>
              <span className="qgr-idade-d font-evt-display leading-none tracking-[0.06em] text-[var(--ev-blush)]">
                <span data-live="idade">{idade}</span> ANOS
              </span>
              <span className="rotate-45 text-[0.6rem]" style={{ color: SILVER }}>◆</span>
              <span className="h-px w-16" style={{ background: `${SILVER}80` }} />
            </div>
          </>
        )}

        {/* divisor ◆ — só mobile (o "filete branco") */}
        <div className="qgr-hero-rise mt-5 flex w-full items-center justify-center gap-3 md:hidden" style={{ animationDelay: "0.42s" }} aria-hidden>
          <span className="h-px w-20" style={{ background: `${SILVER}66` }} />
          <span className="rotate-45 text-[0.55rem]" style={{ color: SILVER }}>◆</span>
          <span className="h-px w-20" style={{ background: `${SILVER}66` }} />
        </div>
      </div>

      {/* ── indicador de rolagem — desktop ── */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 hidden -translate-x-1/2 md:block">
        <svg className="qgr-scroll-cue h-5 w-5 text-[#D7D7D7]/75" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      <style>{`
        .qgr-hero-photo {
          background-image: url('${fotoMobile}');
          background-position: 50% 28%;
          background-size: cover;
          background-repeat: no-repeat;
          transform-origin: 60% 40%;
          opacity: 0;
          animation: qgrHeroFade 1.6s cubic-bezier(0.16,1,0.3,1) both, qgrHeroKen 30s ease-in-out 1.6s infinite alternate;
        }
        @media (min-width: 768px) {
          .qgr-hero-photo { background-image: url('${fotoDesktop}'); background-position: 50% 42%; background-size: cover; }
        }
        @keyframes qgrHeroFade { from { opacity: 0; transform: scale(1.06); } to { opacity: 1; transform: scale(1); } }
        @keyframes qgrHeroKen {
          from { transform: scale(1) translate3d(0,0,0); }
          to   { transform: scale(1.03) translate3d(-0.7%,-0.6%,0); }
        }
        @keyframes qgrHeroRise {
          from { opacity: 0; transform: translateY(20px); filter: blur(7px); }
          to   { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .qgr-hero-rise { opacity: 0; animation: qgrHeroRise 1s cubic-bezier(0.16,1,0.3,1) both; }
        .qgr-scroll-cue { animation: qgrHeroFade 1.2s ease 1.8s both; }
        /* Tamanho do lockup — escala uniforme (nome+idade juntos) via --capa-escala,
           multiplicando os tamanhos responsivos (clamp) p/ ficar ajustado em qualquer tela. */
        .qgr-nome   { font-size: calc(clamp(3.2rem,13.5vw,4.8rem) * var(--capa-escala, 1) * var(--ev-capa-fator, 1)); }
        .qgr-idade-m{ font-size: calc(clamp(3.6rem,14vw,4.6rem) * var(--capa-escala, 1)); }
        .qgr-anos-m { font-size: calc(0.72rem * var(--capa-escala, 1)); }
        .qgr-idade-d{ font-size: calc(clamp(3rem,4.4vw,4rem) * var(--capa-escala, 1)); }
        @media (min-width: 768px) {
          .qgr-nome { font-size: calc(clamp(4.5rem,6.5vw,7.2rem) * var(--capa-escala, 1) * var(--ev-capa-fator, 1)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .qgr-hero-photo { opacity: 1 !important; animation: none !important; transform: none !important; }
          .qgr-hero-rise, .qgr-scroll-cue { opacity: 1 !important; animation: none !important; transform: none !important; filter: none !important; }
        }
      `}</style>
    </section>
  );
}
