// ─────────────────────────────────────────────────────────────────────────────
// /galeria — 15 anos "Glamour Rosé" = CLONE FIEL do /galeria real da Maria Clara
// (festa-15-maria-clara/app/galeria/page.tsx): cabeçalho + texto + grade+lightbox
// (componente compartilhado evt/Galeria, porte fiel). Sem moldura glam.
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { Galeria } from "@/components/evt/Galeria";
import { Flourish } from "@/components/evt/icons";

function Heading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="eyebrow text-evt-rosa-ink">{eyebrow}</p>
      <h2 className="mt-3 font-evt-script leading-[1.04] text-[clamp(4.01rem,11.2vw,5.66rem)] text-evt-ink">
        {title}
      </h2>
      <div className="mt-5 flex items-center justify-center" aria-hidden>
        <Flourish className="h-4 w-24 text-evt-rosa" />
      </div>
    </div>
  );
}

export function GaleriaQuinzeGlamour({ evento }: PaginaTemplateProps) {
  const fotos = evento.fotos ?? [];

  return (
    <main data-sec="galeria" className="bg-transparent px-[clamp(1.25rem,5vw,2rem)] pb-[clamp(5rem,10vw,8rem)] pt-32">
      <div className="mx-auto max-w-[1080px]">
        <Reveal>
          <Heading eyebrow="Galeria" title="Momentos" />
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-md text-center font-evt-body text-lg text-evt-ink-soft">
            Um pedacinho dessa história em fotos. Toque para ver de pertinho.
          </p>
        </Reveal>

        {fotos.length > 0 ? (
          <Reveal delay={200} className="mt-12">
            <Galeria fotos={fotos} nome={evento.primeiroNome} />
          </Reveal>
        ) : (
          <p className="mt-12 text-center font-evt-body text-evt-ink-soft">As fotos chegam em breve.</p>
        )}
      </div>
    </main>
  );
}
