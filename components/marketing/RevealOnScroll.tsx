"use client";

import { useEffect } from "react";

/**
 * Reveal on scroll da landing (progressive enhancement).
 *
 * Sem JS o conteúdo é SEMPRE visível. Ao montar, marca
 * `document.documentElement` com `.rv-on` — só então o CSS esconde os
 * `[data-rv]` e os revela quando entram na viewport (classe `.rv-in`).
 *
 * Regras que fazem a coisa aparecer NO RITMO DA ROLAGEM:
 * - `rootMargin` recorta 14% de baixo: o elemento só acende quando já
 *   entrou de verdade na tela (e não quando encosta a borda);
 * - o que já está visível no primeiro quadro (hero) acende na hora, com o
 *   atraso do próprio `--d`, para a página não "piscar" ao carregar;
 * - NÃO existe failsafe que revela tudo por tempo — era o que fazia todo o
 *   resto da página aparecer sozinho antes de o João chegar rolando.
 * Respeita `prefers-reduced-motion` (o CSS troca movimento por fade curto).
 */
export function RevealOnScroll() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("rv-on");

    const els = Array.from(document.querySelectorAll<HTMLElement>(".mkt [data-rv]"));
    if (!els.length) return;

    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("rv-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("rv-in");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -14% 0px", threshold: 0.01 },
    );

    // o que já está na primeira tela entra sem esperar rolagem
    const alturaViewport = window.innerHeight;
    for (const el of els) {
      const topo = el.getBoundingClientRect().top;
      if (topo < alturaViewport * 0.92) el.classList.add("rv-in");
      else io.observe(el);
    }

    return () => io.disconnect();
  }, []);

  return null;
}
