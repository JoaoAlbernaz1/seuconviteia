// Stepper do assistente (Ocasião → Estilo → Detalhes → Publicar), fiel ao
// mockup DARK: bolinha (✓/nº) + rótulo + conector; passo feito é clicável.
import Link from "next/link";

export type PassoStepper = {
  label: string;
  estado: "feito" | "atual" | "pendente";
  /** Navegação ao clicar num passo feito (href OU onClick — um dos dois). */
  href?: string;
  onClick?: () => void;
};

function Bolinha({ p, n }: { p: PassoStepper; n: number }) {
  const cls =
    p.estado === "feito"
      ? "bg-teal text-white"
      : p.estado === "atual"
        ? "bg-violeta text-white shadow-[0_0_0_4px_rgba(122,64,237,0.16)]"
        : "bg-scv-line text-scv-faint";
  return (
    <span
      className={`grid size-[30px] shrink-0 place-items-center rounded-full text-[12.5px] font-bold ${cls}`}
    >
      {p.estado === "feito" ? <i className="bi bi-check-lg" aria-hidden /> : n}
    </span>
  );
}

export function Stepper({ passos }: { passos: PassoStepper[] }) {
  return (
    <div className="flex flex-1 flex-wrap items-center justify-center gap-2.5">
      {passos.map((p, i) => {
        const rotulo = (
          <span
            className={`text-[13px] font-semibold ${
              p.estado === "atual"
                ? "text-scv-ink"
                : p.estado === "feito"
                  ? "text-teal"
                  : "text-scv-faint"
            }`}
          >
            {p.label}
          </span>
        );
        const miolo = (
          <span className="flex items-center gap-2.5">
            <Bolinha p={p} n={i + 1} />
            <span className="hidden sm:inline">{rotulo}</span>
          </span>
        );
        return (
          <span key={p.label} className="flex items-center gap-2.5">
            {p.estado === "feito" && p.href ? (
              <Link href={p.href}>{miolo}</Link>
            ) : p.estado === "feito" && p.onClick ? (
              <button type="button" onClick={p.onClick}>
                {miolo}
              </button>
            ) : (
              miolo
            )}
            {i < passos.length - 1 ? (
              <span
                aria-hidden
                className={`h-[1.5px] w-6 rounded sm:w-8 ${
                  p.estado === "feito" ? "bg-teal" : "bg-scv-line"
                }`}
              />
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
