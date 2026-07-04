"use client";
// GaleriaFashion — grade EDITORIAL assimetrica (mosaico de revista, spans e
// proporcoes variadas) + lightbox proprio (portal, teclado, swipe, trava o
// scroll). Escopo deste template; nao reusa o Galeria compartilhado (aquele e
// uniforme 2/3 colunas — aqui e mosaico editorial).
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { XMark, ChevronLeft } from "@/components/evt/icons";

// Mosaico repetido a cada 6 fotos. Mobile: linhas somam 2 col; desktop: 6 col.
const SPANS = [
  "col-span-2 aspect-[4/3] sm:col-span-4 sm:aspect-[16/10]",
  "col-span-1 aspect-[3/4] sm:col-span-2 sm:aspect-[3/4]",
  "col-span-1 aspect-[3/4] sm:col-span-2 sm:aspect-[3/4]",
  "col-span-2 aspect-[16/10] sm:col-span-4 sm:aspect-[16/10]",
  "col-span-1 aspect-[3/4] sm:col-span-3 sm:aspect-[4/5]",
  "col-span-1 aspect-[3/4] sm:col-span-3 sm:aspect-[4/5]",
];

export function GaleriaFashion({ fotos, nome }: { fotos: string[]; nome?: string }) {
  const [idx, setIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const open = idx !== null;
  const touchX = useRef<number | null>(null);
  const legenda = (i: number) => `${nome ? `${nome} — ` : ""}foto ${i + 1}`;

  // eslint-disable-next-line react-hooks/set-state-in-effect -- flag de mount p/ o portal
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6 sm:gap-3">
        {fotos.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Abrir foto ${i + 1} de ${fotos.length}`}
            className={`qfe-tile group relative w-full overflow-hidden ${SPANS[i % SPANS.length]} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white`}
          >
            <Image
              src={src}
              alt={legenda(i)}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
            />
            <span aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[var(--line)]" />
            <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-evt-ivory/85 px-2.5 py-1 font-evt-util text-[0.52rem] uppercase tracking-[0.24em] text-evt-rosa-ink opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
              Nº {String(i + 1).padStart(2, "0")}
            </span>
          </button>
        ))}
      </div>

      {mounted && open && idx !== null &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Foto ${idx + 1} de ${fotos.length}`}
            onClick={close}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/92 backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Fechar"
              className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-black/35 text-white/90 backdrop-blur-sm transition-colors hover:border-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <XMark className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Anterior"
              className="absolute left-2 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-black/35 text-white/85 backdrop-blur-sm transition-colors hover:bg-black/55 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-5"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>

            <div className="relative h-[84svh] w-[92vw]" onClick={(e) => e.stopPropagation()}>
              <Image src={fotos[idx]} alt={legenda(idx)} fill priority sizes="92vw" className="object-contain" />
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Próxima"
              className="absolute right-2 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-black/35 text-white/85 backdrop-blur-sm transition-colors hover:bg-black/55 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5"
            >
              <ChevronLeft className="h-7 w-7 rotate-180" />
            </button>

            <span className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 font-evt-util text-[0.66rem] uppercase tracking-[0.3em] text-white/70">
              {String(idx + 1).padStart(2, "0")} / {String(fotos.length).padStart(2, "0")}
            </span>
          </div>,
          document.body,
        )}

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .qfe-tile img { transition: none !important; transform: none !important; }
        }
      `}</style>
    </>
  );
}
