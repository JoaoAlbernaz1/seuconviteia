// /evento — Casamento · Noite Luxo (ESCURO NO SITE INTEIRO). Convite de luxo +
// Quando/Onde em cards escuros + mapa (iframe emoldurado escuro, ou card-link
// escuro) + agenda + dress code + contador + programação (agenda de gala) + CTA
// confirmar. Seções PRÓPRIAS deste template (nada de _base). Data-driven + gate.
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { CountdownNoite } from "@/components/templates/casamento/noite-luxo/CountdownNoite";
import { MapaNoite } from "@/components/templates/casamento/noite-luxo/MapaNoite";
import { CartaoQuandoOnde } from "@/components/templates/casamento/noite-luxo/QuandoOnde";
import {
  CNL,
  CNL_PAD,
  CNL_WRAP,
  CnlStyles,
  CnlSection,
  CnlHeading,
  CnlEyebrow,
  CnlDivider,
  CnlDressCode,
  CnlGhostLink,
  AgendaGala,
} from "@/components/templates/casamento/noite-luxo/ui";

export function EventoCasamentoNoite({ evento, nicho, recursos }: PaginaTemplateProps) {
  const nome = evento.primeiroNome;
  const t = textosDoNicho(nicho);
  const local = evento.local ?? "O local";
  const temEmbed = !!evento.mapsEmbedUrl && /^https:\/\//i.test(evento.mapsEmbedUrl);

  return (
    <main className="relative" style={{ background: CNL.bg, color: CNL.ink }}>
      <CnlStyles />

      {/* ── O CONVITE (luxo) ── */}
      <section
        className={`relative ${CNL_PAD} pb-[clamp(4.5rem,10vw,7rem)] pt-32`}
        style={{ background: CNL.bgDeep }}
      >
        <div className="mx-auto max-w-[720px] text-center">
          <Reveal>
            <CnlHeading eyebrow="O convite" title={t.conviteTitulo} />
          </Reveal>
          <Reveal delay={120}>
            <p
              className="mx-auto mt-10 max-w-[620px] font-evt-body text-[clamp(1.15rem,3.6vw,1.32rem)] leading-relaxed"
              style={{ color: CNL.soft }}
            >
              {evento.mensagemBoasVindas ?? t.mensagemPadrao}
            </p>
          </Reveal>
          <Reveal delay={200}>
            <p className="cnl-gold mt-10 font-evt-script text-[clamp(2.1rem,6vw,3rem)] leading-[1.1]">
              {t.assinaturaPrefixo} {nome}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── QUANDO & ONDE + MAPA ── */}
      <CnlSection>
        <div className={CNL_WRAP}>
          <Reveal>
            <CartaoQuandoOnde
              evento={evento}
              footer={
                <>
                  <CnlGhostLink href="/agenda" prefetch={false}>
                    Adicionar à agenda
                  </CnlGhostLink>
                  {evento.mapsLinkUrl && (
                    <CnlGhostLink href={evento.mapsLinkUrl} target="_blank" rel="noreferrer">
                      Abrir no Maps
                    </CnlGhostLink>
                  )}
                </>
              }
            />
          </Reveal>

          {temEmbed ? (
            <Reveal delay={140} className="mx-auto mt-6 max-w-[860px]">
              <MapaNoite src={evento.mapsEmbedUrl!} local={local} linkUrl={evento.mapsLinkUrl} />
            </Reveal>
          ) : (
            evento.mapsLinkUrl && (
              <Reveal delay={140} className="mx-auto mt-6 max-w-[860px]">
                <a
                  href={evento.mapsLinkUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir ${local} no Google Maps`}
                  className="group relative block overflow-hidden rounded-[16px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ev-rose)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110C]"
                  style={{
                    border: "1px solid color-mix(in srgb, var(--ev-rosa) 30%, transparent)",
                    boxShadow: "0 40px 90px -60px rgba(0,0,0,0.95)",
                  }}
                >
                  <div
                    className="relative flex h-[300px] w-full flex-col items-center justify-center gap-4 overflow-hidden transition-transform duration-500 group-hover:scale-[1.03] sm:h-[380px]"
                    style={{
                      background:
                        "radial-gradient(120% 90% at 50% 30%, color-mix(in srgb, var(--ev-rosa) 14%, transparent), transparent 62%), #14110C",
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="currentColor" style={{ color: "var(--ev-rosa)" }}>
                      <path d="M12 2a7 7 0 0 0-7 7c0 4.6 6.1 12.2 6.4 12.5a.8.8 0 0 0 1.2 0C13 21.2 19 13.6 19 9a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
                    </svg>
                    <span className="font-evt-util text-[0.6rem] uppercase tracking-[0.28em]" style={{ color: CNL.mute }}>
                      Ver localização
                    </span>
                  </div>
                  <span
                    className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-5 py-2 font-evt-util text-[0.68rem] font-semibold uppercase tracking-[0.2em]"
                    style={{
                      background: "rgba(11,9,6,0.82)",
                      color: "var(--ev-rose)",
                      border: "1px solid color-mix(in srgb, var(--ev-rosa) 45%, transparent)",
                    }}
                  >
                    Abrir no Google Maps →
                  </span>
                </a>
              </Reveal>
            )
          )}

          {recursos.contador && (
            <Reveal delay={180} className="mt-16 flex flex-col items-center gap-8 text-center">
              <div className="flex flex-col items-center gap-5">
                <CnlEyebrow>A contagem já começou</CnlEyebrow>
                <CnlDivider w="4rem" />
              </div>
              <CountdownNoite alvoISO={evento.dataAlvoISO} />
            </Reveal>
          )}
        </div>
      </CnlSection>

      {/* ── DRESS CODE em destaque ── */}
      <CnlSection deep>
        <CnlDressCode traje={evento.traje} />
      </CnlSection>

      {/* ── PROGRAMAÇÃO — agenda de gala ── */}
      {recursos.programacao && evento.programacao.length > 0 && (
        <CnlSection>
          <div className={CNL_WRAP}>
            <Reveal>
              <CnlHeading eyebrow="A noite" title="Programação" />
            </Reveal>
            <Reveal delay={120} className="mt-14">
              <AgendaGala itens={evento.programacao} />
            </Reveal>
          </div>
        </CnlSection>
      )}

      {/* ── CTA confirmar ── */}
      {recursos.rsvp && (
        <CnlSection deep>
          <Reveal className={`${CNL_WRAP} flex flex-col items-center gap-7 text-center`}>
            <CnlDivider w="3.5rem" />
            <h2 className="cnl-gold font-evt-script text-[clamp(2.2rem,7vw,3.3rem)] leading-tight">
              Você vem?
            </h2>
            <p className="max-w-[440px] font-evt-body text-[1.05rem] leading-relaxed" style={{ color: CNL.soft }}>
              Será uma honra ter você conosco nesta noite de gala.
            </p>
            <ConfirmCTA />
          </Reveal>
        </CnlSection>
      )}
    </main>
  );
}
