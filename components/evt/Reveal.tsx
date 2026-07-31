"use client";
import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Reveal — revela com opacity + ~16px translateY ao entrar na viewport
 * (IntersectionObserver, dispara 1x). Sob prefers-reduced-motion o conteudo e
 * instantaneo (controlado no CSS via `.evt [data-reveal]`). Sem framer-motion;
 * se o JS nao rodar, o conteudo nasce visivel. `delay` escalona reveals proximos.
 */
export function Reveal({
  children,
  as,
  className = "",
  delay = 0,
  dataSec,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  /** Marcador `data-sec` p/ a prévia do editor circular esta seção (opcional). */
  dataSec?: string;
}) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      data-shown={shown ? "true" : "false"}
      data-sec={dataSec}
      className={className}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
