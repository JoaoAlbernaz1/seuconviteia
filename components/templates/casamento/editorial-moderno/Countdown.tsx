"use client";
// Contador regressivo do template Editorial Moderno. Usa o hook COMPARTILHADO
// (useCountdown) mas com markup PROPRIO: numeros display gigantes alinhados numa
// linha, sem molduras nem separadores — o espaco em branco faz o ritmo (revista).
// Reduced-motion safe (o hook so atualiza texto; sem animacao de layout).
import { useCountdown } from "@/components/evt/useCountdown";

const UNIDADES: { chave: "dias" | "horas" | "minutos" | "segundos"; rotulo: string }[] = [
  { chave: "dias", rotulo: "dias" },
  { chave: "horas", rotulo: "horas" },
  { chave: "minutos", rotulo: "min" },
  { chave: "segundos", rotulo: "seg" },
];

export function CemCountdown({ alvoISO }: { alvoISO: string }) {
  const r = useCountdown(alvoISO);

  // SSR / primeiro paint: reserva a altura p/ nao "pular" quando hidratar.
  if (!r) return <div className="h-[clamp(4.5rem,13vw,7rem)]" aria-hidden />;

  if (r.chegou) {
    return (
      <p className="font-evt-display uppercase leading-none text-evt-rosa-ink text-[clamp(2.4rem,8vw,4rem)]">
        É hoje
      </p>
    );
  }

  return (
    <div
      className="flex flex-wrap items-end gap-x-[clamp(1.25rem,5vw,3rem)] gap-y-6"
      aria-label="Contagem regressiva para a data"
    >
      {UNIDADES.map(({ chave, rotulo }) => (
        <div key={chave} className="flex flex-col items-start">
          <span className="font-evt-display leading-[0.82] tabular-nums text-evt-ink text-[clamp(3rem,11vw,5.6rem)]">
            {String(r[chave]).padStart(2, "0")}
          </span>
          <span className="mt-3 font-evt-util text-[0.56rem] font-medium uppercase tracking-[0.34em] text-evt-rosa-ink">
            {rotulo}
          </span>
        </div>
      ))}
    </div>
  );
}
