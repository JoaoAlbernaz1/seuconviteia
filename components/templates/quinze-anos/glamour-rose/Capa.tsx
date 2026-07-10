// CAPA — 15 anos Glamour Rosé. Server component, 100% CSS.
// Clima ESCURO CINEMATOGRÁFICO, fiel ao festa-15-maria-clara: a foto ocupa a
// tela inteira (full-bleed), scrim escuro à esquerda/base para o texto creme ter
// contraste, e o lockup (nome em manuscrita + "15 ANOS") ancorado à ESQUERDA.
// Sem data/local na capa — eles vivem na seção "Quando/Onde". Reduced-motion: estático.
import Image from "next/image";
import { Flourish } from "@/components/evt/icons";

export function CapaGlamour({
  nome,
  idade,
  fotoUrl,
  fotoDesktopUrl,
}: {
  nome: string;
  idade?: number;
  kicker?: string;
  data?: string;
  horario?: string;
  local?: string;
  fotoUrl?: string;
  fotoDesktopUrl?: string;
}) {
  const foto = fotoDesktopUrl || fotoUrl || "";
  return (
    <section className="relative flex min-h-[100svh] w-full items-center overflow-hidden bg-evt-ink text-evt-ivory">
      {/* Foto full-bleed (Ken Burns suave). */}
      {foto ? (
        <div className="cg-foto absolute inset-0">
          <Image
            src={foto}
            alt={`Foto de ${nome}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 30% 20%, color-mix(in srgb, var(--ev-framboesa-deep) 45%, var(--ev-ink)), var(--ev-ink) 70%)",
          }}
        />
      )}

      {/* Scrim cinematográfico: unifica no escuro (qualquer foto vira sombria),
          escurece mais a esquerda (texto) e a base, e uma vinheta nas bordas. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            // esquerda -> direita (onde mora o texto)
            "linear-gradient(90deg, color-mix(in srgb, var(--ev-ink) 90%, transparent) 0%, color-mix(in srgb, var(--ev-ink) 55%, transparent) 42%, color-mix(in srgb, var(--ev-ink) 18%, transparent) 72%, transparent 100%)",
            // base -> topo
            "linear-gradient(0deg, color-mix(in srgb, var(--ev-ink) 72%, transparent) 0%, transparent 46%)",
            // topo (para a nav) + escurecimento geral (mood)
            "linear-gradient(180deg, color-mix(in srgb, var(--ev-ink) 40%, transparent) 0%, transparent 22%)",
            // vinheta radial nas bordas
            "radial-gradient(120% 110% at 50% 45%, transparent 55%, color-mix(in srgb, var(--ev-ink) 55%, transparent) 100%)",
          ].join(", "),
        }}
      />

      {/* Lockup à esquerda. */}
      <div className="relative mx-auto flex w-full max-w-[1100px] flex-col items-start gap-[clamp(0.6rem,2vw,1.1rem)] px-[clamp(1.5rem,6vw,3.5rem)] py-[clamp(5rem,12vw,8rem)]">
        <h1
          className="cg-rise font-evt-script leading-[0.9] text-evt-ivory text-[clamp(3.2rem,11vw,7rem)]"
          style={{ animationDelay: "0.12s" }}
        >
          {nome}
        </h1>

        {idade != null && (
          <div
            className="cg-rise flex items-center gap-4"
            style={{ animationDelay: "0.24s" }}
          >
            <span className="font-evt-display text-[clamp(1.4rem,4vw,2.4rem)] uppercase tracking-[0.22em] text-evt-ivory">
              {idade} anos
            </span>
            <Flourish className="h-4 w-16 text-evt-rosa" />
          </div>
        )}
      </div>

      <style>{`
        @keyframes cgFotoIn { from { opacity: 0; transform: scale(1.06); } to { opacity: 1; transform: scale(1); } }
        @keyframes cgRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .cg-foto { opacity: 0; animation: cgFotoIn 1.6s cubic-bezier(0.16,1,0.3,1) both; }
        .cg-rise { opacity: 0; animation: cgRise 1s cubic-bezier(0.16,1,0.3,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .cg-foto, .cg-rise { opacity: 1 !important; animation: none !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}
