// GALERIA — 15 anos Princesa Delicado. Grade com MOLDURAS LEVES (fio-de-cabelo)
// + lightbox em tela cheia. Corpo PRÓPRIO (nada de _base). Server component; a
// grade/lightbox interativa fica isolada em GaleriaPrincesa (client). Álbum
// vazio → aviso elegante, nunca quebrado.
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { Flourish } from "@/components/evt/icons";
import { GaleriaPrincesa } from "@/components/templates/quinze-anos/princesa-delicado/GaleriaLightbox";
import {
  EstiloPrincesa,
  CabecalhoPrincesa,
  PetalasFundo,
  QPD_PAD,
  QPD_WRAP,
} from "@/components/templates/quinze-anos/princesa-delicado/partes";

export function GaleriaQuinzePrincesa({ evento }: PaginaTemplateProps) {
  const fotos = evento.fotos ?? [];

  return (
    <main className={`relative overflow-hidden bg-transparent ${QPD_PAD} pb-[clamp(5rem,10vw,8rem)] pt-32`}>
      <EstiloPrincesa />
      <PetalasFundo />
      <div className={`relative ${QPD_WRAP}`}>
        <CabecalhoPrincesa
          eyebrow="Galeria"
          titulo="Momentos"
          intro="Um pedacinho dessa história em fotos. Toque em qualquer uma para ver de pertinho."
        />

        {fotos.length > 0 ? (
          <Reveal delay={140} className="mt-12">
            <GaleriaPrincesa fotos={fotos} nome={evento.primeiroNome} />
          </Reveal>
        ) : (
          <Reveal className="mx-auto mt-16 max-w-md text-center">
            <div className="rounded-[1.9rem] border border-[var(--line)] bg-white/45 p-[6px] shadow-[0_34px_82px_-58px_rgba(46,26,32,0.42)] backdrop-blur-[2px]">
              <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-[1.5rem] border border-[var(--line-rosa)] px-8 py-16 [background:linear-gradient(160deg,var(--ev-blush-soft),var(--ev-blush))]">
                <Flourish className="qpd-float h-5 w-28 text-evt-rosa" />
                <p className="font-evt-script text-[clamp(1.8rem,6vw,2.4rem)] leading-tight text-evt-ink">
                  As fotos chegam em breve
                </p>
                <p className="font-evt-body text-[1.05rem] text-evt-ink-soft">
                  Logo, logo este cantinho vai ficar cheio de recordações.
                </p>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </main>
  );
}
