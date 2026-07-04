"use client";
// Contador PRÓPRIO do "Casamento · Clássico Elegante": cada unidade num azulejo
// creme double-bezel, dígitos em display serifado, separados por losangos dourados.
// Reusa só a LÓGICA (useCountdown); o visual é exclusivo deste template.
import { useCountdown } from "@/components/evt/useCountdown";

function Azulejo({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-[calc(var(--radius-card)+0.4rem)] border border-[var(--line-rosa)] bg-white/40 p-1">
        <div className="min-w-[clamp(3.6rem,15vw,5.4rem)] rounded-[var(--radius-card)] border border-[var(--line)] bg-white/75 px-[clamp(0.9rem,3.5vw,1.5rem)] py-[clamp(0.7rem,2.5vw,1.1rem)] shadow-[0_18px_44px_-40px_rgba(46,26,32,0.5)]">
          <span className="block text-center font-evt-display text-[clamp(2.2rem,8vw,3.2rem)] leading-none tabular-nums text-evt-ink">
            {String(valor).padStart(2, "0")}
          </span>
        </div>
      </div>
      <span className="mt-3 font-evt-util text-[0.55rem] uppercase tracking-[0.3em] text-evt-rosa-ink">
        {rotulo}
      </span>
    </div>
  );
}

function Losango() {
  return (
    <span className="mb-6 self-center rotate-45 text-[0.5rem] leading-none text-evt-rosa/70" aria-hidden>
      ◆
    </span>
  );
}

export function Countdown({ alvoISO }: { alvoISO: string }) {
  const r = useCountdown(alvoISO);

  if (!r) return <div className="h-[124px]" aria-hidden />;
  if (r.chegou)
    return (
      <p className="font-evt-script text-[clamp(2.4rem,8vw,3.4rem)] leading-tight text-evt-rosa-ink">
        É hoje!
      </p>
    );

  return (
    <div
      className="flex items-start justify-center gap-[clamp(0.6rem,2.5vw,1.5rem)]"
      aria-label="Contagem regressiva para a celebração"
    >
      <Azulejo valor={r.dias} rotulo="dias" />
      <Losango />
      <Azulejo valor={r.horas} rotulo="horas" />
      <Losango />
      <Azulejo valor={r.minutos} rotulo="min" />
      <Losango />
      <Azulejo valor={r.segundos} rotulo="seg" />
    </div>
  );
}
