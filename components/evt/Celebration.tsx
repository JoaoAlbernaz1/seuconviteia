"use client";
import { useEffect, useRef } from "react";

// Celebracao discreta na tela de obrigada — petalas/faiscas que descem suavemente
// e somem em ~2.5s. Replica FIEL do festa. Roda uma vez; respeita
// prefers-reduced-motion. `colors` = triplets "r,g,b"; o default e o quarteto
// EXATO do festa (rose/blush/framboesa/prata) — a /obrigada re-tinge por tema.
const CORES_PADRAO = ["232,111,166", "244,167,185", "155,38,121", "192,192,192"];

export function Celebration({ colors = CORES_PADRAO }: { colors?: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = canvas.clientWidth;
    let h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cores = colors.length > 0 ? colors : CORES_PADRAO;
    type P = {
      x: number; y: number; rx: number; ry: number; vy: number; vx: number;
      sway: number; phase: number; rot: number; vrot: number; life: number; max: number; c: string;
    };

    const n = 36 + Math.floor(Math.random() * 13);
    const ps: P[] = Array.from({ length: n }, () => {
      const size = Math.random() * 4 + 3;
      return {
        x: Math.random() * w, y: -10 - Math.random() * h * 0.3,
        rx: size, ry: size * (0.55 + Math.random() * 0.3),
        vy: 0.5 + Math.random() * 0.9, vx: (Math.random() - 0.5) * 0.3,
        sway: 0.4 + Math.random() * 0.8, phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI, vrot: (Math.random() - 0.5) * 0.06,
        life: 0, max: 120 + Math.random() * 60,
        c: cores[Math.floor(Math.random() * cores.length)],
      };
    });

    let raf = 0;
    let t = 0;
    const tick = () => {
      t++;
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      for (const p of ps) {
        if (p.life >= p.max) continue;
        alive++;
        p.life++;
        p.vy += 0.012;
        p.y += p.vy;
        p.x += p.vx + Math.sin(t * 0.03 + p.phase) * p.sway * 0.4;
        p.rot += p.vrot;
        const fadeIn = Math.min(1, p.life / 12);
        const fadeOut = 1 - Math.max(0, (p.life - p.max * 0.45) / (p.max * 0.55));
        const a = Math.max(0, Math.min(1, fadeIn * fadeOut)) * 0.85;
        if (a <= 0) continue;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${a})`;
        ctx.shadowBlur = 5;
        ctx.shadowColor = `rgba(${p.c},${a * 0.5})`;
        ctx.fill();
        ctx.restore();
      }
      if (alive > 0) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };

    const onResize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [colors]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[40] h-full w-full" />;
}
