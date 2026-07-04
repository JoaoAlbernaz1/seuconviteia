"use client";
// Galeria do template Editorial Moderno — GRADE EDITORIAL (mosaico de revista):
// colunas com alturas variadas (aspect-ratios ciclicos) que quebram a monotonia,
// + lightbox proprio (portal, teclado Esc/setas, swipe no touch, contador). Nao
// reusa components/evt/Galeria (aquela grade e uniforme); esta e a "cara" do
// template. Data-driven: `fotos` + `nome` (alt/legenda).
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { XMark, ChevronLeft } from "@/components/evt/icons";

// Sequencia de proporcoes — cria o ritmo editorial (retrato alto, meio, quadrado).
const RATIOS = [
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-[1/1]",
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-[5/6]",
];

export function CemGaleria({ fotos, nome }: { fotos: string[]; nome?: string }) {
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
      {/* ── Mosaico editorial (colunas com alturas variadas) ── */}
      <div className="columns-2 [column-gap:clamp(0.5rem,1.6vw,1rem)] md:columns-3">
        {fotos.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Abrir foto ${i + 1} de ${fotos.length}`}
            className="group relative mb-[clamp(0.5rem,1.6vw,1rem)] block w-full break-inside-avoid overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-evt-ivory"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 ring-1 ring-inset ring-[var(--line)] transition-[box-shadow] duration-300 group-hover:ring-[var(--line-rosa)]"
            />
            <span className={`relative block w-full ${RATIOS[i % RATIOS.length]}`}>
              <Image
                src={src}
                alt={legenda(i)}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
              />
            </span>
          </button>
        ))}
      </div>

      {/* ── Lightbox (portal p/ document.body) ── */}
      {mounted &&
        open &&
        idx !== null &&
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
              className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex h-11 w-11 cursor-pointer items-center justify-center border border-white/25 bg-black/35 text-white/90 backdrop-blur-sm transition-colors hover:border-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <XMark className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Anterior"
              className="absolute left-2 z-20 flex h-12 w-12 cursor-pointer items-center justify-center bg-black/35 text-white/85 backdrop-blur-sm transition-colors hover:bg-black/55 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-5"
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
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Próxima"
              className="absolute right-2 z-20 flex h-12 w-12 cursor-pointer items-center justify-center bg-black/35 text-white/85 backdrop-blur-sm transition-colors hover:bg-black/55 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5"
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
