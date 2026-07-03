"use client";

// Confete da tela de celebração: 26 fitas coloridas caindo (keyframe
// `scvConfdrop` do globals.css). As posições/velocidades são sorteadas só no
// CLIENTE, DENTRO do efeito (mantém o Math.random fora do render — regra de
// pureza do React Compiler — e evita divergência de hidratação). `motion-reduce`
// desliga tudo para quem pediu menos movimento.
import { useEffect, useState } from "react";

const CORES = ["#2DE2E6", "#6D28D9", "#A78BFA", "#0EA5A6", "#F472B6", "#FBBF24"];

type Fita = { left: number; dur: number; delay: number; cor: string; w: number; h: number };

export function Confete() {
  const [fitas, setFitas] = useState<Fita[]>([]);

  useEffect(() => {
    const geradas: Fita[] = Array.from({ length: 26 }, (_, i) => ({
      left: Math.random() * 100,
      dur: 2.6 + Math.random() * 2.4,
      delay: Math.random() * 2.2,
      cor: CORES[i % CORES.length],
      w: 6 + Math.round(Math.random() * 4),
      h: 10 + Math.round(Math.random() * 12),
    }));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- popula as fitas 1x no mount (dados aleatórios só-cliente)
    setFitas(geradas);
  }, []);

  if (fitas.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
    >
      {fitas.map((f, i) => (
        <span
          key={i}
          className="absolute top-0 rounded-[2px]"
          style={{
            left: `${f.left}%`,
            width: f.w,
            height: f.h,
            backgroundColor: f.cor,
            animation: `scvConfdrop ${f.dur}s linear ${f.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
