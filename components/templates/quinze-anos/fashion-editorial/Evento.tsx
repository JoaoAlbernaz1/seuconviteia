// EVENTO — 15 anos Fashion Editorial. Convite editorial + detalhes assimetricos +
// mapa + agenda + contador + traje + programacao em blocos + CTA confirmar.
// Secoes PROPRIAS (nada de _base). Server component; contador/RSVP sao client.
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { MapEmbed } from "@/components/evt/MapEmbed";
import { Flourish } from "@/components/evt/icons";
import { ContadorFashion } from "@/components/templates/quinze-anos/fashion-editorial/ContadorFashion";
import {
  QFE_PAD,
  QFE_RHYTHM,
  QFE_WRAP,
  Kicker,
  MagTitle,
  EditorialLink,
  ProgramacaoBlocos,
  QfeMotionReset,
} from "@/components/templates/quinze-anos/fashion-editorial/ui";

export function EventoQuinzeFashion({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const nome = evento.primeiroNome;
  const local = evento.local ?? "O local";
  const temEmbed = !!evento.mapsEmbedUrl && /^https:\/\//i.test(evento.mapsEmbedUrl);

  return (
    <main className="bg-transparent">
      {/* ── O CONVITE — abertura editorial (masthead + carta com capitular). ── */}
      <section className={`bg-transparent ${QFE_PAD} pb-[clamp(3rem,7vw,5rem)] pt-32`}>
        <div className={`${QFE_WRAP} grid gap-x-14 gap-y-8 lg:grid-cols-12`}>
          <Reveal className="lg:col-span-5">
            <Kicker>O convite</Kicker>
            <MagTitle size="xl" className="mt-6">
              {t.conviteTitulo}
            </MagTitle>
            <span className="mt-8 block h-px w-16 bg-evt-rosa/60" aria-hidden />
          </Reveal>
          <div className="lg:col-span-7">
            <Reveal>
              <p className="drop-cap font-evt-body text-[clamp(1.2rem,2.5vw,1.55rem)] leading-relaxed text-evt-ink">
                {evento.mensagemBoasVindas ?? t.mensagemPadrao}
              </p>
            </Reveal>
            <Reveal delay={120} className="mt-8">
              <p className="font-evt-util text-[0.6rem] uppercase tracking-[0.3em] text-evt-ink-soft">
                {t.assinaturaPrefixo}
              </p>
              <p className="mt-2 font-evt-display uppercase leading-none tracking-[0.01em] text-evt-rosa-ink text-[clamp(2rem,6vw,3.2rem)]">
                {nome}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── DETALHES — Quando / Onde em composicao ASSIMETRICA (7/5). ── */}
      <section className={`bg-evt-blush-soft/40 ${QFE_PAD} ${QFE_RHYTHM}`}>
        <div className={QFE_WRAP}>
          <Reveal>
            <Kicker index={1}>Os detalhes</Kicker>
          </Reveal>

          <div className="mt-10 grid gap-6 lg:grid-cols-12">
            {/* QUANDO */}
            <Reveal className="lg:col-span-7">
              <div className="flex h-full flex-col border border-[var(--line)] bg-evt-ivory/80 p-[clamp(1.6rem,4vw,2.5rem)]">
                <p className="font-evt-util text-[0.6rem] uppercase tracking-[0.3em] text-evt-ink-soft">
                  01 / Quando
                </p>
                <p className="mt-5 font-evt-body text-[clamp(1.3rem,3vw,1.7rem)] text-evt-ink">
                  {evento.data}
                </p>
                <p className="font-evt-display uppercase leading-none tracking-[0.02em] text-evt-rosa-ink text-[clamp(2.6rem,9vw,4.5rem)]">
                  {evento.horario}
                </p>
                <div className="mt-auto pt-8">
                  <EditorialLink href="/agenda">Adicionar à agenda</EditorialLink>
                </div>
              </div>
            </Reveal>

            {/* ONDE */}
            <Reveal delay={100} className="lg:col-span-5">
              <div className="flex h-full flex-col border border-[var(--line)] bg-evt-ivory/80 p-[clamp(1.6rem,4vw,2.5rem)]">
                <p className="font-evt-util text-[0.6rem] uppercase tracking-[0.3em] text-evt-ink-soft">
                  02 / Onde
                </p>
                <p className="mt-5 font-evt-display uppercase leading-[0.98] tracking-[0.005em] text-evt-ink text-[clamp(1.6rem,4.5vw,2.4rem)]">
                  {local}
                </p>
                {evento.endereco && (
                  <p className="mt-3 font-evt-body text-[1.08rem] leading-relaxed text-evt-ink-soft">
                    {evento.endereco}
                  </p>
                )}
                {evento.mapsLinkUrl && (
                  <div className="mt-auto pt-8">
                    <EditorialLink href={evento.mapsLinkUrl} target="_blank" rel="noreferrer">
                      Abrir no Maps
                    </EditorialLink>
                  </div>
                )}
              </div>
            </Reveal>
          </div>

          {/* MAPA — embed real, ou card-link tematizado (nunca em branco). */}
          {temEmbed ? (
            <Reveal delay={140} className="mt-6">
              <MapEmbed src={evento.mapsEmbedUrl!} local={local} linkUrl={evento.mapsLinkUrl} />
            </Reveal>
          ) : (
            evento.mapsLinkUrl && (
              <Reveal delay={140} className="mt-6">
                <a
                  href={evento.mapsLinkUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir ${local} no Google Maps`}
                  className="group relative block overflow-hidden border border-[var(--line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <div className="relative flex h-[280px] w-full flex-col items-center justify-center gap-3 [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))] transition-transform duration-500 group-hover:scale-[1.03] sm:h-[360px]">
                    <Flourish className="h-5 w-28 text-evt-rosa" />
                    <span className="font-evt-util text-[0.58rem] uppercase tracking-[0.28em] text-evt-ink-soft/80">
                      Ver localização
                    </span>
                  </div>
                  <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-evt-ivory/95 px-5 py-2 font-evt-util text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-evt-rosa-ink shadow-[0_8px_24px_-8px_rgba(46,26,32,0.4)]">
                    Abrir no Google Maps →
                  </span>
                </a>
              </Reveal>
            )
          )}
        </div>
      </section>

      {/* ── CONTADOR (se recurso). ── */}
      {recursos.contador && (
        <section className={`bg-transparent ${QFE_PAD} ${QFE_RHYTHM}`}>
          <div className={QFE_WRAP}>
            <Reveal>
              <Kicker index={2}>A contagem</Kicker>
            </Reveal>
            <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <Reveal>
                <MagTitle size="md" className="max-w-[12ch]">
                  A contagem já começou
                </MagTitle>
              </Reveal>
              <Reveal delay={120}>
                <ContadorFashion alvoISO={evento.dataAlvoISO} />
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ── TRAJE (se houver). ── */}
      {evento.traje && (
        <section className={`bg-evt-blush-soft/40 ${QFE_PAD} py-[clamp(3rem,7vw,5rem)]`}>
          <Reveal className={`${QFE_WRAP} flex flex-col items-center gap-5 text-center`}>
            <Kicker align="center">Dress code</Kicker>
            <MagTitle size="lg">{evento.traje}</MagTitle>
          </Reveal>
        </section>
      )}

      {/* ── PROGRAMACAO em blocos modernos (se recurso + itens). ── */}
      {recursos.programacao && evento.programacao.length > 0 && (
        <section className={`bg-transparent ${QFE_PAD} ${QFE_RHYTHM}`}>
          <div className={QFE_WRAP}>
            <Reveal>
              <Kicker index={3}>O roteiro da noite</Kicker>
            </Reveal>
            <div className="mt-10">
              <ProgramacaoBlocos itens={evento.programacao} />
            </div>
          </div>
        </section>
      )}

      {/* ── CTA CONFIRMAR (se recurso rsvp). ── */}
      {recursos.rsvp && (
        <section className={`bg-evt-blush-soft/40 ${QFE_PAD} py-[clamp(4.5rem,10vw,7rem)]`}>
          <Reveal className={`${QFE_WRAP} flex flex-col items-center gap-8 text-center`}>
            <Kicker align="center">Confirmação de presença</Kicker>
            <MagTitle size="xl" className="max-w-[14ch]">
              Você vem?
            </MagTitle>
            <ConfirmCTA />
          </Reveal>
        </section>
      )}

      <QfeMotionReset />
    </main>
  );
}
