// /evento — Casamento · Editorial Moderno. Corpo PROPRIO: convite como materia de
// revista (drop-cap) + Quando/Onde em grade minimalista com acoes (agenda/maps) +
// mapa (iframe https ou card-link editorial) + contador + traje + programacao em
// timeline horizontal + CTA de confirmacao. Gate por recursos; campos vazios somem.
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { MapEmbed } from "@/components/evt/MapEmbed";

import { CemCountdown } from "./Countdown";
import { CemProgramacao } from "./Programacao";
import {
  CEM_SHELL,
  CEM_BLOCK,
  CEM_BLOCK_SM,
  CEM_TOP,
  CemKicker,
  CemHeading,
  CemLink,
  CemCta,
} from "./_ui";

export function EventoCasamentoEditorial({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const local = evento.local ?? "O local";
  const temEmbed = !!evento.mapsEmbedUrl && /^https:\/\//i.test(evento.mapsEmbedUrl);
  const temProgramacao = recursos.programacao && evento.programacao.length > 0;

  return (
    <main className="bg-transparent">
      {/* ── Convite como materia de revista ── */}
      <section className={`${CEM_TOP} ${CEM_BLOCK}`}>
        <div className={CEM_SHELL}>
          <div className="grid items-start gap-[clamp(2rem,6vw,5rem)] md:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <CemKicker>O convite</CemKicker>
              <CemHeading as="h1" className="mt-6 max-w-[12ch]">
                {t.conviteTitulo}
              </CemHeading>
            </Reveal>
            <Reveal delay={140} className="md:pt-[clamp(2.5rem,7vw,5rem)]">
              <p className="drop-cap font-evt-body text-[clamp(1.16rem,1.7vw,1.42rem)] leading-relaxed text-evt-ink">
                {evento.mensagemBoasVindas ?? t.mensagemPadrao}
              </p>
              <p className="mt-9 font-evt-script text-[clamp(2rem,6vw,3rem)] leading-[1.1] text-evt-rosa-ink">
                {t.assinaturaPrefixo} {evento.primeiroNome}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Quando & Onde: grade minimalista + acoes ── */}
      <section className={CEM_BLOCK}>
        <div className={CEM_SHELL}>
          <Reveal>
            <CemKicker>Os detalhes</CemKicker>
            <CemHeading className="mt-6 max-w-[13ch]">Quando e onde</CemHeading>
          </Reveal>

          <Reveal delay={120} className="mt-[clamp(2.5rem,6vw,4rem)] grid gap-px bg-[var(--line)] sm:grid-cols-2">
            <div className="bg-evt-ivory px-[clamp(1.5rem,4vw,2.5rem)] py-[clamp(2rem,5vw,3rem)]">
              <p className="font-evt-util text-[0.62rem] font-medium uppercase tracking-[0.3em] text-evt-rosa-ink">
                Quando
              </p>
              <p className="mt-5 font-evt-body text-[clamp(1.4rem,3vw,1.9rem)] leading-tight text-evt-ink">
                {evento.data}
              </p>
              <p className="mt-1 font-evt-display uppercase tracking-[0.02em] text-evt-rosa-ink text-[clamp(1.9rem,6vw,2.8rem)]">
                {evento.horario}
              </p>
            </div>
            <div className="bg-evt-ivory px-[clamp(1.5rem,4vw,2.5rem)] py-[clamp(2rem,5vw,3rem)]">
              <p className="font-evt-util text-[0.62rem] font-medium uppercase tracking-[0.3em] text-evt-rosa-ink">
                Onde
              </p>
              <p className="mt-5 font-evt-body text-[clamp(1.4rem,3vw,1.9rem)] leading-tight text-evt-ink">
                {local}
              </p>
              {evento.endereco && (
                <p className="mt-2 font-evt-body text-[1rem] leading-snug text-evt-ink-soft">
                  {evento.endereco}
                </p>
              )}
            </div>
          </Reveal>

          <Reveal delay={180} className="mt-9 flex flex-wrap items-center gap-x-10 gap-y-5">
            <CemLink href="/agenda">Adicionar à agenda</CemLink>
            {evento.mapsLinkUrl && (
              <CemLink href={evento.mapsLinkUrl} target="_blank" rel="noreferrer">
                Abrir no Google Maps
              </CemLink>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── Mapa (iframe https, senao card-link editorial) ── */}
      {temEmbed ? (
        <section className={CEM_BLOCK_SM}>
          <div className={CEM_SHELL}>
            <Reveal>
              <div className="overflow-hidden ring-1 ring-inset ring-[var(--line)]">
                <MapEmbed src={evento.mapsEmbedUrl!} local={local} linkUrl={evento.mapsLinkUrl} />
              </div>
            </Reveal>
          </div>
        </section>
      ) : (
        evento.mapsLinkUrl && (
          <section className={CEM_BLOCK_SM}>
            <div className={CEM_SHELL}>
              <Reveal>
                <a
                  href={evento.mapsLinkUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir ${local} no Google Maps`}
                  className="group relative flex h-[clamp(220px,40vw,340px)] items-center justify-center overflow-hidden ring-1 ring-inset ring-[var(--line)] [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))] transition-shadow duration-300 hover:ring-[var(--line-rosa)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink"
                >
                  <span className="flex flex-col items-center gap-4 text-center">
                    <span className="font-evt-display uppercase leading-none text-evt-ink text-[clamp(1.6rem,5vw,2.6rem)]">
                      {local}
                    </span>
                    <span className="inline-flex items-center gap-2 font-evt-util text-[0.64rem] font-medium uppercase tracking-[0.26em] text-evt-rosa-ink">
                      Ver no mapa
                      <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
                  </span>
                </a>
              </Reveal>
            </div>
          </section>
        )
      )}

      {/* ── Contador ── */}
      {recursos.contador && (
        <section className={CEM_BLOCK}>
          <div className={CEM_SHELL}>
            <Reveal className="grid items-end gap-[clamp(2rem,5vw,3.5rem)] md:grid-cols-[0.72fr_1.28fr]">
              <div>
                <CemKicker>A contagem</CemKicker>
                <CemHeading className="mt-6 max-w-[10ch]">Falta pouco</CemHeading>
              </div>
              <CemCountdown alvoISO={evento.dataAlvoISO} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Traje ── */}
      {evento.traje && (
        <section className={CEM_BLOCK_SM}>
          <div className={CEM_SHELL}>
            <Reveal className="flex flex-col gap-3 border-t border-evt-ink/20 pt-[clamp(1.75rem,4vw,2.5rem)] sm:flex-row sm:items-baseline sm:justify-between sm:gap-10">
              <p className="font-evt-util text-[0.62rem] font-medium uppercase tracking-[0.36em] text-evt-rosa-ink">
                Traje
              </p>
              <p className="font-evt-display uppercase leading-none text-evt-ink text-[clamp(1.8rem,5vw,3rem)] sm:text-right">
                {evento.traje}
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Programacao em timeline horizontal ── */}
      {temProgramacao && (
        <section className={CEM_BLOCK}>
          <div className={CEM_SHELL}>
            <Reveal>
              <CemKicker>A noite</CemKicker>
              <CemHeading className="mt-6">Programação</CemHeading>
            </Reveal>
            <Reveal delay={120} className="mt-[clamp(2.5rem,6vw,4rem)]">
              <CemProgramacao itens={evento.programacao} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── CTA de confirmacao ── */}
      {recursos.rsvp && (
        <section className={`${CEM_BLOCK} pt-0`}>
          <div className={CEM_SHELL}>
            <Reveal className="border-t border-evt-ink/20 pt-[clamp(2.5rem,6vw,4rem)] text-center">
              <p className="mx-auto max-w-[16ch] font-evt-display uppercase leading-[0.98] text-evt-ink text-[clamp(2rem,6vw,3.4rem)]">
                {t.ctaConvite}
              </p>
              <div className="mt-9 flex justify-center">
                <CemCta href="/confirmar">Confirmar presença</CemCta>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </main>
  );
}
