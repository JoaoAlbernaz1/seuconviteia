"use client";

import { useEffect } from "react";

/**
 * Reveal on scroll (progressive enhancement, estilo jitter).
 *
 * Sem JS o conteúdo é SEMPRE visível (default robusto). Ao montar, marca
 * `document.documentElement` com `.rv-on` — só então o CSS esconde os
 * `[data-rv]` e os revela quando entram na viewport (classe `.rv-in`).
 * Respeita `prefers-reduced-motion` (o CSS troca o movimento por fade curto).
 */
export function RevealOnScroll() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("rv-on");

    const els = Array.from(document.querySelectorAll<HTMLElement>(".mkt [data-rv]"));

    // Sem IntersectionObserver (ou reduced-motion): mostra tudo já.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("rv-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("rv-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    els.forEach((el) => io.observe(el));

    // Failsafe: se algo escapar do observer, revela após 1.6s.
    const t = window.setTimeout(() => els.forEach((el) => el.classList.add("rv-in")), 1600);

    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  return null;
}
