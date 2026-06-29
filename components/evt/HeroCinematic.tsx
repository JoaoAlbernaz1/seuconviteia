// Capa editorial — 100% CSS, SEM JS/motion:
//  • DESKTOP -> foto LANDSCAPE preenchendo + lockup a esquerda.
//  • MOBILE  -> foto RETRATO full-bleed + lockup centrado embaixo.
//  Capa MINIMALISTA: SO nome + idade ("15 anos") + filete branco (◆).
//  Animacoes por @keyframes; sob prefers-reduced-motion tudo fica visivel/estatico.
//  Server component -> sem mismatch de hidratacao.
//
// Props (data-driven): `nome` (capa), `idade` (numero comemorado; oculta se ausente),
// `fotoUrl` (capa mobile/retrato) e `fotoDesktopUrl` (capa desktop/paisagem; cai p/ fotoUrl).
const SILVER = "#D7D7D7";

export function HeroCinematic({
  nome,
  idade,
  fotoUrl,
  fotoDesktopUrl,
}: {
  nome: string;
  idade?: number;
  fotoUrl?: string;
  fotoDesktopUrl?: string;
}) {
  const fotoMobile = fotoUrl ?? "";
  const fotoDesktop = fotoDesktopUrl ?? fotoUrl ?? "";

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-[#160C12] text-evt-ivory">
      {/* ── FOTO (fade + Ken Burns por CSS) ── */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="hero-photo absolute inset-[-4%]" aria-hidden />
      </div>

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
        {/* espacador FIXO (nao elastico): trava o nome em ~59% da altura em toda tela. */}
        <div className="h-[59svh] shrink-0 md:hidden" />

        {/* nome — cursiva Milton */}
        <h1
          className="hero-rise text-center font-evt-script text-[clamp(2.9rem,12vw,4.3rem)] leading-[1.05] text-evt-ivory drop-shadow-[0_2px_22px_rgba(0,0,0,0.9)] md:text-left md:text-[clamp(4.5rem,6.5vw,7.2rem)]"
          style={{ animationDelay: "0.15s" }}
        >
          {nome}
        </h1>

        {idade != null && (
          <>
            {/* MOBILE: idade grande empilhada + anos */}
            <div className="hero-rise mt-3 flex flex-col items-center md:hidden" style={{ animationDelay: "0.3s" }}>
              <span className="font-evt-display text-[clamp(3.6rem,14vw,4.6rem)] leading-none drop-shadow-[0_2px_18px_rgba(0,0,0,0.6)]" style={{ color: "var(--ev-blush)" }}>
                {idade}
              </span>
              <span className="mt-1.5 font-evt-body text-[0.72rem] font-semibold uppercase tracking-[0.48em]" style={{ color: SILVER }}>
                anos
              </span>
            </div>

            {/* DESKTOP: "15 ANOS" (alinhado a esquerda) + filete */}
            <div className="hero-rise mt-6 hidden items-center gap-4 md:flex" style={{ animationDelay: "0.3s" }}>
              <span className="font-evt-display text-[clamp(3rem,4.4vw,4rem)] leading-none tracking-[0.06em]" style={{ color: "var(--ev-blush)" }}>
                {idade} ANOS
              </span>
              <span className="rotate-45 text-[0.6rem]" style={{ color: SILVER }}>◆</span>
              <span className="h-px w-16" style={{ background: `${SILVER}80` }} />
            </div>
          </>
        )}

        {/* divisor ◆ — so mobile (o "filete branco") */}
        <div className="hero-rise mt-5 flex w-full items-center justify-center gap-3 md:hidden" style={{ animationDelay: "0.42s" }} aria-hidden>
          <span className="h-px w-20" style={{ background: `${SILVER}66` }} />
          <span className="rotate-45 text-[0.55rem]" style={{ color: SILVER }}>◆</span>
          <span className="h-px w-20" style={{ background: `${SILVER}66` }} />
        </div>
      </div>

      {/* ── indicador de rolagem — desktop ── */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 hidden -translate-x-1/2 md:block">
        <svg className="scroll-cue h-5 w-5 text-[#D7D7D7]/75" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      <style>{`
        .hero-photo {
          background-image: url('${fotoMobile}');
          background-position: 50% 30%;
          background-size: cover;
          background-repeat: no-repeat;
          transform-origin: 60% 40%;
          opacity: 0;
          animation: heroFade 1.6s cubic-bezier(0.16,1,0.3,1) both, heroKen 30s ease-in-out 1.6s infinite alternate;
        }
        @media (min-width: 768px) {
          .hero-photo { background-image: url('${fotoDesktop}'); background-position: 64% 22%; }
        }
        @keyframes heroFade { from { opacity: 0; transform: scale(1.06); } to { opacity: 1; transform: scale(1); } }
        @keyframes heroKen {
          from { transform: scale(1) translate3d(0,0,0); }
          to   { transform: scale(1.03) translate3d(-0.7%,-0.6%,0); }
        }
        @keyframes heroRise {
          from { opacity: 0; transform: translateY(20px); filter: blur(7px); }
          to   { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .hero-rise { opacity: 0; animation: heroRise 1s cubic-bezier(0.16,1,0.3,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .hero-photo { opacity: 1 !important; animation: none !important; transform: none !important; }
          .hero-rise { opacity: 1 !important; animation: none !important; transform: none !important; filter: none !important; }
        }
      `}</style>
    </section>
  );
}
