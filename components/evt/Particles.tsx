"use client";
import { useEffect, useRef } from "react";

// Campo de particulas — faiscas que flutuam para cima e cintilam. Replica do
// festa. Sutil, performatico e respeita prefers-reduced-motion (sob reducao de
// movimento o canvas nem desenha). `colors` = triplets "r,g,b"; o default e o
// trio EXATO do festa (prata/rosa/rose) — o site re-tinge passando outro trio.
const CORES_PADRAO = ["192,192,192", "232,111,166", "244,167,185"];

export function Particles({
  className = "",
  colors = CORES_PADRAO,
}: {
  className?: string;
  colors?: string[];
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0, w = 0, h = 0, t = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cores = colors.length > 0 ? colors : CORES_PADRAO;
    type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; tw: number; c: string };
    let ps: P[] = [];
    const seed = () => {
      const n = Math.min(64, Math.max(24, Math.floor((w * h) / 18000)));
      ps = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.7 + 0.5, vy: -(Math.random() * 0.28 + 0.06),
        vx: (Math.random() - 0.5) * 0.14, a: Math.random() * 0.45 + 0.18,
        tw: Math.random() * 0.018 + 0.004, c: cores[Math.floor(Math.random() * cores.length)],
      }));
    };
    let lastW = -1;
    const resize = () => {
      const nw = canvas.clientWidth;
      // IGNORA mudancas so de ALTURA (no celular a barra do navegador some/aparece
      // e mudava so a altura -> as particulas piscavam). So refaz se a LARGURA muda.
      if (nw === lastW) return;
      lastW = nw;
      w = nw; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };
    const tick = () => {
      t++; ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.y += p.vy; p.x += p.vx;
        if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
        if (p.x < -6) p.x = w + 6; else if (p.x > w + 6) p.x = -6;
        const a = Math.max(0, Math.min(1, p.a + Math.sin(t * p.tw) * 0.22));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${a})`;
        ctx.shadowBlur = 6; ctx.shadowColor = `rgba(${p.c},0.55)`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    resize(); tick();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [colors]);
  // h-[100lvh] = altura do viewport GRANDE (estavel) — nao muda quando a barra do
  // navegador some/aparece, entao o canvas nao redimensiona/pisca ao chegar no fim.
  return <canvas ref={ref} aria-hidden className={`pointer-events-none fixed inset-x-0 top-0 h-[100lvh] w-full ${className}`} />;
}
