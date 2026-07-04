// CAPA — 15 anos Princesa Delicado. Server component, animação 100% CSS (scoped pd-).
// Clima CLARO, ROMÂNTICO e DELICADO: composição CENTRADA com muito ar, nome da
// debutante em cursiva, "idade anos" num medalhão OVAL de fio-de-cabelo, retrato
// em moldura OVAL suave (motivo de curvas repetido), filigranas florais (Flourish)
// e pétalas de brilho radial que flutuam devagar. Themeável por --ev-* (qualquer
// paleta; padrão lavanda). Reduced-motion: estático.
import Image from "next/image";
import { Flourish } from "@/components/evt/icons";

export function CapaPrincesa({
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
      {/* Washes radiais BEM leves — luz difusa, sem escurecer. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(115% 75% at 50% -12%, color-mix(in srgb, var(--ev-rose) 28%, transparent), transparent 60%), radial-gradient(85% 60% at 15% 108%, color-mix(in srgb, var(--ev-blush) 48%, transparent), transparent 62%), radial-gradient(80% 55% at 88% 112%, color-mix(in srgb, var(--ev-rose) 22%, transparent), transparent 60%)",
        }}
      />

      {/* Pétalas de brilho — bokeh floral macio que flutua devagar. */}
      <span
        aria-hidden
        className="pd-petal pointer-events-none absolute left-[8%] top-[18%] h-40 w-40 rounded-full blur-3xl"
        style={{ background: "color-mix(in srgb, var(--ev-rose) 60%, transparent)", animationDelay: "0s" }}
      />
      <span
        aria-hidden
        className="pd-petal pointer-events-none absolute right-[10%] top-[26%] h-32 w-32 rounded-full blur-3xl"
        style={{ background: "color-mix(in srgb, var(--ev-blush) 75%, transparent)", animationDelay: "1.4s" }}
      />
      <span
        aria-hidden
        className="pd-petal pointer-events-none absolute bottom-[14%] left-[16%] h-36 w-36 rounded-full blur-3xl"
        style={{ background: "color-mix(in srgb, var(--ev-blush) 70%, transparent)", animationDelay: "2.6s" }}
      />
      <span
        aria-hidden
        className="pd-petal pointer-events-none absolute bottom-[20%] right-[14%] h-28 w-28 rounded-full blur-3xl"
        style={{ background: "color-mix(in srgb, var(--ev-rose) 50%, transparent)", animationDelay: "3.4s" }}
      />

      <div className="relative mx-auto flex w-full max-w-[860px] flex-col items-center gap-[clamp(1.1rem,3vw,1.8rem)] px-[clamp(1.5rem,6vw,3rem)] py-[clamp(4.5rem,10vw,7rem)] text-center">
        {/* Ornamento floral flutuante no topo. */}
        <Flourish className="pd-float h-4 w-28 text-evt-rosa" />

        <p
          className="pd-rise font-evt-util text-[0.7rem] uppercase tracking-[0.46em] text-evt-rosa-ink"
          style={{ animationDelay: "0.06s" }}
        >
          {kicker}
        </p>

        <h1
          className="pd-rise font-evt-script leading-[0.94] text-evt-ink text-[clamp(3.1rem,13vw,6.6rem)]"
          style={{ animationDelay: "0.14s" }}
        >
          {nome}
        </h1>

        {/* "idade anos" num medalhão OVAL delicado (fio-de-cabelo). */}
        {idade != null && (
          <div className="pd-rise flex flex-col items-center gap-2.5" style={{ animationDelay: "0.22s" }}>
            <div className="relative grid h-[clamp(4.4rem,15vw,5.6rem)] w-[clamp(6.4rem,23vw,8.4rem)] place-items-center">
              <span
                aria-hidden
                className="absolute inset-0 rounded-[50%] border border-[var(--line-rosa)] bg-white/35"
              />
              <span
                aria-hidden
                className="absolute inset-[5px] rounded-[50%] border border-[var(--line-rosa)] opacity-45"
              />
              <span className="relative font-evt-display leading-none text-evt-rosa-ink text-[clamp(2.5rem,9.5vw,3.7rem)]">
                {idade}
              </span>
            </div>
            <span className="font-evt-util text-[0.68rem] uppercase tracking-[0.52em] text-evt-rosa-ink">
              anos
            </span>
          </div>
        )}

        {/* Retrato em moldura OVAL suave — double-bezel + halo de fio-de-cabelo. */}
        <div className="pd-foto relative mt-2">
          <span
            aria-hidden
            className="absolute -inset-3 rounded-[50%] border border-[var(--line-rosa)] opacity-55"
          />
          <div className="relative w-[clamp(11.5rem,46vw,15rem)] rounded-[50%] border border-[var(--line-rosa)] bg-white/45 p-[7px] shadow-[0_40px_92px_-58px_rgba(46,26,32,0.42)]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[50%]">
              {foto ? (
                <Image
                  src={foto}
                  alt={`Foto de ${nome}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 50vw, 15rem"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center [background:linear-gradient(155deg,var(--ev-blush-soft),var(--ev-blush))]">
                  <Flourish className="h-5 w-24 text-evt-rosa" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pd-rise mt-1 flex items-center gap-4" style={{ animationDelay: "0.34s" }}>
          <span className="h-px w-10 bg-evt-rosa-ink/35" aria-hidden />
          <p className="font-evt-util text-[0.78rem] uppercase tracking-[0.3em] text-evt-ink-soft">
            {data}
            {horario ? ` · ${horario}` : ""}
          </p>
          <span className="h-px w-10 bg-evt-rosa-ink/35" aria-hidden />
        </div>

        {local && (
          <p
            className="pd-rise font-evt-body text-[1.08rem] text-evt-ink-soft"
            style={{ animationDelay: "0.42s" }}
          >
            {local}
          </p>
        )}
      </div>

      <style>{`
        @keyframes pdFotoIn { from { opacity: 0; transform: scale(1.05); } to { opacity: 1; transform: scale(1); } }
        @keyframes pdRise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pdFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes pdPetal {
          0%   { transform: translate3d(0,0,0) scale(1);    opacity: 0.5; }
          50%  { transform: translate3d(6px,-14px,0) scale(1.08); opacity: 0.75; }
          100% { transform: translate3d(0,0,0) scale(1);    opacity: 0.5; }
        }
        .pd-foto  { opacity: 0; animation: pdFotoIn 1.3s cubic-bezier(0.16,1,0.3,1) both 0.12s; }
        .pd-rise  { opacity: 0; animation: pdRise 0.95s cubic-bezier(0.16,1,0.3,1) both; }
        .pd-float { animation: pdFloat 6s ease-in-out infinite; }
        .pd-petal { animation: pdPetal 11s ease-in-out infinite; will-change: transform, opacity; }
        @media (prefers-reduced-motion: reduce) {
          .pd-foto, .pd-rise, .pd-float, .pd-petal {
            opacity: 1 !important; animation: none !important; transform: none !important;
          }
        }
      `}</style>
    </section>
  );
}
