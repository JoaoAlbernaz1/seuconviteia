"use client";
import { useEffect, useRef } from "react";

/**
 * Campo de particulas — faiscas que flutuam para cima e cintilam, atras de todo
 * o site do evento. Portado do festa-15-maria-clara, mas TEMATIZAVEL: recebe as
 * cores (triplets "r,g,b") derivadas do accent do evento (ver lib/cor.ts).
 *
 * Sutil, performatico (canvas 2D, DPR cap 2) e respeita prefers-reduced-motion
 * (nem inicializa sob movimento reduzido).
 */
export function Particles({
  cores,
  className = "",
}: {
  cores: string[];
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const colors = cores.length ? cores : ["226,214,198"];
    let raf = 0,
      w = 0,
      h = 0,
      t = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type P = {
      x: number;
      y: number;
      r: number;
      vy: number;
      vx: number;
      a: number;
      tw: number;
      c: string;
    };
    let ps: P[] = [];
    const seed = () => {
      const n = Math.min(58, Math.max(22, Math.floor((w * h) / 20000)));
      ps = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.7 + 0.5,
        vy: -(Math.random() * 0.26 + 0.05),
        vx: (Math.random() - 0.5) * 0.13,
        a: Math.random() * 0.42 + 0.16,
        tw: Math.random() * 0.018 + 0.004,
        c: colors[Math.floor(Math.random() * colors.length)],
      }));
    };
    let lastW = -1;
    const resize = () => {
      // Ignora mudancas so de ALTURA (barra do navegador no mobile some/aparece);
      // so reinicia quando a LARGURA muda — senao as particulas piscam.
      const nw = canvas.clientWidth;
      if (nw === lastW) return;
      lastW = nw;
      w = nw;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };
    const tick = () => {
      t++;
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.y += p.vy;
        p.x += p.vx;
        if (p.y < -6) {
          p.y = h + 6;
          p.x = Math.random() * w;
        }
        if (p.x < -6) p.x = w + 6;
        else if (p.x > w + 6) p.x = -6;
        const a = Math.max(0, Math.min(1, p.a + Math.sin(t * p.tw) * 0.22));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${a})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(${p.c},0.5)`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    resize();
    tick();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [cores]);

  // h-[100lvh] = viewport grande estavel — nao redimensiona quando a barra do
  // navegador some/aparece (evita o "pisca" das particulas no fim da pagina).
  return (
    <canvas
      ref={ref}
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 h-[100lvh] w-full ${className}`}
    />
  );
}
