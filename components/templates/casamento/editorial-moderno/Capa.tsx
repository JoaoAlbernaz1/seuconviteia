// CAPA — Casamento Editorial Moderno. Server component, 100% CSS.
// Arquétipo Editorial Luxury (capa de REVISTA): foto full-bleed cinematográfica +
// masthead editorial no topo (hairline + metadados) + o nome do casal numa PLACA
// de papel ivory DESLOCADA (assimétrica, canto inferior esquerdo), com bloco de
// metadados Quando/Onde em colunas. Themeável por --ev-* (funciona em qualquer
// paleta; padrão sage/verde). Reduced-motion: estático.
import Image from "next/image";
import { Flourish } from "@/components/evt/icons";

export function CapaEditorialModerno({
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
  const foto = fotoDesktopUrl || fotoUrl || "";
  return (
    <section className="relative w-full overflow-hidden bg-evt-ink text-evt-ivory">
      {/* ── FOTO full-bleed (fallback = gradiente claro) ── */}
      <div aria-hidden className="absolute inset-0">
        {foto ? (
          <Image
            src={foto}
            alt={`Foto de ${nome}`}
            fill
            priority
            sizes="100vw"
            className="em-foto object-cover"
            style={{ objectPosition: "50% 38%" }}
          />
        ) : (
          <div className="h-full w-full [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))]" />
        )}
      </div>

      {/* Scrims: escurece topo (masthead legível) + aterra a placa no canto. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--ev-ink) 62%, transparent) 0%, transparent 24%, transparent 52%, color-mix(in srgb, var(--ev-ink) 30%, transparent) 100%), radial-gradient(120% 90% at 10% 118%, color-mix(in srgb, var(--ev-ink) 40%, transparent), transparent 60%)",
        }}
      />

      {/* Etiqueta editorial vertical na borda direita (spine de revista). */}
      <span
        aria-hidden
        className="em-mast absolute right-[clamp(0.9rem,2.4vw,1.6rem)] top-1/2 hidden -translate-y-1/2 rotate-90 font-evt-util text-[0.6rem] uppercase tracking-[0.55em] text-evt-ivory/70 md:block"
      >
        Save the date
      </span>

      {/* ── CONTEÚDO ── */}
      <div className="relative z-10 flex min-h-[100svh] flex-col justify-between px-[clamp(1.25rem,5vw,4rem)] pb-[clamp(1.75rem,4vw,3rem)] pt-[clamp(1.5rem,4vw,2.75rem)]">
        {/* MASTHEAD — hairline + metadados, tipo cabeçalho de revista. */}
        <header className="em-mast em-rise" style={{ animationDelay: "0.05s" }}>
          <span className="block h-px w-full bg-evt-ivory/35" aria-hidden />
          <div className="mt-3 flex items-baseline justify-between gap-4">
            <span className="font-evt-util text-[0.62rem] uppercase tracking-[0.36em] text-evt-ivory/85">
              {nichoLabel || "Convite"}
            </span>
            <Flourish className="hidden h-3.5 w-20 text-evt-ivory/60 sm:block" />
            <span className="font-evt-util text-[0.62rem] uppercase tracking-[0.36em] text-evt-ivory/85">
              {data}
            </span>
          </div>
        </header>

        {/* PLACA de papel ivory — assimétrica (canto inferior esquerdo). */}
        <div className="em-plate max-w-[min(40rem,92vw)] self-start">
          <div className="relative rounded-[2px] border-t-2 border-[var(--ev-rosa)] bg-evt-ivory/95 px-[clamp(1.4rem,4vw,2.75rem)] pb-[clamp(1.5rem,4vw,2.5rem)] pt-[clamp(1.3rem,3.5vw,2rem)] text-evt-ink shadow-[0_50px_120px_-50px_rgba(20,16,14,0.85)] backdrop-blur-[2px]">
            <p
              className="em-rise font-evt-util text-[0.68rem] uppercase tracking-[0.42em] text-evt-rosa-ink"
              style={{ animationDelay: "0.18s" }}
            >
              {kicker}
            </p>

            <h1
              className="em-rise mt-4 font-evt-display uppercase leading-[0.92] tracking-[0.005em] text-evt-ink text-[clamp(2.9rem,9vw,6.2rem)]"
              style={{ animationDelay: "0.26s" }}
            >
              {nome}
            </h1>

            {idade != null && (
              <p
                className="em-rise mt-4 font-evt-util text-[0.74rem] uppercase tracking-[0.34em] text-evt-ink-soft"
                style={{ animationDelay: "0.32s" }}
              >
                {idade} anos
              </p>
            )}

            {/* Metadados Quando / Onde em duas colunas com filete central. */}
            <div
              className="em-rise mt-[clamp(1.25rem,3.5vw,2rem)] flex flex-wrap gap-x-[clamp(1.25rem,4vw,2.5rem)] gap-y-4 border-t border-[var(--line)] pt-[clamp(1rem,3vw,1.6rem)]"
              style={{ animationDelay: "0.4s" }}
            >
              <div>
                <p className="font-evt-util text-[0.56rem] uppercase tracking-[0.3em] text-evt-rosa-ink">
                  Quando
                </p>
                <p className="mt-1.5 font-evt-body text-[1.1rem] leading-tight text-evt-ink">
                  {data}
                  {horario ? <span className="text-evt-ink-soft"> · {horario}</span> : null}
                </p>
              </div>
              {local && (
                <div className="sm:border-l sm:border-[var(--line)] sm:pl-[clamp(1.25rem,4vw,2.5rem)]">
                  <p className="font-evt-util text-[0.56rem] uppercase tracking-[0.3em] text-evt-rosa-ink">
                    Onde
                  </p>
                  <p className="mt-1.5 font-evt-body text-[1.1rem] leading-tight text-evt-ink">
                    {local}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes emFotoIn { from { opacity: 0; transform: scale(1.07); } to { opacity: 1; transform: scale(1); } }
        @keyframes emRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes emPlate { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: translateY(0); } }
        .em-foto { animation: emFotoIn 1.5s cubic-bezier(0.16,1,0.3,1) both; }
        .em-rise { opacity: 0; animation: emRise 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        .em-plate { opacity: 0; animation: emPlate 1.05s cubic-bezier(0.16,1,0.3,1) both; animation-delay: 0.12s; }
        .em-mast { text-shadow: 0 1px 24px rgba(0,0,0,0.45); }
        @media (prefers-reduced-motion: reduce) {
          .em-foto, .em-rise, .em-plate { opacity: 1 !important; animation: none !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}
