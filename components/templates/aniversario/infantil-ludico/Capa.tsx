// CAPA — Aniversário Infantil Lúdico. Server component, 100% CSS scoped (prefixo
// `ail-`). Clima CLARO e alegre: blobs/bolhas ARREDONDADAS + confetti (círculos CSS)
// derivados dos tokens (--ev-*), foto em moldura CIRCULAR com anel colorido, NOME
// divertido GIGANTE (font-evt-script) e IDADE enorme (font-evt-display) quando
// existir. As formas derivam da paleta, então funciona em qualquer preset.
// Reduced-motion: estático.
import Image from "next/image";
import { Flourish } from "@/components/evt/icons";

type Blob = { className: string; cor: string; opacidade: number; raio: string; anim: string };

// Blobs suaves de fundo — círculos/quadrados arredondados grandes, tons da paleta.
const BLOBS: Blob[] = [
  { className: "-left-16 -top-10 h-56 w-56", cor: "var(--ev-blush)", opacidade: 0.7, raio: "9999px", anim: "ail-cv-float-a" },
  { className: "-right-14 top-20 h-44 w-44", cor: "var(--ev-rose)", opacidade: 0.28, raio: "2.75rem", anim: "ail-cv-float-b" },
  { className: "-right-20 bottom-4 h-64 w-64", cor: "var(--ev-blush)", opacidade: 0.55, raio: "9999px", anim: "ail-cv-float-c" },
  { className: "-left-12 bottom-16 h-40 w-40", cor: "var(--ev-framboesa-bright)", opacidade: 0.16, raio: "2.5rem", anim: "ail-cv-float-b" },
];

type Dot = { top: string; left: string; size: string; cor: string; raio: string; delay: string };

// Confetti — pontinhos e quadradinhos arredondados espalhados, cores da paleta.
const CONFETTI: Dot[] = [
  { top: "14%", left: "12%", size: "0.85rem", cor: "var(--ev-framboesa)", raio: "9999px", delay: "0s" },
  { top: "22%", left: "84%", size: "0.7rem", cor: "var(--ev-rose)", raio: "0.35rem", delay: "0.4s" },
  { top: "38%", left: "6%", size: "0.6rem", cor: "var(--ev-framboesa-bright)", raio: "9999px", delay: "0.8s" },
  { top: "9%", left: "62%", size: "0.55rem", cor: "var(--ev-rosa)", raio: "9999px", delay: "0.2s" },
  { top: "70%", left: "16%", size: "0.75rem", cor: "var(--ev-rose)", raio: "9999px", delay: "0.6s" },
  { top: "78%", left: "88%", size: "0.9rem", cor: "var(--ev-framboesa)", raio: "0.35rem", delay: "0.3s" },
  { top: "56%", left: "92%", size: "0.6rem", cor: "var(--ev-framboesa-bright)", raio: "9999px", delay: "0.9s" },
  { top: "88%", left: "48%", size: "0.65rem", cor: "var(--ev-rosa)", raio: "9999px", delay: "0.5s" },
  { top: "48%", left: "80%", size: "0.5rem", cor: "var(--ev-framboesa-deep)", raio: "9999px", delay: "0.1s" },
];

