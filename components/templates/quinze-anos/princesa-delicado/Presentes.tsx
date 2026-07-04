// PRESENTES — 15 anos Princesa Delicado. Texto de carinho + retrato oval + lista
// de presentes em cartões suaves + Pix. Corpo PRÓPRIO (nada de _base). Server
// component; só o PixCard (copiar chave) é client. Sem lista e sem Pix → recado
// gentil, nunca vazio-feio.
import Image from "next/image";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { Flourish } from "@/components/evt/icons";
import { PixCard } from "@/components/evt/PixCard";
import {
  EstiloPrincesa,
  CabecalhoPrincesa,
  CartaoSuave,
  Filigrana,
  PetalasFundo,
  MolduraOval,
  QPD_PAD,
  QPD_WRAP,
} from "@/components/templates/quinze-anos/princesa-delicado/partes";

export function PresentesQuinzePrincesa({ evento }: PaginaTemplateProps) {
  const nome = evento.primeiroNome;
  const temPix = !!(evento.pixChave || evento.pixQrUrl || evento.pixNome);
  const temLista = evento.presentes.length > 0;
  const introTexto =
    evento.presentesTexto ??
    "O maior presente é ter você comemorando comigo. Mas, se quiser deixar um carinho a mais, separei algumas ideias — e a minha chave Pix também está aqui.";

  return (
    <main className={`relative overflow-hidden bg-transparent ${QPD_PAD} pb-[clamp(5rem,10vw,8rem)] pt-32`}>
      <EstiloPrincesa />
      <PetalasFundo />
      <div className={`relative ${QPD_WRAP}`}>
        <CabecalhoPrincesa eyebrow="Presentes" titulo="Sua presença é o presente" />

        {/* Texto + retrato oval */}
        <div className="mx-auto mt-12 flex max-w-[880px] flex-col items-center gap-10 md:flex-row md:items-center md:justify-center md:gap-14">
          {evento.presentesFotoUrl && (
            <Reveal className="shrink-0">
              <MolduraOval className="w-[clamp(11rem,42vw,14rem)]">
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={evento.presentesFotoUrl}
                    alt={`Foto de ${nome}`}
                    fill
                    sizes="(max-width: 768px) 42vw, 14rem"
                    className="object-cover"
                  />
                </div>
              </MolduraOval>
            </Reveal>
          )}
          <Reveal delay={100} className="max-w-md text-center md:text-left">
            <p className="font-evt-body text-[1.18rem] leading-relaxed text-evt-ink-soft">
              {introTexto}
            </p>
          </Reveal>
        </div>

        {/* Lista de presentes em cartões suaves */}
        {temLista && (
          <div className="mt-16">
            <Reveal className="flex flex-col items-center gap-3 text-center">
              <p className="eyebrow text-evt-rosa-ink">Algumas ideias</p>
              <Flourish className="qpd-float h-4 w-20 text-evt-rosa" />
            </Reveal>
            <div className="mx-auto mt-9 grid max-w-[900px] gap-5 sm:grid-cols-2">
              {evento.presentes.map((item, i) => (
                <Reveal key={`${item.titulo}-${i}`} delay={(i % 2) * 90}>
                  <CartaoSuave className="flex h-full flex-col gap-2 p-[clamp(1.4rem,4vw,1.9rem)]" glow={false}>
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-evt-script text-[clamp(1.7rem,4.5vw,2.15rem)] leading-tight text-evt-ink">
                        {item.titulo}
                      </h3>
                      {item.valorLabel && (
                        <span className="shrink-0 font-evt-display text-[1.15rem] tracking-[0.03em] text-evt-rosa-ink">
                          {item.valorLabel}
                        </span>
                      )}
                    </div>
                    {item.descricao && (
                      <p className="font-evt-body text-[1.02rem] leading-relaxed text-evt-ink-soft">
                        {item.descricao}
                      </p>
                    )}
                  </CartaoSuave>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* Pix */}
        {temPix && (
          <div className="mt-16">
            <Reveal className="flex flex-col items-center gap-4 text-center">
              <Filigrana />
              <p className="font-evt-script text-[clamp(2rem,6vw,2.8rem)] leading-tight text-evt-rosa-ink">
                Um carinho a mais
              </p>
              <p className="max-w-md font-evt-body text-[1.05rem] text-evt-ink-soft">
                Se preferir, você pode enviar pelo Pix — é rápido e chega direitinho.
              </p>
            </Reveal>
            <Reveal delay={120} className="mt-9">
              <PixCard chave={evento.pixChave} nome={evento.pixNome} qrUrl={evento.pixQrUrl} />
            </Reveal>
          </div>
        )}

        {/* Nada configurado — recado gentil */}
        {!temLista && !temPix && (
          <Reveal className="mx-auto mt-12 max-w-md text-center">
            <Flourish className="qpd-float mx-auto h-5 w-24 text-evt-rosa" />
            <p className="mt-6 font-evt-body text-[1.1rem] leading-relaxed text-evt-ink-soft">
              Sua presença já é o presente mais lindo. Vai ser uma alegria imensa
              ter você comigo nesse dia.
            </p>
          </Reveal>
        )}
      </div>
    </main>
  );
}
