"use client";
// Contador FASHION — usa o hook compartilhado useCountdown (logica testada) com
// markup PROPRIO deste template: numeros display gigantes numa faixa assimetrica,
// rotulos versais finos e filetes. Nada de blocos iguais aos outros templates.
import { useCountdown } from "@/components/evt/useCountdown";

function Unidade({ valor, rotulo, forte = false }: { valor: number; rotulo: string; forte?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col items-center sm:items-start">
      <span
        className={`font-evt-display leading-[0.82] tabular-nums ${
          forte ? "text-evt-rosa-ink" : "text-evt-ink"
        } text-[clamp(3rem,13vw,6rem)]`}
      >
        {String(valor).padStart(2, "0")}
      </span>
      <span className="mt-2 font-evt-util text-[0.58rem] uppercase tracking-[0.32em] text-evt-ink-soft">
        {rotulo}
      </span>
    </div>
  );
}

export function ContadorFashion({ alvoISO }: { alvoISO: string }) {
  const r = useCountdown(alvoISO);

  // SSR / primeiro paint: reserva a altura pra nao "pular".
  if (!r) return <div className="h-[132px]" aria-hidden />;

  if (r.chegou) {
    return (
      <p className="font-evt-display uppercase tracking-[0.02em] text-evt-rosa-ink text-[clamp(2.2rem,8vw,3.4rem)]">
        É hoje
      </p>
    );
  }

  return (
    <div
      className="flex flex-wrap items-end justify-center gap-x-[clamp(1.25rem,5vw,3rem)] gap-y-6 sm:justify-start"
      aria-label="Contagem regressiva para a festa"
    >
      <Unidade valor={r.dias} rotulo="dias" forte />
      <span className="mb-8 hidden h-16 w-px self-center bg-[var(--line)] sm:block" aria-hidden />
      <Unidade valor={r.horas} rotulo="horas" />
      <span className="mb-8 hidden h-16 w-px self-center bg-[var(--line)] sm:block" aria-hidden />
      <Unidade valor={r.minutos} rotulo="min" />
      <span className="mb-8 hidden h-16 w-px self-center bg-[var(--line)] sm:block" aria-hidden />
      <Unidade valor={r.segundos} rotulo="seg" />
    </div>
  );
}
