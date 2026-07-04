// /galeria — Casamento · Editorial Moderno. Corpo PROPRIO: cabecalho editorial +
// mosaico de revista (CemGaleria: colunas de alturas variadas + lightbox). Vazio
// -> estado elegante (nao um buraco). Data-driven por `EventoFesta`.
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";

import { CemGaleria } from "./GaleriaGrid";
import { CEM_SHELL, CEM_TOP, CEM_BLOCK, CemKicker, CemHeading, CemPhoto } from "./_ui";

export function GaleriaCasamentoEditorial({ evento }: PaginaTemplateProps) {
  const fotos = evento.fotos ?? [];

  return (
    <main className={`bg-transparent ${CEM_TOP} ${CEM_BLOCK}`}>
      <div className={CEM_SHELL}>
        <Reveal>
          <div className="grid items-end gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <CemKicker>Galeria</CemKicker>
              <CemHeading as="h1" className="mt-6">Momentos</CemHeading>
            </div>
            <p className="max-w-[32ch] font-evt-body text-[1.06rem] leading-relaxed text-evt-ink-soft md:text-right">
              Um recorte dessa história em imagens. Toque para ver de pertinho.
            </p>
          </div>
        </Reveal>

        {fotos.length > 0 ? (
          <Reveal delay={120} className="mt-[clamp(2.5rem,6vw,4rem)]">
            <CemGaleria fotos={fotos} nome={evento.primeiroNome} />
          </Reveal>
        ) : (
          <Reveal delay={120} className="mt-[clamp(2.5rem,6vw,4rem)]">
            <div className="grid gap-[clamp(0.6rem,1.6vw,1rem)] sm:grid-cols-3">
              <CemPhoto src={undefined} alt="Em breve" ratio="aspect-[3/4]" />
              <CemPhoto src={undefined} alt="Em breve" ratio="aspect-[3/4]" className="sm:mt-[clamp(1.5rem,5vw,3rem)]" />
              <CemPhoto src={undefined} alt="Em breve" ratio="aspect-[3/4]" />
            </div>
            <p className="mt-10 max-w-[42ch] font-evt-body text-[1.1rem] italic leading-relaxed text-evt-ink-soft">
              As fotos chegam em breve. Volte mais perto da data para reviver os
              melhores momentos.
            </p>
          </Reveal>
        )}
      </div>
    </main>
  );
}
