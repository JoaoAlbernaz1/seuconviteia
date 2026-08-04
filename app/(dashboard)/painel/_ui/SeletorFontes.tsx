"use client";

// Seletor de fontes do site do evento em formato DROPDOWN: fechado mostra a
// fonte atual (o nome do convite escrito nela + o nome real da fonte); ao clicar
// abre a lista de estilos, cada um renderizado na própria fonte, para o cliente
// ESCOLHER VENDO. Reusado na criação (wizard) e na edição ("Trocar o estilo").
// Carrega `EVT_FONTS_CLASS` no próprio wrapper para as variáveis de fonte do
// evento resolverem em qualquer tela do painel.
import { useEffect, useRef, useState } from "react";
import { FONTES, fonteDupla } from "@/lib/fontes";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";

/** Estilo inline (fontFamily + caixa-alta) para renderizar o nome numa dupla. */
function amostraStyle(f: (typeof FONTES)[string]): React.CSSProperties {
  return {
    fontFamily: f.vars["--ev-font-script"],
    fontSize: Math.round(18 * f.scriptScale) + 8,
    textTransform: f.caps ? "uppercase" : "none",
    letterSpacing: f.caps ? "0.12em" : undefined,
  };
}

export function SeletorFontes({
  nome,
  value,
  onChange,
}: {
  /** Nome renderizado em cada estilo (ex.: o nome do aniversariante). */
  nome: string;
  value: string;
  onChange: (key: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const amostra = nome.trim() || "Seu nome";
  const atual = fonteDupla(value);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [aberto]);

  return (
    <div ref={ref} className={`relative ${EVT_FONTS_CLASS}`}>
      {/* Gatilho — fonte atual */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto((a) => !a)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-scv-line bg-scv-card px-4 py-3 transition-colors hover:border-scv-dash"
      >
        <span className="flex min-w-0 items-baseline gap-2.5">
          <span className="truncate leading-none text-scv-ink" style={amostraStyle(atual)}>
            {amostra}
          </span>
          <span className="shrink-0 text-[11.5px] font-semibold text-scv-muted">
            {atual.label}
          </span>
        </span>
        <i
          className={`bi ${aberto ? "bi-chevron-up" : "bi-chevron-down"} shrink-0 text-scv-faint`}
          aria-hidden
        />
      </button>

      {/* Lista aberta */}
      {aberto ? (
        <div
          role="listbox"
          className="mt-1.5 max-h-[300px] overflow-y-auto rounded-xl border border-scv-line bg-scv-card p-1 shadow-[0_20px_48px_-20px_rgba(15,23,42,0.28)]"
        >
          {Object.values(FONTES).map((f) => {
            const sel = value === f.key;
            return (
              <button
                key={f.key}
                type="button"
                role="option"
                aria-selected={sel}
                aria-label={`Fonte ${f.label}`}
                onClick={() => {
                  onChange(f.key);
                  setAberto(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  sel ? "bg-violeta/5" : "hover:bg-scv-field"
                }`}
              >
                <span className="truncate leading-none text-scv-ink" style={amostraStyle(f)}>
                  {amostra}
                </span>
                <span
                  className={`flex shrink-0 items-center gap-1.5 text-[11.5px] font-semibold ${
                    sel ? "text-scv-violet" : "text-scv-muted"
                  }`}
                >
                  {f.label}
                  {sel ? <i className="bi bi-check2-circle" aria-hidden /> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
