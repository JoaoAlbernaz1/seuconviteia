// PRESENTES — 15 anos Fashion Editorial. Texto + lista MODERNA (index numerado,
// estilo tabela de revista) + Pix (PixCard compartilhado, funcional). Secoes
// proprias; sem _base. Server component.
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { PixCard } from "@/components/evt/PixCard";
import {
  QFE_PAD,
  QFE_WRAP,
  Kicker,
  MagTitle,
  EditorialPhoto,
  QfeMotionReset,
} from "@/components/templates/quinze-anos/fashion-editorial/ui";

export function PresentesQuinzeFashion({ evento }: PaginaTemplateProps) {
  const nome = evento.primeiroNome;
  const itens = evento.presentes ?? [];
  const temPix = !!(evento.pixChave || evento.pixQrUrl);
  const intro =
    evento.presentesTexto ??
    "O maior presente é ter você comemorando comigo. Mas, se quiser deixar um carinho a mais, separei algumas ideias — e a minha chave Pix também está aqui.";

  return (
    <main className="bg-transparent px-0 pb-[clamp(4.5rem,10vw,8rem)] pt-32">
      {/* ── ABERTURA — spread editorial (intro + retrato). ── */}
      <section className={QFE_PAD}>
        <div className={`${QFE_WRAP} grid items-end gap-x-14 gap-y-8 lg:grid-cols-12`}>
          <Reveal className="lg:col-span-7">
            <Kicker>Lista de presentes</Kicker>
            <MagTitle size="xl" className="mt-6">
              Sua presença é o presente
            </MagTitle>
            <p className="mt-6 max-w-[52ch] font-evt-body text-[clamp(1.1rem,2.3vw,1.35rem)] leading-relaxed text-evt-ink-soft">
              {intro}
            </p>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-5">
            <EditorialPhoto
              src={evento.presentesFotoUrl ?? evento.fotos[0]}
              alt={`Foto de ${nome}`}
              ratio="aspect-[4/5]"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
          </Reveal>
        </div>
      </section>

      {/* ── LISTA MODERNA — cada presente como linha numerada (tabela editorial). ── */}
      {itens.length > 0 && (
        <section className={`${QFE_PAD} mt-[clamp(3rem,7vw,5rem)]`}>
          <div className={QFE_WRAP}>
            <Reveal>
              <Kicker index={1}>As ideias</Kicker>
            </Reveal>
            <ul className="mt-8 border-t border-[var(--line)]">
              {itens.map((g, i) => (
                <Reveal key={`${g.titulo}-${i}`} as="li" delay={(i % 6) * 60}>
                  <div className="flex flex-col gap-2 border-b border-[var(--line)] py-[clamp(1.2rem,3vw,1.9rem)] sm:flex-row sm:items-baseline sm:gap-8">
                    <span className="font-evt-display text-[clamp(1.4rem,3.5vw,2rem)] leading-none text-evt-rosa/60 sm:w-16 sm:shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-evt-display uppercase leading-[1.05] tracking-[0.005em] text-evt-ink text-[clamp(1.2rem,3vw,1.7rem)]">
                        {g.titulo}
                      </p>
                      {g.descricao && (
                        <p className="mt-2 max-w-[60ch] font-evt-body text-[1.05rem] leading-relaxed text-evt-ink-soft">
                          {g.descricao}
                        </p>
                      )}
                    </div>
                    {g.valorLabel && (
                      <span className="font-evt-util text-[0.72rem] uppercase tracking-[0.2em] text-evt-rosa-ink sm:shrink-0 sm:text-right">
                        {g.valorLabel}
                      </span>
                    )}
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── PIX — cartao funcional (chave copiavel + QR). ── */}
      {temPix && (
        <section className={`${QFE_PAD} mt-[clamp(3.5rem,8vw,6rem)]`}>
          <div className={`${QFE_WRAP} max-w-[820px]`}>
            <Reveal>
              <Kicker index={itens.length > 0 ? 2 : 1} align="center">
                Um carinho por Pix
              </Kicker>
            </Reveal>
            <Reveal delay={120} className="mt-10">
              <PixCard chave={evento.pixChave} nome={evento.pixNome} qrUrl={evento.pixQrUrl} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Estado vazio elegante (sem itens e sem Pix). ── */}
      {itens.length === 0 && !temPix && (
        <section className={`${QFE_PAD} mt-[clamp(3rem,7vw,5rem)]`}>
          <div className={`${QFE_WRAP} max-w-[620px] text-center`}>
            <Reveal>
              <p className="font-evt-body text-[1.15rem] leading-relaxed text-evt-ink-soft">
                A lista de presentes chega em breve. Por enquanto, o presente é você comemorar comigo.
              </p>
            </Reveal>
          </div>
        </section>
      )}

      <QfeMotionReset />
    </main>
  );
}
