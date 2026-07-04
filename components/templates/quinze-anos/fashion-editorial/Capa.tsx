// CAPA — 15 anos Fashion Editorial. Server component, 100% CSS.
// Cara de CAPA DE REVISTA DE MODA: masthead no topo, FOTO dominante que sangra pra
// borda, nome da debutante em display CAPS marcante e o "15" como numeral editorial
// FORTE. Layout ASSIMETRICO (rail de texto estreito + painel de foto largo).
// Themeavel por --ev-* (qualquer paleta). Bem diferente do glamour-rose (cursiva
// romantica + numeral watermark central): aqui e fashion/caps/assimetrico.
// Reduced-motion: estatico.
import Image from "next/image";
import { Flourish } from "@/components/evt/icons";

export function CapaFashionEditorial({
  nome,
  idade,
  kicker,
  nichoLabel,
  data,
  horario,
  local,
  fotoUrl,
  fotoDesktopUrl,
}: {
  nome: string;
  idade?: number;
  kicker: string;
  nichoLabel?: string;
  data: string;
  horario?: string;
  local?: string;
  fotoUrl?: string;
  fotoDesktopUrl?: string;
}) {
  const foto = fotoUrl || fotoDesktopUrl || "";
  const numero = idade ?? 15;
  const masthead = nichoLabel || "Quinze anos";

  return (
    <section className="fe-capa relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-evt-ivory text-evt-ink">
      {/* Washes assimetricos — profundidade sem escurecer. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 55% at 90% -8%, color-mix(in srgb, var(--ev-rose) 32%, transparent), transparent 60%), radial-gradient(80% 55% at -6% 108%, color-mix(in srgb, var(--ev-blush) 58%, transparent), transparent 62%)",
        }}
      />

      {/* MASTHEAD — titulo (nicho) + data, como capa de revista. */}
      <header className="fe-rise relative z-10 flex items-baseline justify-between gap-4 px-[clamp(1.25rem,5vw,3.5rem)] pt-[clamp(1.4rem,4vw,2.4rem)]">
        <span className="font-evt-util text-[clamp(0.72rem,1.7vw,1rem)] font-medium uppercase tracking-[0.44em] text-evt-rosa-ink">
          {masthead}
        </span>
        <span className="font-evt-util text-[0.62rem] uppercase tracking-[0.32em] text-evt-ink-soft">
          {data}
          {horario ? ` · ${horario}` : ""}
        </span>
      </header>
      <div
        className="fe-rise relative z-10 mx-[clamp(1.25rem,5vw,3.5rem)] mt-[clamp(0.9rem,2.5vw,1.4rem)] h-px bg-[var(--line)]"
        style={{ animationDelay: "0.06s" }}
        aria-hidden
      />

      {/* CORPO — rail de texto (estreito, assimetrico) + painel de foto dominante. */}
      <div className="relative z-10 flex flex-1 flex-col lg:grid lg:grid-cols-12">
        {/* RAIL DE TEXTO */}
        <div className="order-2 flex flex-col justify-between gap-[clamp(2rem,5vw,3rem)] px-[clamp(1.25rem,5vw,3.5rem)] py-[clamp(2rem,5vw,3.5rem)] lg:order-1 lg:col-span-5">
          {/* Numeral editorial FORTE — o "15". */}
          <div className="flex flex-col">
            <p
              className="fe-rise font-evt-util text-[0.62rem] uppercase tracking-[0.38em] text-evt-ink-soft"
              style={{ animationDelay: "0.1s" }}
            >
              {kicker}
            </p>
            <div className="fe-num mt-1 flex items-end gap-4">
              <span className="-ml-[0.04em] font-evt-display leading-[0.72] text-evt-rosa-ink text-[clamp(6.5rem,20vw,13.5rem)]">
                {numero}
              </span>
              <span className="mb-[0.7rem] font-evt-util text-[0.72rem] uppercase tracking-[0.42em] text-evt-ink-soft">
                anos
              </span>
            </div>
          </div>

          {/* Nome — display CAPS marcante (a estrela da capa). */}
          <div className="flex flex-col">
            <p
              className="fe-rise font-evt-util text-[0.62rem] uppercase tracking-[0.42em] text-evt-rosa-ink"
              style={{ animationDelay: "0.18s" }}
            >
              A debutante
            </p>
            <h1
              className="fe-rise mt-3 font-evt-display uppercase leading-[0.86] tracking-[-0.01em] text-evt-ink text-[clamp(2.8rem,9vw,5.5rem)]"
              style={{ animationDelay: "0.24s" }}
            >
              {nome}
            </h1>
            <div className="fe-rise mt-6 flex items-center gap-4" style={{ animationDelay: "0.32s" }}>
              <span className="h-px w-12 bg-evt-rosa-ink/50" aria-hidden />
              <p className="font-evt-util text-[0.66rem] uppercase tracking-[0.26em] text-evt-ink-soft">
                {local || "Você está convidada"}
              </p>
            </div>
          </div>
        </div>

        {/* PAINEL DE FOTO — dominante, cantos retos, sangra pra borda. */}
        <div className="fe-foto relative order-1 min-h-[48svh] lg:order-2 lg:col-span-7 lg:min-h-0">
          {foto ? (
            <Image
              src={foto}
              alt={`Foto de ${nome}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))]">
              <Flourish className="h-6 w-32 text-evt-rosa" />
            </div>
          )}

          {/* Filete interno editorial (cantos retos). */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[var(--line)]"
          />

          {/* Tag editorial "Nº 15" — canto. */}
          <span className="fe-cap absolute left-[clamp(0.9rem,2vw,1.4rem)] top-[clamp(0.9rem,2vw,1.4rem)] rounded-full bg-evt-ivory/90 px-3 py-1 font-evt-util text-[0.55rem] uppercase tracking-[0.3em] text-evt-rosa-ink shadow-[0_10px_30px_-18px_rgba(0,0,0,0.55)] backdrop-blur-sm">
            Nº {numero}
          </span>

          {/* Cover line inferior — credito sobre scrim. */}
          <div className="fe-cap pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/45 via-black/10 to-transparent px-[clamp(0.9rem,2.5vw,1.6rem)] pb-[clamp(0.8rem,2vw,1.3rem)] pt-16">
            <span className="font-evt-util text-[0.58rem] uppercase tracking-[0.3em] text-white/90">
              {masthead}
            </span>
            <span className="font-evt-util text-[0.58rem] uppercase tracking-[0.3em] text-white/90">
              {data}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes feRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes feFoto { from { opacity: 0; transform: scale(1.05); } to { opacity: 1; transform: scale(1); } }
        @keyframes feNum { from { opacity: 0; transform: translateY(10px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes feCap { from { opacity: 0; } to { opacity: 1; } }
        .fe-rise { opacity: 0; animation: feRise 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        .fe-foto { opacity: 0; animation: feFoto 1.3s cubic-bezier(0.16,1,0.3,1) both; }
        .fe-num { opacity: 0; animation: feNum 1s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.14s; }
        .fe-cap { opacity: 0; animation: feCap 1.2s ease both; animation-delay: 0.5s; }
        @media (prefers-reduced-motion: reduce) {
          .fe-rise, .fe-foto, .fe-num, .fe-cap { opacity: 1 !important; animation: none !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}
