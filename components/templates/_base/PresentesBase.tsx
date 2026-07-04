// Corpo BASE da pagina /presentes — fallback quando um template nao tem
// Presentes proprio. Os 9 templates trazem o SEU proprio.
import type { PaginaTemplateProps } from "@/components/templates/registro";

import { SectionHeading } from "@/components/evt/SectionHeading";
import { Reveal } from "@/components/evt/Reveal";
import { PainelPresentes } from "@/components/evt/PainelPresentes";

export function PresentesBase({ evento }: PaginaTemplateProps) {
  return (
    <main className="bg-transparent px-[clamp(1.25rem,5vw,2rem)] pb-[clamp(5rem,10vw,8rem)] pt-32">
      <div className="mx-auto max-w-[860px]">
        <Reveal>
          <SectionHeading eyebrow="Presentes" title="Sua presença é o presente" />
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-md text-center font-evt-body text-lg leading-relaxed text-evt-ink-soft">
            {evento.presentesTexto ??
              "O maior presente é ter você comemorando comigo. Mas, se quiser deixar um carinho a mais, separei algumas ideias — e a minha chave Pix também está aqui."}
          </p>
        </Reveal>

        <Reveal delay={200} className="mt-12">
          <PainelPresentes
            fotoUrl={evento.presentesFotoUrl}
            nome={evento.primeiroNome}
            itens={evento.presentes}
            pixChave={evento.pixChave}
            pixNome={evento.pixNome}
            pixQrUrl={evento.pixQrUrl}
          />
        </Reveal>
      </div>
    </main>
  );
}
