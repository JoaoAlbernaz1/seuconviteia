// CAPA — Aniversário Adulto Elegante. Server component, 100% CSS. Split editorial:
// conteúdo à ESQUERDA (tipografia display, minimalista, muito respiro) + foto à
// DIREITA em coluna cheia. Clima CLARO, neutro (paleta azul/sereno por padrão),
// nada de floral/infantil. Reduced-motion: estático.
import Image from "next/image";

export function CapaAdulto({
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
  const foto = fotoDesktopUrl || fotoUrl || "";
  return (
    <section className="relative w-full overflow-hidden bg-evt-ivory text-evt-ink">
      <div className="grid min-h-[100svh] md:grid-cols-[1.05fr_1fr]">
        {/* ── CONTEÚDO ── */}
        <div className="order-2 flex flex-col justify-center px-[clamp(1.5rem,6vw,5rem)] py-[clamp(3rem,7vw,6rem)] md:order-1">
          <p className="ca-rise font-evt-util text-[0.72rem] uppercase tracking-[0.42em] text-evt-rosa-ink" style={{ animationDelay: "0.05s" }}>
            {kicker}
          </p>

          <h1
            className="ca-rise mt-7 font-evt-display uppercase leading-[0.98] tracking-[0.01em] text-evt-ink text-[clamp(2.9rem,9vw,6rem)]"
            style={{ animationDelay: "0.14s" }}
          >
            {nome}
          </h1>

          {idade != null && (
            <p className="ca-rise mt-5 font-evt-util text-[0.82rem] uppercase tracking-[0.34em] text-evt-ink-soft" style={{ animationDelay: "0.22s" }}>
              {idade} anos
            </p>
          )}

          <span className="ca-rise my-9 block h-px w-20 bg-evt-rosa-ink/40" style={{ animationDelay: "0.3s" }} aria-hidden />

          <div className="ca-rise flex flex-col gap-2" style={{ animationDelay: "0.38s" }}>
            <p className="font-evt-body text-[1.2rem] text-evt-ink">
              {data}
              {horario ? <span className="text-evt-ink-soft"> · {horario}</span> : null}
            </p>
            {local && <p className="font-evt-body text-[1.05rem] text-evt-ink-soft">{local}</p>}
          </div>
        </div>

        {/* ── FOTO ── */}
        <div className="relative order-1 min-h-[44svh] overflow-hidden md:order-2 md:min-h-[100svh]">
          <span className="absolute inset-y-0 left-0 z-10 hidden w-px bg-[var(--line-rosa)] md:block" aria-hidden />
          {foto ? (
            <Image
              src={foto}
              alt={`Foto de ${nome}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="ca-foto object-cover"
              style={{ objectPosition: "50% 42%" }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))]">
              <span className="font-evt-util text-[0.6rem] uppercase tracking-[0.3em] text-evt-ink-soft/80">
                Sua foto aqui
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes caFotoIn { from { opacity: 0; transform: scale(1.05); } to { opacity: 1; transform: scale(1); } }
        @keyframes caRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .ca-foto { animation: caFotoIn 1.3s cubic-bezier(0.16,1,0.3,1) both; }
        .ca-rise { opacity: 0; animation: caRise 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .ca-foto, .ca-rise { opacity: 1 !important; animation: none !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}
