"use client";
import { useEffect, useState } from "react";
import { tempoRestante, type Restante } from "@/lib/countdown";

/**
 * Countdown — contagem regressiva viva. Reusa a logica testada de
 * lib/countdown.ts (tempoRestante). Renderiza Dias/Horas/Minutos/Segundos;
 * ao chegar mostra "E hoje! 💗". Porte fiel do festa-15-maria-clara (rename `evt-`).
 *
 * Numeros na display Didone em ink (so digitos, sem acento -> sem tofu), rotulos
 * rosa, separadores hairline. Calmo sobre branco.
 */
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

export function Countdown({ alvoISO }: { alvoISO: string }) {
  const [r, setR] = useState<Restante | null>(null); // null no SSR -> evita hydration mismatch

  useEffect(() => {
    const alvo = new Date(alvoISO);
    const tick = () => setR(tempoRestante(alvo, new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [alvoISO]);

  if (!r) return <div className="h-[88px]" aria-hidden />;
  if (r.chegou)
    return <p className="font-evt-script text-3xl text-evt-rosa-ink">É hoje! 💗</p>;

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
