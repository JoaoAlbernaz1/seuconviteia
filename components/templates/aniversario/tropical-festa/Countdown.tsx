"use client";
// Contador regressivo VIBRANTE do Tropical Festa: 4 azulejos de gradiente vivo com
// número grande + rótulo, batendo pela lógica compartilhada (useCountdown). Visual
// 100% próprio. Sob reduced-motion o pulse some (regra global .evt + classe atf).
import { useCountdown } from "@/components/evt/useCountdown";

function Azulejo({ valor, rotulo, delay }: { valor: number; rotulo: string; delay: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="atf-pulse relative flex aspect-square w-[clamp(4.4rem,20vw,6.5rem)] items-center justify-center overflow-hidden rounded-[1.25rem] text-white shadow-[0_22px_46px_-26px_rgba(0,0,0,0.55)]"
        style={{
          animationDelay: delay,
          background: "linear-gradient(150deg, var(--ev-framboesa-bright) 0%, var(--ev-framboesa) 55%, var(--ev-framboesa-deep) 100%)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-3 -top-4 h-14 w-14 rounded-full"
          style={{ background: "color-mix(in srgb, var(--ev-rose) 55%, transparent)" }}
        />
        <span className="relative font-evt-display text-[clamp(2.1rem,8vw,3.1rem)] leading-none tabular-nums">
          {String(valor).padStart(2, "0")}
        </span>
      </div>
      <span className="font-evt-util text-[0.56rem] uppercase tracking-[0.28em] text-evt-rosa-ink">{rotulo}</span>
    </div>
  );
}

export function AtfCountdown({ alvoISO }: { alvoISO: string }) {
  const r = useCountdown(alvoISO);

  if (!r) return <div className="h-[7.5rem]" aria-hidden />;
  if (r.chegou)
    return (
      <p className="font-evt-script text-[clamp(2.4rem,8vw,3.4rem)] text-evt-framboesa">É hoje! Bora comemorar 🎉</p>
    );

  return (
    <div className="flex items-start justify-center gap-3 sm:gap-5" aria-label="Contagem regressiva para a festa">
      <Azulejo valor={r.dias} rotulo="dias" delay="0s" />
      <Azulejo valor={r.horas} rotulo="horas" delay="0.3s" />
      <Azulejo valor={r.minutos} rotulo="min" delay="0.6s" />
      <Azulejo valor={r.segundos} rotulo="seg" delay="0.9s" />
    </div>
  );
}
