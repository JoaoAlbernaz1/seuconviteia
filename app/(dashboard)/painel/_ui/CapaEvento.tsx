// Capa em miniatura de um evento (cards da home, acompanhar, telas do wizard).
// SEM banco de imagens: usa a FOTO REAL do evento quando existe; senao, o
// gradiente da paleta. O nome sai na fonte script REAL da dupla do evento
// (a pagina que usa precisa do wrapper `EVT_FONTS_CLASS`).
import { TEMAS, TEMA_PADRAO } from "@/lib/temas";
import { FONTES, FONTE_PADRAO } from "@/lib/fontes";

export function CapaEvento({
  tema,
  fontes,
  nome,
  kicker,
  fotoUrl,
  altura = 140,
  className = "",
  children,
}: {
  tema?: string | null;
  fontes?: string | null;
  nome: string;
  /** Linha pequena acima do nome (ex.: "Meus 15 anos"). */
  kicker?: string;
  fotoUrl?: string | null;
  altura?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const t = (tema && TEMAS[tema]) || TEMAS[TEMA_PADRAO];
  const dupla = (fontes && FONTES[fontes]) || FONTES[FONTE_PADRAO];
  const deep = t.vars["--ev-ink"];
  const acc = t.vars["--ev-rosa"];
  const accD = t.vars["--ev-framboesa-deep"];

  const fundo: React.CSSProperties = fotoUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(10,10,14,0.25), rgba(10,10,14,0.15) 45%, rgba(10,10,14,0.55)), url(${fotoUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center 30%",
        backgroundColor: deep,
      }
    : {
        backgroundImage: `radial-gradient(120% 90% at 50% 0%, ${acc}59, transparent 62%), linear-gradient(180deg, ${deep}, ${accD})`,
      };

  return (
    <div
      className={`relative flex w-full flex-col items-center justify-center gap-1 overflow-hidden px-3 text-center ${className}`}
      style={{ height: altura, ...fundo }}
    >
      {kicker ? (
        <span className="relative text-[8.5px] font-semibold uppercase tracking-[0.22em] text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,0.4)]">
          {kicker}
        </span>
      ) : null}
      <span
        className="relative leading-[1.1] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.5)]"
        style={{
          fontFamily: dupla.vars["--ev-font-script"],
          fontSize: Math.round((altura >= 160 ? 34 : 28) * dupla.scriptScale + 6),
          ...(dupla.caps
            ? { textTransform: "uppercase" as const, letterSpacing: "0.12em" }
            : null),
        }}
      >
        {nome}
      </span>
      {children}
    </div>
  );
}
