"use client";
import { useEffect, useState } from "react";

/**
 * Mapa do evento (/evento). O <iframe> do Google Maps leva alguns segundos para
 * pintar os tiles — antes disso o card ficava BRANCO (parecia bug). Aqui um
 * placeholder tematizado (pin + nome do local) aparece NA HORA e o mapa real faz
 * fade-in por cima quando carrega (onLoad). Nunca fica em branco.
 */
export function MapEmbed({
  src,
  local,
  linkUrl,
}: {
  src: string;
  local: string;
  linkUrl?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  // O `onLoad` do iframe dispara cedo demais (antes dos tiles do Google
  // pintarem) e mostraria o cinza de carregamento dele. Em vez disso, seguramos
  // o placeholder tematizado por ~2s e fazemos o mapa real surgir por cima.
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] shadow-[0_22px_50px_-40px_rgba(46,26,32,0.35)]">
      {/* Placeholder — visível imediatamente, atrás do mapa. */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-evt-blush-soft to-evt-blush-section"
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          className="h-9 w-9 text-evt-rosa"
          fill="currentColor"
        >
          <path d="M12 2a7 7 0 0 0-7 7c0 4.6 6.1 12.2 6.4 12.5a.8.8 0 0 0 1.2 0C13 21.2 19 13.6 19 9a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
        </svg>
        <p className="px-6 text-center font-evt-script text-[calc(clamp(1.6rem,4vw,2.1rem)*var(--ev-fonte-fator,1))] leading-tight text-evt-ink">
          {local}
        </p>
      </div>

      <iframe
        src={src}
        title={`Mapa — ${local}`}
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className={`relative block h-[300px] w-full border-0 transition-opacity duration-700 sm:h-[380px] ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {linkUrl && (
        <a
          href={linkUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Abrir ${local} no Google Maps`}
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-5 py-2 font-evt-util text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-evt-rosa-ink shadow-[0_8px_24px_-8px_rgba(46,26,32,0.4)] transition-colors hover:text-evt-framboesa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Abrir no Google Maps →
        </a>
      )}
    </div>
  );
}
