"use client";
// Contador regressivo DARK PREMIUM do template Noite Luxo. Usa o hook
// compartilhado (useCountdown) só para a LÓGICA; o visual é próprio: quatro
// ladrilhos escuros com filete dourado, numeral Didone claro e rótulo dourado.
import { useCountdown } from "@/components/evt/useCountdown";

const INK = "#F5EBD2";

function Ladrilho({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div
      className="relative flex min-w-[clamp(4.4rem,20vw,6.6rem)] flex-col items-center overflow-hidden rounded-[14px] px-[clamp(0.6rem,3vw,1.4rem)] py-[clamp(1rem,4vw,1.75rem)]"
      style={{
        background: "linear-gradient(180deg, #1F1810 0%, #14100A 100%)",
        border: "1px solid color-mix(in srgb, var(--ev-rosa) 30%, transparent)",
        boxShadow:
          "0 26px 60px -46px rgba(0,0,0,0.9), inset 0 1px 0 rgba(245,235,210,0.06)",
      }}
    >
      <span
        aria-hidden
        className="cnl-glow pointer-events-none absolute inset-x-0 top-0 h-14"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 0%, color-mix(in srgb, var(--ev-rosa) 22%, transparent), transparent 70%)",
        }}
      />
      <span
        className="relative font-evt-display text-[clamp(2.4rem,9vw,3.6rem)] leading-none tabular-nums"
        style={{ color: INK }}
      >
        {String(valor).padStart(2, "0")}
      </span>
      <span
        className="relative mt-2.5 font-evt-util text-[0.56rem] font-medium uppercase tracking-[0.32em]"
        style={{ color: "var(--ev-rose)" }}
      >
        {rotulo}
      </span>
    </div>
  );
}

export function CountdownNoite({ alvoISO }: { alvoISO: string }) {
  const r = useCountdown(alvoISO);

  if (!r) return <div className="h-[132px]" aria-hidden />;
  if (r.chegou)
    return (
      <p className="cnl-gold font-evt-script text-[clamp(2.4rem,8vw,3.4rem)]">
        É hoje. Que comece a festa.
      </p>
    );

  return (
    <div
      className="flex flex-wrap items-stretch justify-center gap-[clamp(0.6rem,2.5vw,1.1rem)]"
      aria-label="Contagem regressiva para a noite"
    >
      <Ladrilho valor={r.dias} rotulo="dias" />
      <Ladrilho valor={r.horas} rotulo="horas" />
      <Ladrilho valor={r.minutos} rotulo="min" />
      <Ladrilho valor={r.segundos} rotulo="seg" />
    </div>
  );
}
