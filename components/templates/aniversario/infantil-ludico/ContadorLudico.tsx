"use client";
// CONTADOR LÚDICO — quatro "balõezinhos" arredondados e coloridos (dias/horas/
// min/seg) com número grande (font-evt-display) que pulsa suave. Usa o hook
// compartilhado `useCountdown` (só a lógica; o visual é próprio deste template).
// Antes de hidratar mostra "—" (evita mismatch). Reduced-motion: sem pulso
// (herda do reset `.ail-root [class*="ail-"]`).
import { useCountdown } from "@/components/evt/useCountdown";

const GRADS = [
  "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))",
  "linear-gradient(135deg, var(--ev-framboesa-bright), var(--ev-framboesa))",
  "linear-gradient(135deg, var(--ev-rosa), var(--ev-rose))",
  "linear-gradient(135deg, var(--ev-framboesa), var(--ev-framboesa-deep))",
];

export function ContadorLudico({ alvoISO }: { alvoISO: string }) {
  const r = useCountdown(alvoISO);
  const partes: { label: string; valor: number | null }[] = [
    { label: "dias", valor: r?.dias ?? null },
    { label: "horas", valor: r?.horas ?? null },
    { label: "min", valor: r?.minutos ?? null },
    { label: "seg", valor: r?.segundos ?? null },
  ];

  return (
    <div className="flex flex-wrap items-stretch justify-center gap-[clamp(0.6rem,2.5vw,1.1rem)]">
      {partes.map((p, i) => (
        <div
          key={p.label}
          className="ail-pulse flex min-w-[clamp(4.5rem,20vw,6.5rem)] flex-col items-center gap-1 rounded-[1.6rem] px-[clamp(0.9rem,3vw,1.6rem)] py-[clamp(1rem,3.5vw,1.6rem)] text-white shadow-[0_22px_44px_-30px_rgba(46,26,32,0.55)]"
          style={{ background: GRADS[i % GRADS.length], animationDelay: `${i * 0.25}s` }}
        >
          <span className="font-evt-display text-[clamp(2.3rem,9vw,3.6rem)] leading-none tabular-nums">
            {p.valor === null ? "—" : String(p.valor).padStart(2, "0")}
          </span>
          <span className="font-evt-util text-[0.6rem] uppercase tracking-[0.22em] text-white/90">
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
}
