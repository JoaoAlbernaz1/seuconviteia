// EVENTO — 15 anos Princesa Delicado. O convite emocional por extenso + Quando/
// Onde em cartões suaves + mapa + contador + traje + programação em renda + CTA
// de confirmação. Corpo PRÓPRIO (nada de _base). Server component; o mapa e o
// contador (interativos) ficam isolados nos seus componentes client.
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { Flourish } from "@/components/evt/icons";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { MapEmbed } from "@/components/evt/MapEmbed";
import { ContagemPrincesa } from "@/components/templates/quinze-anos/princesa-delicado/Contagem";
import {
  EstiloPrincesa,
  CabecalhoPrincesa,
  CartaoSuave,
  BotaoSuave,
  Filigrana,
  PetalasFundo,
  AgendaRenda,
  QPD_PAD,
  QPD_RHYTHM,
  QPD_WRAP,
  QPD_WRAP_TXT,
} from "@/components/templates/quinze-anos/princesa-delicado/partes";

export function EventoQuinzePrincesa({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const nome = evento.primeiroNome;
  const local = evento.local ?? "O local";
  const temEmbed = !!evento.mapsEmbedUrl && /^https:\/\//i.test(evento.mapsEmbedUrl);
  const temPrograma = recursos.programacao && evento.programacao.length > 0;

  return (
    <main className="bg-transparent">
      <EstiloPrincesa />

      {/* ── O convite, por extenso ── */}
      <section className={`relative overflow-hidden bg-evt-blush-soft/45 ${QPD_PAD} pb-[clamp(4rem,9vw,7rem)] pt-32`}>
        <PetalasFundo />
        <div className={`relative ${QPD_WRAP_TXT}`}>
          <CabecalhoPrincesa eyebrow="O convite" titulo={t.conviteTitulo} />
          <Reveal delay={120}>
            <p className="drop-cap mt-10 text-left font-evt-body text-[1.24rem] leading-relaxed text-evt-ink">
              {evento.mensagemBoasVindas ?? t.mensagemPadrao}
            </p>
          </Reveal>
          <Reveal delay={200} className="mt-10 text-center">
            <p className="font-evt-script text-[clamp(2.1rem,6.5vw,3rem)] text-evt-rosa-ink">
              {t.assinaturaPrefixo} {nome}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Quando & Onde + mapa ── */}
      <section className={`bg-transparent ${QPD_PAD} ${QPD_RHYTHM}`}>
        <div className={QPD_WRAP}>
          <CabecalhoPrincesa eyebrow="A celebração" titulo="Quando & Onde" />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal className="h-full">
              <CartaoSuave className="flex h-full flex-col p-[clamp(1.75rem,5vw,2.5rem)] text-center">
                <p className="eyebrow text-evt-rosa-ink">Quando</p>
                <p className="mt-4 font-evt-script text-[clamp(1.9rem,5.5vw,2.5rem)] leading-tight text-evt-ink">
                  {evento.data}
                </p>
                <p className="mt-1 font-evt-display text-[clamp(2rem,7vw,2.7rem)] tracking-[0.05em] text-evt-rosa-ink">
                  {evento.horario}
                </p>
                <div className="mt-auto flex justify-center pt-7">
                  <BotaoSuave href="/agenda" prefetch={false}>
                    Adicionar à agenda
                  </BotaoSuave>
                </div>
              </CartaoSuave>
            </Reveal>

            <Reveal delay={110} className="h-full">
              <CartaoSuave className="flex h-full flex-col p-[clamp(1.75rem,5vw,2.5rem)] text-center">
                <p className="eyebrow text-evt-rosa-ink">Onde</p>
                <p className="mt-4 font-evt-script text-[clamp(1.9rem,5.5vw,2.5rem)] leading-tight text-evt-ink">
                  {local}
                </p>
                {evento.endereco && (
                  <p className="mt-2 font-evt-body text-[1.05rem] text-evt-ink-soft">{evento.endereco}</p>
                )}
                {evento.mapsLinkUrl && (
                  <div className="mt-auto flex justify-center pt-7">
                    <BotaoSuave href={evento.mapsLinkUrl} target="_blank" rel="noreferrer">
                      Abrir no Maps
                    </BotaoSuave>
                  </div>
                )}
              </CartaoSuave>
            </Reveal>
          </div>

          {temEmbed ? (
            <Reveal delay={150} className="mt-6">
              <MapEmbed src={evento.mapsEmbedUrl!} local={local} linkUrl={evento.mapsLinkUrl} />
            </Reveal>
          ) : (
            evento.mapsLinkUrl && (
              <Reveal delay={150} className="mt-6">
                <a
                  href={evento.mapsLinkUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir ${local} no Google Maps`}
                  className="group relative block overflow-hidden rounded-[1.5rem] border border-[var(--line)] shadow-[0_28px_64px_-50px_rgba(46,26,32,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <div className="relative flex h-[300px] w-full flex-col items-center justify-center gap-3 overflow-hidden [background:linear-gradient(155deg,var(--ev-blush-soft),var(--ev-blush))] transition-transform duration-500 group-hover:scale-[1.03] sm:h-[380px]">
                    <Flourish className="qpd-float h-5 w-28 text-evt-rosa" />
                    <span className="font-evt-util text-[0.58rem] uppercase tracking-[0.28em] text-evt-ink-soft/80">
                      Ver localização
                    </span>
                  </div>
                  <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-5 py-2 font-evt-util text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-evt-rosa-ink shadow-[0_8px_24px_-8px_rgba(46,26,32,0.4)]">
                    Abrir no Google Maps →
                  </span>
                </a>
              </Reveal>
            )
          )}
        </div>
      </section>

      {/* ── Contador ── */}
      {recursos.contador && (
        <section className={`relative overflow-hidden bg-evt-blush-soft/45 ${QPD_PAD} ${QPD_RHYTHM}`}>
          <div className={`${QPD_WRAP} flex flex-col items-center gap-9 text-center`}>
            <Reveal className="flex flex-col items-center gap-4">
              <p className="eyebrow text-evt-rosa-ink">A contagem já começou</p>
              <Flourish className="qpd-float h-4 w-24 text-evt-rosa" />
            </Reveal>
            <Reveal delay={120}>
              <ContagemPrincesa alvoISO={evento.dataAlvoISO} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Traje ── */}
      {evento.traje && (
        <section className={`bg-transparent ${QPD_PAD} py-[clamp(3.5rem,7vw,5rem)]`}>
          <Reveal className={`${QPD_WRAP} flex flex-col items-center gap-4 text-center`}>
            <p className="eyebrow text-evt-rosa-ink">Traje</p>
            <Flourish className="qpd-float h-4 w-20 text-evt-rosa" />
            <p className="font-evt-script text-[clamp(2rem,6vw,2.9rem)] text-evt-ink">{evento.traje}</p>
          </Reveal>
        </section>
      )}

      {/* ── Programação em renda ── */}
      {temPrograma && (
        <section className={`bg-evt-blush-soft/45 ${QPD_PAD} ${QPD_RHYTHM}`}>
          <div className={QPD_WRAP}>
            <CabecalhoPrincesa eyebrow="A noite" titulo="Programação" />
            <div className="mt-12">
              <AgendaRenda itens={evento.programacao} />
            </div>
          </div>
        </section>
      )}

      {/* ── Confirmar presença ── */}
      {recursos.rsvp && (
        <section className={`relative overflow-hidden bg-transparent ${QPD_PAD} py-[clamp(4.5rem,9vw,6.5rem)]`}>
          <PetalasFundo />
          <Reveal className={`relative ${QPD_WRAP} flex flex-col items-center gap-7 text-center`}>
            <Filigrana />
            <h2 className="font-evt-script text-[clamp(2.3rem,7.5vw,3.4rem)] leading-tight text-evt-rosa-ink">
              Você vem?
            </h2>
            <ConfirmCTA />
          </Reveal>
        </section>
      )}
    </main>
  );
}
