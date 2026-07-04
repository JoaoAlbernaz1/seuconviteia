// Programacao do template Editorial Moderno — TIMELINE HORIZONTAL de blocos.
// Cada bloco = indice (01/02...) + horario display grande + titulo, unidos por
// um filete continuo no topo (a "linha do tempo"). No mobile vira scroll
// horizontal com snap; no desktop os blocos se distribuem numa faixa. Server
// component; cada bloco revela escalonado com <Reveal> (reduced-motion safe).
import { Reveal } from "@/components/evt/Reveal";
import type { ProgramacaoItem } from "@/lib/convite";
import { CEM_GUTTER_NEG, CEM_GUTTER_PAD } from "./_ui";

export function CemProgramacao({ itens }: { itens: ProgramacaoItem[] }) {
  if (itens.length === 0) return null;

  return (
    <div
      className={`cem-hscroll flex snap-x snap-mandatory overflow-x-auto pb-2 ${CEM_GUTTER_NEG} ${CEM_GUTTER_PAD} sm:mx-0 sm:px-0`}
    >
      {itens.map((item, i) => (
        <Reveal
          key={`${item.hora}-${item.titulo}-${i}`}
          delay={i * 90}
          className="snap-start shrink-0 basis-[74%] pr-[clamp(1.5rem,4vw,2.5rem)] sm:basis-[46%] lg:basis-0 lg:grow"
        >
          <article className="border-t border-evt-ink/25 pt-[clamp(1.25rem,3vw,1.75rem)]">
            <span className="font-evt-util text-[0.6rem] font-medium uppercase tracking-[0.32em] text-evt-rosa-ink">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="mt-[clamp(1.5rem,4vw,2.5rem)] font-evt-display leading-[0.9] tabular-nums text-evt-ink text-[clamp(2rem,5vw,2.9rem)]">
              {item.hora}
            </p>
            <p className="mt-3 font-evt-body text-[1.08rem] leading-snug text-evt-ink-soft">
              {item.titulo}
            </p>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
