// CAPA — Casamento Noite Luxo (Black Tie). ÚNICO template com capa ESCURA.
// Server component, animação 100% CSS scoped (prefixo `nl-`). Técnica inspirada no
// HeroCinematic: foto full-bleed + scrims/vinheta ESCUROS (grafite) para clima de
// gala noturna. Nomes do casal GIGANTES em ouro/champagne, moldura + filete
// dourados, DATA em destaque e DRESS CODE valorizado.
//
// Cores: o fundo/scrim são grafite fixos (capa escura); os ACENTOS dourados vêm da
// paleta (var(--ev-rosa)/--ev-rose/--ev-framboesa) → seguem o tema do evento.
// Reduced-motion: tudo estático.
import Image from "next/image";

export function CapaNoiteLuxo({
  nome,
  kicker,
  data,
  horario,
  local,
  traje,
  fotoUrl,
  fotoDesktopUrl,
}: {
  nome: string;
  kicker: string;
  data: string;
  horario?: string;
  local?: string;
  traje?: string;
  fotoUrl?: string;
  fotoDesktopUrl?: string;
}) {
  const foto = fotoDesktopUrl || fotoUrl || "";
  const dressCode = traje?.trim() || "Black tie";

  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[#14110C] text-[#F5EBD2]">
      {/* ── FOTO full-bleed (fade + Ken Burns por CSS) ── */}
      {foto ? (
        <div className="nl-photo absolute inset-0">
          <Image
            src={foto}
            alt={`Foto de ${nome}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "50% 38%" }}
          />
        </div>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 30%, color-mix(in srgb, var(--ev-framboesa-deep) 22%, transparent), transparent 62%), #14110C",
          }}
        />
      )}

      {/* ── Scrims escuros — vinheta central + barras topo/base p/ legibilidade ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(125% 95% at 50% 48%, rgba(11,9,6,0.34), rgba(11,9,6,0.70) 68%, rgba(11,9,6,0.90))",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0B0906]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#0B0906]/88 to-transparent" />
      </div>

      {/* ── Moldura dourada (filete black-tie) ── */}
      <div
        aria-hidden
        className="nl-frame pointer-events-none absolute inset-[clamp(0.85rem,3vw,1.6rem)] rounded-[3px]"
        style={{ border: "1px solid color-mix(in srgb, var(--ev-rosa) 52%, transparent)" }}
      />

      {/* ── LOCKUP central ── */}
      <div className="relative z-10 flex w-full max-w-[860px] flex-col items-center gap-[clamp(1.15rem,3.2vw,1.9rem)] px-[clamp(1.75rem,7vw,3.5rem)] py-[clamp(4.5rem,10vw,7rem)] text-center">
        {/* eyebrow */}
        <p
          className="nl-rise font-evt-util text-[0.7rem] uppercase tracking-[0.46em]"
          style={{ color: "var(--ev-rose)", animationDelay: "0.05s" }}
        >
          {kicker}
        </p>

        {/* filete ◆ dourado */}
        <div className="nl-rise flex items-center gap-3" style={{ animationDelay: "0.12s" }} aria-hidden>
          <span className="h-px w-12" style={{ background: "color-mix(in srgb, var(--ev-rosa) 65%, transparent)" }} />
          <span className="rotate-45 text-[0.55rem]" style={{ color: "var(--ev-rosa)" }}>◆</span>
          <span className="h-px w-12" style={{ background: "color-mix(in srgb, var(--ev-rosa) 65%, transparent)" }} />
        </div>

        {/* NOMES do casal — gigantes, ouro/champagne */}
        <h1
          className="nl-names nl-rise font-evt-script leading-[0.92] [text-wrap:balance] text-[clamp(3rem,13vw,7.5rem)] drop-shadow-[0_6px_34px_rgba(0,0,0,0.65)]"
          style={{ animationDelay: "0.2s" }}
        >
          {nome}
        </h1>

        {/* DATA em destaque + horário */}
        <div className="nl-rise mt-1 flex flex-col items-center gap-3" style={{ animationDelay: "0.3s" }}>
          <span className="h-px w-24" style={{ background: "color-mix(in srgb, var(--ev-rose) 55%, transparent)" }} aria-hidden />
          <p
            className="font-evt-display uppercase text-[clamp(1.35rem,4.4vw,2.35rem)] leading-tight tracking-[0.16em]"
            style={{ color: "#F5EBD2" }}
          >
            {data}
            {horario ? (
              <span style={{ color: "var(--ev-rose)" }}> · {horario}</span>
            ) : null}
          </p>
          {local && (
            <p
              className="font-evt-body text-[clamp(1rem,2.6vw,1.2rem)]"
              style={{ color: "rgba(245,235,210,0.74)" }}
            >
              {local}
            </p>
          )}
        </div>

        {/* DRESS CODE valorizado — badge dourado */}
        <div
          className="nl-rise mt-2 inline-flex items-center gap-3 rounded-full px-[clamp(1.1rem,3.5vw,1.6rem)] py-2.5"
          style={{
            border: "1px solid color-mix(in srgb, var(--ev-rosa) 60%, transparent)",
            background: "color-mix(in srgb, #0B0906 45%, transparent)",
            animationDelay: "0.4s",
          }}
        >
          <span className="rotate-45 text-[0.48rem]" style={{ color: "var(--ev-rosa)" }} aria-hidden>◆</span>
          <span className="font-evt-util text-[0.64rem] uppercase tracking-[0.34em]" style={{ color: "var(--ev-rose)" }}>
            Traje · {dressCode}
          </span>
        </div>
      </div>

      {/* ── indicador de rolagem ── */}
      <div className="pointer-events-none absolute bottom-[clamp(1.4rem,4vw,2.4rem)] left-1/2 z-20 -translate-x-1/2">
        <svg
          className="nl-cue h-5 w-5"
          style={{ color: "color-mix(in srgb, var(--ev-rose) 80%, transparent)" }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>

      <style>{`
        .nl-names { color: var(--ev-rose); }
        @supports ((-webkit-background-clip: text) or (background-clip: text)) {
          .nl-names {
            background-image: linear-gradient(178deg, #F8EDCB 0%, var(--ev-rose) 46%, var(--ev-rosa) 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
          }
        }
        @keyframes nlPhotoIn { from { opacity: 0; transform: scale(1.07); } to { opacity: 1; transform: scale(1); } }
        @keyframes nlKen { from { transform: scale(1) translate3d(0,0,0); } to { transform: scale(1.05) translate3d(-0.8%,-0.7%,0); } }
        @keyframes nlRise { from { opacity: 0; transform: translateY(20px); filter: blur(6px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        @keyframes nlCue { 0%,100% { transform: translateY(0); opacity: 0.55; } 50% { transform: translateY(5px); opacity: 1; } }
        .nl-photo {
          opacity: 0;
          transform-origin: 55% 42%;
          animation: nlPhotoIn 1.7s cubic-bezier(0.16,1,0.3,1) both, nlKen 34s ease-in-out 1.7s infinite alternate;
        }
        .nl-rise { opacity: 0; animation: nlRise 1s cubic-bezier(0.16,1,0.3,1) both; }
        .nl-cue { animation: nlCue 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .nl-photo, .nl-rise, .nl-frame, .nl-cue {
            opacity: 1 !important;
            animation: none !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>
    </section>
  );
}
