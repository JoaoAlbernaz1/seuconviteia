// CAPA — Casamento Clássico Elegante. Server component, 100% CSS.
// Clima CLARO (off-white/ivory), acento dourado (via paleta), serifas: retrato em
// ARCO (motivo clássico de casamento) com moldura double-bezel + nomes em cursiva.
// Themeável por --ev-* (funciona em qualquer paleta). Reduced-motion: estático.
import Image from "next/image";
import { Flourish } from "@/components/evt/icons";

export function CapaClassica({
  nome,
  idade,
  kicker,
  data,
  horario,
  local,
  fotoUrl,
  fotoDesktopUrl,
}: {
  nome: string;
  idade?: number;
  kicker: string;
  data: string;
  horario?: string;
  local?: string;
  fotoUrl?: string;
  fotoDesktopUrl?: string;
}) {
  const foto = fotoUrl || fotoDesktopUrl || "";
  return (
    <section className="relative flex min-h-[100svh] w-full items-center overflow-hidden bg-evt-ivory text-evt-ink">
      {/* Washes dourados suaves — dão profundidade sem escurecer. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, color-mix(in srgb, var(--ev-rose) 34%, transparent), transparent 60%), radial-gradient(90% 60% at 50% 120%, color-mix(in srgb, var(--ev-blush) 55%, transparent), transparent 62%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-[960px] flex-col items-center gap-[clamp(1.6rem,4vw,2.4rem)] px-[clamp(1.5rem,6vw,3rem)] py-[clamp(4.5rem,10vw,7rem)] text-center">
        {/* Retrato em arco com moldura double-bezel. */}
        <div className="cc-foto">
          <div className="rounded-t-[999px] rounded-b-[1.75rem] border border-[var(--line-rosa)] bg-white/45 p-2 shadow-[0_40px_90px_-55px_rgba(46,26,32,0.5)]">
            <div className="relative aspect-[4/5] w-[clamp(14rem,54vw,19rem)] overflow-hidden rounded-t-[999px] rounded-b-[1.25rem]">
              {foto ? (
                <Image
                  src={foto}
                  alt={`Foto de ${nome}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 60vw, 19rem"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))]">
                  <Flourish className="h-5 w-24 text-evt-rosa" />
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="cc-rise font-evt-util text-[0.72rem] uppercase tracking-[0.42em] text-evt-rosa-ink" style={{ animationDelay: "0.05s" }}>
          {kicker}
        </p>

        <h1
          className="cc-rise font-evt-script leading-[0.94] text-evt-ink text-[clamp(3.2rem,13vw,7rem)]"
          style={{ animationDelay: "0.14s" }}
        >
          {nome}
        </h1>

        {idade != null && (
          <p className="cc-rise font-evt-util text-[0.82rem] uppercase tracking-[0.4em] text-evt-rosa-ink" style={{ animationDelay: "0.2s" }}>
            {idade} anos
          </p>
        )}

        <div className="cc-rise flex items-center gap-4" style={{ animationDelay: "0.24s" }}>
          <span className="h-px w-10 bg-evt-rosa-ink/40" aria-hidden />
          <p className="font-evt-util text-[0.8rem] uppercase tracking-[0.3em] text-evt-ink-soft">
            {data}
            {horario ? ` · ${horario}` : ""}
          </p>
          <span className="h-px w-10 bg-evt-rosa-ink/40" aria-hidden />
        </div>

        {local && (
          <p className="cc-rise font-evt-body text-[1.1rem] text-evt-ink-soft" style={{ animationDelay: "0.32s" }}>
            {local}
          </p>
        )}
      </div>

      <style>{`
        @keyframes ccFotoIn { from { opacity: 0; transform: scale(1.04); } to { opacity: 1; transform: scale(1); } }
        @keyframes ccRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .cc-foto { opacity: 0; animation: ccFotoIn 1.2s cubic-bezier(0.16,1,0.3,1) both; }
        .cc-rise { opacity: 0; animation: ccRise 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .cc-foto, .cc-rise { opacity: 1 !important; animation: none !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}
