"use client";
// Mapa DARK do template Noite Luxo. Mesma técnica do MapEmbed (placeholder que
// aparece na hora + mapa real em fade por cima, nunca fica em branco), moldura
// grafite com filete dourado e pin/nome do local dourados.
import { useEffect, useState } from "react";

export function MapaNoite({
  src,
  local,
  linkUrl,
}: {
  src: string;
  local: string;
  linkUrl?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-[16px]"
      style={{
        border: "1px solid color-mix(in srgb, var(--ev-rosa) 30%, transparent)",
        boxShadow: "0 40px 90px -60px rgba(0,0,0,0.95)",
      }}
    >
      {/* Placeholder escuro — visível na hora, atrás do mapa. */}
      <div
        aria-hidden
        className="absolute inset-0 flex flex-col items-center justify-center gap-3"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 30%, color-mix(in srgb, var(--ev-rosa) 12%, transparent), transparent 62%), #14110C",
        }}
      >
        <svg viewBox="0 0 24 24" className="h-9 w-9" fill="currentColor" style={{ color: "var(--ev-rosa)" }}>
          <path d="M12 2a7 7 0 0 0-7 7c0 4.6 6.1 12.2 6.4 12.5a.8.8 0 0 0 1.2 0C13 21.2 19 13.6 19 9a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
        </svg>
        <p className="cnl-gold px-6 text-center font-evt-script text-[clamp(1.6rem,4vw,2.1rem)] leading-tight">
          {local}
        </p>
      </div>

      <iframe
        src={src}
        title={`Mapa — ${local}`}
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className={`relative block h-[300px] w-full border-0 transition-opacity duration-700 sm:h-[400px] ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {linkUrl && (
        <a
          href={linkUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Abrir ${local} no Google Maps`}
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-5 py-2 font-evt-util text-[0.68rem] font-semibold uppercase tracking-[0.2em] backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ev-rose)]"
          style={{
            background: "rgba(11,9,6,0.82)",
            color: "var(--ev-rose)",
            border: "1px solid color-mix(in srgb, var(--ev-rosa) 45%, transparent)",
          }}
        >
          Abrir no Google Maps →
        </a>
      )}
    </div>
  );
}
