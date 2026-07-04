"use client";
// Galeria PRÓPRIA do "Casamento · Clássico Elegante": grade com molduras suaves
// (mat creme + filete dourado, cantos delicados) e lightbox portado ao <body>.
// Distinta da <Galeria> compartilhada (grade/ring diferentes) — mesma robustez:
// teclado (Esc/setas), swipe no touch, contador, trava de scroll.
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { XMark, ChevronLeft } from "@/components/evt/icons";

export function GaleriaClassica({ fotos, nome }: { fotos: string[]; nome?: string }) {
  const [idx, setIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const open = idx !== null;
  const touchX = useRef<number | null>(null);
  const legenda = (i: number) => `${nome ? `${nome} — ` : ""}foto ${i + 1}`;

  // eslint-disable-next-line react-hooks/set-state-in-effect -- flag de mount p/ o portal do lightbox
  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setIdx(null), []);
  const prev = useCallback(
    () => setIdx((i) => (i === null ? i : (i - 1 + fotos.length) % fotos.length)),
    [fotos.length],
  );
  const next = useCallback(
    () => setIdx((i) => (i === null ? i : (i + 1) % fotos.length)),
    [fotos.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, prev, next]);

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    if (Math.abs(dx) > 48) (dx > 0 ? prev : next)();
    touchX.current = null;
  }

  return (
    <>
      {/* ── Grade com molduras suaves (mat + filete dourado) ── */}
      <div className="grid grid-cols-2 gap-[clamp(0.75rem,2.5vw,1.4rem)] sm:grid-cols-3">
        {fotos.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Abrir foto ${i + 1} de ${fotos.length}`}
            className="group rounded-[calc(var(--radius-card)+0.4rem)] border border-[var(--line-rosa)] bg-white/45 p-1.5 shadow-[0_26px_60px_-52px_rgba(46,26,32,0.5)] transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_30px_64px_-44px_rgba(46,26,32,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <span className="relative block aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)]">
              <Image
                src={src}
                alt={legenda(i)}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
              />
            </span>
          </button>
        ))}
      </div>

      {/* ── Lightbox — portado ao document.body ── */}
      {mounted && open && idx !== null &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Foto ${idx + 1} de ${fotos.length}`}
            onClick={close}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1a1013]/92 backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Fechar"
              className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-black/30 text-white/90 backdrop-blur-sm transition-colors hover:border-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <XMark className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Anterior"
              className="absolute left-2 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-black/30 text-white/85 backdrop-blur-sm transition-colors hover:bg-black/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-5"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>

            <div className="relative h-[84svh] w-[92vw]" onClick={(e) => e.stopPropagation()}>
              <Image
                src={fotos[idx]}
                alt={legenda(idx)}
                fill
                priority
                sizes="92vw"
                className="object-contain"
              />
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Próxima"
              className="absolute right-2 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-black/30 text-white/85 backdrop-blur-sm transition-colors hover:bg-black/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5"
            >
              <ChevronLeft className="h-7 w-7 rotate-180" />
            </button>

            <span className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 font-evt-util text-[0.66rem] uppercase tracking-[0.3em] text-white/70">
              {idx + 1} / {fotos.length}
            </span>
          </div>,
          document.body,
        )}
    </>
  );
}
