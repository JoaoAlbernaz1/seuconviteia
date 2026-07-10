"use client";
// Contador do Glamour Rosé — tiles glossy com "brilho suave" (sheen ambiente +
// glow). Usa o hook COMPARTILHADO useCountdown (a contagem "bate" igual aos
// outros templates); o VISUAL é próprio deste corpo.
import { useCountdown } from "@/components/evt/useCountdown";

function Tile({ valor, rotulo, delay }: { valor: number; rotulo: string; delay: string }) {
  return (
    <div className="qgr-tile flex min-w-[4.6rem] flex-col items-center px-[clamp(0.7rem,3.5vw,1.5rem)] py-[clamp(0.9rem,3vw,1.5rem)] sm:min-w-[6rem]">
      {/* glow suave por trás do número */}
      <span
        aria-hidden
        className="qgr-glow pointer-events-none absolute inset-0 -z-0"
        style={{
          animationDelay: delay,
          background:
            "radial-gradient(60% 55% at 50% 40%, color-mix(in srgb, var(--ev-rose) 40%, transparent), transparent 70%)",
        }}
      />
      <span className="qgr-sheen qgr-sheen--auto" aria-hidden style={{ animationDelay: delay }} />
      <span className="relative z-10 font-evt-display text-[clamp(2.4rem,9vw,3.6rem)] leading-none tabular-nums text-evt-ink">
        {String(valor).padStart(2, "0")}
      </span>
      <span className="relative z-10 mt-2 font-evt-util text-[0.54rem] uppercase tracking-[0.28em] text-evt-rosa-ink">
        {rotulo}
      </span>
    </div>
  );
}

export function QgrCountdown({ alvoISO }: { alvoISO: string }) {
  const r = useCountdown(alvoISO);

  // SSR / primeiro paint: reserva a altura (evita layout shift / hydration mismatch).
  if (!r) return <div className="h-[128px]" aria-hidden />;

  if (r.chegou) {
    return (
      <p className="qgr-foil font-evt-script text-[clamp(2.4rem,8vw,3.4rem)] leading-tight">
        É hoje! O grande dia chegou
      </p>
    );
  }

  return (
    <div
      className="flex flex-wrap items-stretch justify-center gap-[clamp(0.6rem,2.5vw,1.1rem)]"
      aria-label="Contagem regressiva para a festa"
    >
      <Tile valor={r.dias} rotulo="dias" delay="0s" />
      <Tile valor={r.horas} rotulo="horas" delay="0.8s" />
      <Tile valor={r.minutos} rotulo="min" delay="1.6s" />
      <Tile valor={r.segundos} rotulo="seg" delay="2.4s" />
    </div>
  );
}
