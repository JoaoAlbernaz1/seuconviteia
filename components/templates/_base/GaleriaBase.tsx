// Corpo BASE da pagina /galeria — fallback quando um template nao tem Galeria
// propria. Os 9 templates trazem a SUA propria.
import type { PaginaTemplateProps } from "@/components/templates/registro";

import { SectionHeading } from "@/components/evt/SectionHeading";
import { Reveal } from "@/components/evt/Reveal";
import { Galeria } from "@/components/evt/Galeria";

export function GaleriaBase({ evento }: PaginaTemplateProps) {
  const fotos = evento.fotos ?? [];
  return (
    <main className="bg-transparent px-[clamp(1.25rem,5vw,2rem)] pb-[clamp(5rem,10vw,8rem)] pt-32">
      <div className="mx-auto max-w-[1080px]">
        <Reveal>
          <SectionHeading eyebrow="Galeria" title="Momentos" />
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
