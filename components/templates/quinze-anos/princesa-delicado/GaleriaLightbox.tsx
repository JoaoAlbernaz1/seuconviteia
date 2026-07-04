"use client";
// Galeria DELICADA (Princesa) — grade com MOLDURAS LEVES (fio-de-cabelo + halo
// rosa no hover) e lightbox em tela cheia. Markup próprio do template; só a
// lógica de navegação (teclado/swipe/portal/trava de scroll) segue o padrão
// funcional da casa. Reduced-motion seguro (transições curtas, sem parallax).
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { XMark, ChevronLeft } from "@/components/evt/icons";

export function GaleriaPrincesa({ fotos, nome }: { fotos: string[]; nome?: string }) {
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

  // Ritmo "quadro na parede": alterna retrato/paisagem por posição, com um
  // realce ocasional que ocupa duas colunas (mosaico suave, nunca rígido).
  const proporcao = (i: number) =>
    i % 5 === 0 ? "aspect-[4/5]" : i % 3 === 0 ? "aspect-square" : "aspect-[4/5]";
  const largura = (i: number) => (i % 7 === 0 ? "sm:col-span-2 sm:row-span-1" : "");

  return (
    <>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5">
        {fotos.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Abrir foto ${i + 1} de ${fotos.length}`}
            className={`group relative w-full rounded-[1.4rem] border border-[var(--line)] bg-white/45 p-[6px] shadow-[0_26px_60px_-48px_rgba(46,26,32,0.4)] transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-1 hover:border-[var(--line-rosa)] hover:shadow-[0_34px_70px_-46px_rgba(46,26,32,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white ${largura(i)}`}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-[11px] z-10 rounded-[1rem] border border-[var(--line-rosa)] opacity-0 transition-opacity duration-500 group-hover:opacity-55"
            />
            <div className={`relative w-full overflow-hidden rounded-[1.05rem] ${proporcao(i)}`}>
              <Image
                src={src}
                alt={legenda(i)}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
              />
            </div>
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
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Fechar"
              className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/10 text-white/90 backdrop-blur-sm transition-colors hover:border-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <XMark className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Anterior"
              className="absolute left-2 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white/85 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-5"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>

            <div className="relative h-[82svh] w-[92vw] p-2" onClick={(e) => e.stopPropagation()}>
              <div className="relative h-full w-full overflow-hidden rounded-[1.4rem] ring-1 ring-white/15">
                <Image
                  src={fotos[idx]}
                  alt={legenda(idx)}
                  fill
                  priority
                  sizes="92vw"
                  className="object-contain"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Próxima"
              className="absolute right-2 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white/85 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5"
            >
              <ChevronLeft className="h-7 w-7 rotate-180" />
            </button>

            <span className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 font-evt-util text-[0.64rem] uppercase tracking-[0.32em] text-white/75">
              {idx + 1} / {fotos.length}
            </span>
          </div>,
          document.body,
        )}
    </>
  );
}