export function CapaInfantil({
  nome,
  idade,
  kicker,
  data,
  horario,
  local,
  tema,
  fotoUrl,
  fotoDesktopUrl,
}: {
  nome: string;
  idade?: number;
  kicker: string;
  data: string;
  horario?: string;
  local?: string;
  tema?: string;
  fotoUrl?: string;
  fotoDesktopUrl?: string;
}) {
  const foto = fotoUrl || fotoDesktopUrl || "";
  const inicial = nome.trim().charAt(0).toUpperCase();

  return (
    <section className="ail-cover relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-evt-ivory text-evt-ink">
      {/* Wash quente + bolhas arredondadas de fundo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -8%, color-mix(in srgb, var(--ev-blush) 70%, transparent), transparent 60%), radial-gradient(90% 60% at 50% 118%, color-mix(in srgb, var(--ev-rose) 30%, transparent), transparent 64%)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {BLOBS.map((b, i) => (
          <span
            key={i}
            className={`${b.anim} absolute block ${b.className}`}
            style={{ background: b.cor, opacity: b.opacidade, borderRadius: b.raio }}
          />
        ))}
        {CONFETTI.map((d, i) => (
          <span
            key={`c${i}`}
            className="ail-cv-bob absolute block"
            style={{
              top: d.top,
              left: d.left,
              width: d.size,
              height: d.size,
              background: d.cor,
              borderRadius: d.raio,
              animationDelay: d.delay,
            }}
          />
        ))}
      </div>

      {/* Conteúdo. */}
      <div className="relative z-10 mx-auto flex w-full max-w-[820px] flex-col items-center gap-[clamp(1.3rem,3.5vw,2rem)] px-[clamp(1.5rem,6vw,3rem)] py-[clamp(4rem,9vw,6.5rem)] text-center">
        {/* Foto em moldura CIRCULAR com anel colorido + disco atrás (profundidade). */}
        <div className="ail-cv-pop relative">
          <span
            aria-hidden
            className="absolute -right-4 -top-4 -z-10 h-full w-full rounded-full"
            style={{ background: "color-mix(in srgb, var(--ev-rose) 55%, transparent)" }}
          />
          <div
            className="rounded-full p-[7px] shadow-[0_30px_70px_-40px_rgba(46,26,32,0.5)]"
            style={{ background: "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))" }}
          >
            <div className="rounded-full bg-evt-ivory p-[5px]">
              <div className="relative aspect-square w-[clamp(10rem,40vw,14rem)] overflow-hidden rounded-full">
                {foto ? (
                  <Image
                    src={foto}
                    alt={`Foto de ${nome}`}
                    fill
                    priority
                    sizes="(max-width: 768px) 40vw, 14rem"
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ background: "linear-gradient(150deg, var(--ev-blush-soft), var(--ev-blush))" }}
                  >
                    {inicial ? (
                      <span className="font-evt-script text-[clamp(3.5rem,14vw,5rem)] leading-none text-evt-rosa-ink">
                        {inicial}
                      </span>
                    ) : (
                      <Flourish className="h-5 w-24 text-evt-rosa" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Confetti que espia perto da foto. */}
          <span
            aria-hidden
            className="ail-cv-bob absolute -left-2 top-3 block h-3.5 w-3.5 rounded-full"
            style={{ background: "var(--ev-framboesa-bright)", animationDelay: "0.2s" }}
          />
          <span
            aria-hidden
            className="ail-cv-bob absolute -right-1 bottom-6 block h-3 w-3 rounded-[0.3rem]"
            style={{ background: "var(--ev-rosa)", animationDelay: "0.7s" }}
          />
        </div>

        <p
          className="ail-cv-rise font-evt-util text-[0.72rem] uppercase tracking-[0.34em] text-evt-rosa-ink"
          style={{ animationDelay: "0.1s" }}
        >
          {kicker}
        </p>

        <h1
          className="ail-cv-rise font-evt-script leading-[0.92] text-evt-ink text-[clamp(3rem,13vw,6.5rem)]"
          style={{ animationDelay: "0.18s" }}
        >
          {nome}
        </h1>

        {/* IDADE GIGANTE — número enorme (font-evt-display) + selo "anos" (quando existe). */}
        {idade != null && (
          <div className="ail-cv-rise flex items-end justify-center gap-3" style={{ animationDelay: "0.26s" }}>
            <span className="mb-2 font-evt-util text-[0.66rem] uppercase tracking-[0.3em] text-evt-ink-soft sm:mb-3">
              vou
              <br />
              fazer
            </span>
            <span
              className="font-evt-display leading-[0.78] text-[clamp(5rem,26vw,10.5rem)]"
              style={{ color: "var(--ev-framboesa)", fontWeight: 800 }}
            >
              {idade}
            </span>
            <span
              className="mb-3 rounded-full px-3.5 py-1.5 font-evt-util text-[0.62rem] uppercase tracking-[0.24em] text-white sm:mb-5"
              style={{ background: "var(--ev-rose)" }}
            >
              anos
            </span>
          </div>
        )}

        {/* SEM idade → o tema/mensagem vira o brilho da capa (pílula colorida). */}
        {idade == null && tema && (
          <p
            className="ail-cv-rise max-w-[600px] rounded-full px-6 py-2 font-evt-util text-[0.74rem] uppercase tracking-[0.2em] text-white"
            style={{ animationDelay: "0.26s", background: "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))" }}
          >
            {tema}
          </p>
        )}

        {/* Data/hora em pílula arredondada + local. */}
        <div className="ail-cv-rise flex flex-wrap items-center justify-center gap-x-3 gap-y-2" style={{ animationDelay: "0.34s" }}>
          <span
            className="rounded-full border px-5 py-2 font-evt-util text-[0.72rem] uppercase tracking-[0.22em] text-evt-ink-soft"
            style={{
              borderColor: "color-mix(in srgb, var(--ev-rosa) 40%, transparent)",
              background: "color-mix(in srgb, var(--ev-blush) 45%, transparent)",
            }}
          >
            {data}
            {horario ? ` · ${horario}` : ""}
          </span>
        </div>

        {local && (
          <p className="ail-cv-rise font-evt-body text-[1.1rem] text-evt-ink-soft" style={{ animationDelay: "0.42s" }}>
            {local}
          </p>
        )}
      </div>

      <style>{`
        @keyframes ailCvPop { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }
        @keyframes ailCvRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ailCvFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes ailCvBob { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-9px) rotate(8deg); } }
        .ail-cv-pop { opacity: 0; animation: ailCvPop 0.9s cubic-bezier(0.34,1.56,0.64,1) both; }
        .ail-cv-rise { opacity: 0; animation: ailCvRise 0.85s cubic-bezier(0.16,1,0.3,1) both; }
        .ail-cv-float-a { animation: ailCvFloat 7s ease-in-out infinite; }
        .ail-cv-float-b { animation: ailCvFloat 9s ease-in-out infinite; }
        .ail-cv-float-c { animation: ailCvFloat 8s ease-in-out infinite 0.6s; }
        .ail-cv-bob { animation: ailCvBob 4.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ail-cover [class*="ail-"] { opacity: 1 !important; animation: none !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}
