// CAPA — 15 anos Glamour Rosé. Server component, 100% CSS. Clima CLARO com
// numeral "15" GIGANTE ao fundo (elemento visual forte), nome da debutante em
// cursiva e retrato com moldura suave. Rosé/champagne pela paleta. Reduced-motion: estático.
import Image from "next/image";
import { Flourish } from "@/components/evt/icons";

export function CapaGlamour({
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
      {/* Washes rosé + brilho discreto. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 70% at 50% -8%, color-mix(in srgb, var(--ev-rose) 42%, transparent), transparent 58%), radial-gradient(80% 60% at 85% 110%, color-mix(in srgb, var(--ev-blush) 60%, transparent), transparent 60%)",
        }}
      />

      {/* Numeral GIGANTE ao fundo (a idade comemorada). */}
      {idade != null && (
        <span
          aria-hidden
          className="qgr-numeral pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-evt-display leading-none text-[38vw] opacity-[0.16]"
        >
          {idade}
        </span>
      )}

      <div className="relative mx-auto flex w-full max-w-[900px] flex-col items-center gap-[clamp(1.4rem,3.5vw,2.1rem)] px-[clamp(1.5rem,6vw,3rem)] py-[clamp(4.5rem,10vw,7rem)] text-center">
        <p className="cg-rise font-evt-util text-[0.72rem] uppercase tracking-[0.44em] text-evt-rosa-ink" style={{ animationDelay: "0.05s" }}>
          {kicker}
        </p>

        <h1
          className="cg-rise font-evt-script leading-[0.92] text-evt-ink text-[clamp(3.4rem,14vw,7.5rem)]"
          style={{ animationDelay: "0.14s" }}
        >
          {nome}
        </h1>

        {idade != null && (
          <p className="cg-rise qgr-foil font-evt-util text-[0.86rem] font-medium uppercase tracking-[0.5em]" style={{ animationDelay: "0.22s" }}>
            {idade} anos
          </p>
        )}

        {/* Retrato com moldura suave double-bezel. */}
        <div className="cg-foto mt-2">
          <div className="rounded-[2.25rem] border border-[var(--line-rosa)] bg-white/45 p-2 shadow-[0_44px_100px_-60px_rgba(46,26,32,0.5)]">
            <div className="relative aspect-[4/5] w-[clamp(13rem,50vw,17rem)] overflow-hidden rounded-[1.6rem]">
              {foto ? (
                <Image
                  src={foto}
                  alt={`Foto de ${nome}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 55vw, 17rem"
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

        <div className="cg-rise flex items-center gap-4" style={{ animationDelay: "0.34s" }}>
          <span className="h-px w-10 bg-evt-rosa-ink/40" aria-hidden />
          <p className="font-evt-util text-[0.8rem] uppercase tracking-[0.3em] text-evt-ink-soft">
            {data}
            {horario ? ` · ${horario}` : ""}
          </p>
          <span className="h-px w-10 bg-evt-rosa-ink/40" aria-hidden />
        </div>

        {local && (
          <p className="cg-rise font-evt-body text-[1.1rem] text-evt-ink-soft" style={{ animationDelay: "0.4s" }}>
            {local}
          </p>
        )}
      </div>

      <style>{`
        @keyframes cgFotoIn { from { opacity: 0; transform: scale(1.04); } to { opacity: 1; transform: scale(1); } }
        @keyframes cgRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .cg-foto { opacity: 0; animation: cgFotoIn 1.2s cubic-bezier(0.16,1,0.3,1) both; }
        .cg-rise { opacity: 0; animation: cgRise 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .cg-foto, .cg-rise { opacity: 1 !important; animation: none !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}
