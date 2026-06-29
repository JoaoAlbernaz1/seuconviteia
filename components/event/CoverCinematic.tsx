import type { CSSProperties } from "react";

/**
 * Capa cinematografica do site do evento — replica fiel da `HeroCinematic` do
 * festa-15-maria-clara, porem TEMATIZAVEL pela cor do evento (`accent`) e
 * multi-nicho. Server Component, 100% CSS (sem JS), para que o lockup nunca
 * suma sob prefers-reduced-motion (todo o movimento e CSS-only e desligavel).
 *
 * - Com foto: full-bleed escuro, Ken Burns lento + fade, scrims pra legibilidade
 *   e uma vinheta sutil na cor do evento. Lockup sobe escalonado.
 * - Sem foto (`--solo`): gradiente escuro construido a partir do accent.
 *
 * Toda a estetica vive no bloco `.cv-cover*` em app/globals.css.
 */
type CoverProps = {
  titulo: string;
  nichoLabel: string;
  dataLabel: string;
  accent: string;
  fotoUrl?: string;
};

const rise = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

export function CoverCinematic({
  titulo,
  nichoLabel,
  dataLabel,
  accent,
  fotoUrl,
}: CoverProps) {
  const temFoto = Boolean(fotoUrl);
  const style = {
    ["--accent" as string]: accent,
    ...(fotoUrl ? { ["--cover-photo" as string]: `url('${fotoUrl}')` } : {}),
  } as CSSProperties;

  return (
    <header
      className={`cv-cover${temFoto ? "" : " cv-cover--solo"}`}
      style={style}
    >
      {temFoto && <div className="cv-cover-photo" aria-hidden />}
      <div className="cv-cover-veil" aria-hidden />

      <div className="cv-cover-lockup">
        <p className="cv-cover-eyebrow cv-rise" style={rise(0.1)}>
          {nichoLabel}
        </p>
        <h1 className="cv-cover-name cv-rise" style={rise(0.2)}>
          {titulo}
        </h1>
        <div className="cv-cover-rule cv-rise" style={rise(0.34)} aria-hidden>
          <span />
          <i />
          <span />
        </div>
        {dataLabel && (
          <p className="cv-cover-date cv-rise" style={rise(0.46)}>
            {dataLabel}
          </p>
        )}
      </div>

      <span className="cv-cover-cue" aria-hidden />
    </header>
  );
}
