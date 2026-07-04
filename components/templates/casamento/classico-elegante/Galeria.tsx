// GALERIA — Casamento · Clássico Elegante. Cabeçalho ornamental + grade em molduras
// suaves com lightbox (GaleriaClassica, própria). Vazio → mensagem elegante.
// Corpo PRÓPRIO. Server component (o grid/lightbox interativo é client separado).
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { Flourish } from "@/components/evt/icons";
import { GaleriaClassica } from "@/components/templates/casamento/classico-elegante/GaleriaClassica";
import {
  CceEstilo,
  Medalhao,
  TituloSecao,
  CCE_PAD,
} from "@/components/templates/casamento/classico-elegante/sections";

export function GaleriaCasamentoClassico({ evento }: PaginaTemplateProps) {
  const fotos = evento.fotos ?? [];
  const nome = evento.primeiroNome;
  const inicial = nome.trim().charAt(0).toUpperCase() || "❦";

  return (
    <main className={`bg-transparent ${CCE_PAD} pb-[clamp(5rem,10vw,8rem)] pt-32`}>
      <CceEstilo />
      <div className="mx-auto max-w-[1120px]">
        <Reveal className="flex flex-col items-center">
          <Medalhao inicial={inicial} />
          <div className="mt-7">
            <TituloSecao eyebrow="Recordações" titulo="Nossa galeria" />
          </div>
          <p className="mt-6 max-w-[460px] text-center font-evt-body text-[1.12rem] leading-relaxed text-evt-ink-soft">
            Um pedacinho dessa história em fotos. Toque para ver de pertinho.
          </p>
        </Reveal>

        {fotos.length > 0 ? (
          <Reveal delay={160} className="mt-14">
            <GaleriaClassica fotos={fotos} nome={nome} />
          </Reveal>
        ) : (
          <Reveal delay={140} className="mt-16 flex flex-col items-center gap-4 text-center">
            <Flourish className="h-4 w-28 text-evt-rosa" />
            <p className="max-w-[440px] font-evt-body text-[1.12rem] leading-relaxed text-evt-ink-soft">
              As fotos chegam em breve. Volte para reviver esse dia com a gente.
            </p>
          </Reveal>
        )}
      </div>
    </main>
  );
}
