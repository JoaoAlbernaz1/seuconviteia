"use client";
// Hook de contagem regressiva COMPARTILHADO (só lógica; sem visual). Cada template
// renderiza o contador com o SEU próprio markup usando este hook — assim a
// contagem "bate" igual, mas o visual é livre por template.
import { useEffect, useState } from "react";
import { tempoRestante, type Restante } from "@/lib/countdown";

/** Retorna o tempo restante até `alvoISO` (null no SSR → evita hydration mismatch). */
export function useCountdown(alvoISO: string): Restante | null {
  const [r, setR] = useState<Restante | null>(null);
  useEffect(() => {
    const alvo = new Date(alvoISO);
    const tick = () => setR(tempoRestante(alvo, new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [alvoISO]);
  return r;
}
