"use client";

import { useEffect, useRef } from "react";

function fmt(v: number, decimais: number) {
  return v.toLocaleString("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  });
}

/**
 * Número que conta até o valor quando entra na tela (skill animation-designer:
 * "Animated Number Counter", em vanilla p/ não puxar dependência).
 *
 * O texto final já vem no HTML (sem JS o número aparece certo). Ao montar, o
 * componente escreve direto no nó de texto via ref — o DOM é o "sistema
 * externo", então não há re-render por quadro. Dispara UMA vez por
 * IntersectionObserver (nada de listener de scroll) e respeita
 * `prefers-reduced-motion`.
 */
export function Contador({
  ate,
  decimais = 0,
  sufixo = "",
}: {
  ate: number;
  decimais?: number;
  sufixo?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduz || typeof IntersectionObserver === "undefined") return;

    let raf = 0;
    el.textContent = fmt(0, decimais) + sufixo;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          const inicio = performance.now();
          const dur = 1100;
          const passo = (agora: number) => {
            const t = Math.min(1, (agora - inicio) / dur);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            el.textContent = fmt(ate * eased, decimais) + sufixo;
            if (t < 1) raf = requestAnimationFrame(passo);
          };
          raf = requestAnimationFrame(passo);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = fmt(ate, decimais) + sufixo;
    };
  }, [ate, decimais, sufixo]);

  return <span ref={ref}>{fmt(ate, decimais) + sufixo}</span>;
}
