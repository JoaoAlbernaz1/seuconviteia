"use client";
import { useEffect, useState } from "react";
import { tempoRestante, type Restante } from "@/lib/countdown";

/**
 * Contador regressivo vivo — portado do festa-15-maria-clara. Reusa a logica
 * pura/testada de lib/countdown.ts. Estilo deriva do `.cv` (cor do evento):
 * digitos em serifa display (tinta), rotulos no accent, separadores hairline.
 *
 * `null` no SSR evita hydration mismatch; reserva altura pra nao causar CLS.
 */
function Bloco({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="cv-cd-bloco">
      <span className="cv-cd-num">{String(valor).padStart(2, "0")}</span>
      <span className="cv-cd-lbl">{rotulo}</span>
    </div>
  );
}

export function Countdown({ alvoISO }: { alvoISO: string }) {
  const [r, setR] = useState<Restante | null>(null);

  useEffect(() => {
    const alvo = new Date(alvoISO);
    const tick = () => setR(tempoRestante(alvo, new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [alvoISO]);

  if (!r) return <div className="cv-cd-spacer" aria-hidden />;
  if (r.chegou) return <p className="cv-cd-hoje">É hoje!</p>;

  return (
    <div className="cv-cd" aria-label="Contagem regressiva para o evento">
      <Bloco valor={r.dias} rotulo="dias" />
      <span className="cv-cd-sep" aria-hidden />
      <Bloco valor={r.horas} rotulo="horas" />
      <span className="cv-cd-sep" aria-hidden />
      <Bloco valor={r.minutos} rotulo="min" />
      <span className="cv-cd-sep" aria-hidden />
      <Bloco valor={r.segundos} rotulo="seg" />
    </div>
  );
}
