"use client";
// Contador regressivo DISCRETO do template Adulto Elegante. Usa o hook
// compartilhado (mesma contagem que "bate" em todo o site); o visual é próprio:
// numerais grandes em display, rótulos sóbrios em ink-soft, separados por filetes
// verticais finos. Nada de cores fortes — clima adulto/sereno.
import { useCountdown } from "@/components/evt/useCountdown";

export function ContadorAdulto({ alvoISO }: { alvoISO: string }) {
  const r = useCountdown(alvoISO);

  // null no SSR -> reserva a altura p/ não "pular" quando o relógio entra.
  if (!r) return <div className="h-[104px]" aria-hidden />;

  if (r.chegou) {
    return (
      <p className="font-evt-display uppercase tracking-[0.22em] text-[clamp(1.6rem,5vw,2.3rem)] text-evt-rosa-ink">
        É hoje
      </p>
    );
  }

  const blocos = [
    { v: r.dias, l: "Dias" },
    { v: r.horas, l: "Horas" },
    { v: r.minutos, l: "Min" },
    { v: r.segundos, l: "Seg" },
  ];

  return (
    <div
      className="flex items-stretch justify-center"
      aria-label="Contagem regressiva para a celebração"
    >
      {blocos.map((b, i) => (
        <div key={b.l} className="flex items-stretch">
          {i > 0 && (
            <span className="mx-4 w-px self-stretch bg-[var(--line)] sm:mx-8" aria-hidden />
          )}
          <div className="flex min-w-[3.2rem] flex-col items-center sm:min-w-[4.4rem]">
            <span className="font-evt-display text-[clamp(2.4rem,8.5vw,3.6rem)] leading-none tabular-nums text-evt-ink">
              {String(b.v).padStart(2, "0")}
            </span>
            <span className="mt-3 font-evt-util text-[0.54rem] uppercase tracking-[0.3em] text-evt-ink-soft">
              {b.l}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
