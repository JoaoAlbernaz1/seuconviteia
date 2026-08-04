"use client";
// Contagem regressiva — clone FIEL do Countdown do site da Maria Clara
// (festa-15-maria-clara/components/Countdown.tsx): números na display Didone (ink),
// rótulos rosa, separadores hairline. Calmo sobre claro. Usa o hook compartilhado
// useCountdown (a contagem "bate" igual aos outros templates).
import { useCountdown } from "@/components/evt/useCountdown";

function Bloco({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-evt-display text-[clamp(2.6rem,9vw,3.6rem)] leading-none tabular-nums text-evt-ink">
        {String(valor).padStart(2, "0")}
      </span>
      <span className="mt-2 font-evt-util text-[0.55rem] uppercase tracking-[0.3em] text-evt-rosa-ink">
        {rotulo}
      </span>
    </div>
  );
}

function Sep() {
  return <span className="h-9 w-px bg-[var(--line)] sm:h-11" aria-hidden />;
}

export function QgrCountdown({ alvoISO }: { alvoISO: string }) {
  const r = useCountdown(alvoISO);

  // SSR / primeiro paint: reserva a altura (evita layout shift / hydration mismatch).
  if (!r) return <div className="h-[88px]" aria-hidden />;
  if (r.chegou) return <p className="font-evt-script text-[calc(2.25rem*var(--ev-fonte-fator,1))] text-evt-rosa-ink">É hoje! 💗</p>;

  return (
    <div
      className="flex items-center justify-center gap-5 sm:gap-8"
      aria-label="Contagem regressiva para a festa"
    >
      <Bloco valor={r.dias} rotulo="dias" />
      <Sep />
      <Bloco valor={r.horas} rotulo="horas" />
      <Sep />
      <Bloco valor={r.minutos} rotulo="min" />
      <Sep />
      <Bloco valor={r.segundos} rotulo="seg" />
    </div>
  );
}
