"use client";
// Contagem regressiva DELICADA (Princesa) — números em medalhões OVAIS de
// fio-de-cabelo, com anel que pulsa devagar. Usa o hook COMPARTILHADO
// (useCountdown) só pela lógica; o visual é 100% deste template. Reduced-motion
// e SSR seguros (null no servidor).
import { useCountdown } from "@/components/evt/useCountdown";

function Medalhao({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative grid h-[clamp(4.6rem,17vw,6rem)] w-[clamp(4.6rem,17vw,6rem)] place-items-center">
        {/* anel externo pulsante + anel interno de renda */}
        <span
          aria-hidden
          className="qpd-pulse absolute inset-0 rounded-[50%] border border-[var(--line-rosa)]"
        />
        <span
          aria-hidden
          className="absolute inset-[6px] rounded-[50%] border border-[var(--line)] bg-white/55 backdrop-blur-[1px]"
        />
        <span className="relative font-evt-display leading-none tabular-nums text-evt-rosa-ink text-[clamp(1.9rem,7vw,2.7rem)]">
          {String(valor).padStart(2, "0")}
        </span>
      </div>
      <span className="font-evt-util text-[0.56rem] uppercase tracking-[0.34em] text-evt-ink-soft">
        {rotulo}
      </span>
    </div>
  );
}

export function ContagemPrincesa({ alvoISO }: { alvoISO: string }) {
  const r = useCountdown(alvoISO);

  // Placeholder de mesma altura no SSR/primeiro paint (evita salto de layout).
  if (!r) return <div className="h-[clamp(6rem,20vw,8rem)]" aria-hidden />;
  if (r.chegou)
    return (
      <p className="font-evt-script text-[clamp(2.2rem,7vw,3rem)] text-evt-rosa-ink">
        É hoje! 🤍
      </p>
    );

  return (
    <div
      className="flex flex-wrap items-start justify-center gap-x-[clamp(0.9rem,4vw,2.25rem)] gap-y-6"
      aria-label="Contagem regressiva para a festa"
    >
      <Medalhao valor={r.dias} rotulo="dias" />
      <Medalhao valor={r.horas} rotulo="horas" />
      <Medalhao valor={r.minutos} rotulo="min" />
      <Medalhao valor={r.segundos} rotulo="seg" />
    </div>
  );
}
