// ─────────────────────────────────────────────────────────────────────────────
// /galeria — 15 anos "Glamour Rosé". CORPO PRÓPRIO.
// ─────────────────────────────────────────────────────────────────────────────
// Cabeçalho glam + grade em destaque com lightbox (Galeria compartilhada é só a
// LÓGICA do lightbox/teclado/swipe). Estado vazio elegante.
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { Galeria } from "@/components/evt/Galeria";
import { QgrStyle, QgrHeading, QgrSparkleTrio } from "./glam";

const PAD = "px-[clamp(1.25rem,5vw,2rem)]";
const WRAP = "mx-auto max-w-[1100px]";

export function GaleriaQuinzeGlamour({ evento }: PaginaTemplateProps) {
  const fotos = evento.fotos ?? [];

  return (
    <main className={`bg-transparent ${PAD} pb-[clamp(5rem,10vw,8rem)] pt-32`}>
      <QgrStyle />

      <div className={WRAP}>
        <Reveal>
          <QgrHeading eyebrow="Galeria" titulo="Momentos" />
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-7 max-w-[520px] text-center font-evt-body text-[1.12rem] leading-relaxed text-evt-ink-soft">
            Um pedacinho dessa história, com todo o brilho. Toque em qualquer foto para ver de pertinho.
          </p>
        </Reveal>

        {fotos.length > 0 ? (
          <Reveal delay={200} className="mt-12">
            {/* Moldura foil por trás da grade (destaque glam). */}
            <div className="qgr-frame rounded-[calc(1.6rem+3px)] p-[3px]">
              <div className="qgr-glass rounded-[1.6rem] p-[clamp(0.75rem,3vw,1.4rem)]">
                <Galeria fotos={fotos} nome={evento.primeiroNome} />
              </div>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={200} className="mt-16 flex flex-col items-center gap-6 text-center">
            <QgrSparkleTrio />
            <p className="max-w-[520px] font-evt-script text-[clamp(2rem,6vw,2.8rem)] leading-tight text-evt-rosa-ink">
              As fotos chegam em breve — com todo o glamour.
            </p>
            <p className="font-evt-body text-[1.05rem] text-evt-ink-soft">
              Volte logo para reviver cada instante dessa noite.
            </p>
          </Reveal>
        )}
      </div>
    </main>
  );
}
