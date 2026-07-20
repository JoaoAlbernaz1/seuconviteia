import { Reveal } from "@/components/evt/Reveal";

/**
 * Timeline — programacao da festa. Linha vertical rosa suave; cada item = horario
 * (display, sem acento -> sem tofu) + titulo (body, aceita acento PT). Porte fiel
 * do festa-15-maria-clara (so o rename `evt-` das cores + `--ev-rosa` no marcador).
 *
 * Cada item revela escalonado ao entrar na viewport (reduced-motion safe).
 */
export function Timeline({
  itens,
}: {
  itens: { hora: string; titulo: string }[];
}) {
  if (itens.length === 0) return null;

  return (
    <ol className="relative mx-auto max-w-md pl-2">
      {/* Trilho vertical rosa suave ao longo de toda a lista. */}
      <span
        className="pointer-events-none absolute bottom-2 left-[7px] top-2 w-px bg-evt-rosa/45"
        aria-hidden
      />
      {itens.map((item, i) => (
        <Reveal as="li" key={`${item.hora}-${item.titulo}`} delay={i * 90}>
          <div className="relative flex items-baseline gap-5 py-4 pl-7">
            {/* Marcador — ponto rosa sobre o trilho. */}
            <span
              className="absolute left-0 top-[0.55rem] h-[15px] w-[15px] rounded-full bg-white ring-1 ring-[var(--line)] [box-shadow:inset_0_0_0_3px_var(--ev-rosa)]"
              aria-hidden
            />
            <span className="min-w-[4.4rem] shrink-0 font-evt-display text-[clamp(1.9rem,6vw,2.4rem)] leading-none tabular-nums text-evt-rosa-ink">
              {item.hora}
            </span>
            <span className="font-evt-body text-[clamp(1.2rem,4.5vw,1.4rem)] text-evt-ink">{item.titulo}</span>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
