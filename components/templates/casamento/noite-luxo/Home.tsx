// HOME — Casamento · Noite Luxo (BLACK TIE, ESCURO NO SITE INTEIRO). Capa
// cinematográfica escura + corpo 100% grafite/preto com acentos DOURADOS
// (var(--ev-*), paleta "dourado"). Seções PRÓPRIAS deste template (não usa
// _base/secoes nem Card/SectionHeading compartilhados). Data-driven por
// `EventoFesta` + gate de recursos (plano ∩ toggle). Server component; partes
// interativas isoladas em client (CountdownNoite, LightboxNoite via prévia).
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { ArrowRight } from "@/components/evt/icons";
import { CapaNoiteLuxo } from "@/components/templates/casamento/noite-luxo/Capa";
import { CountdownNoite } from "@/components/templates/casamento/noite-luxo/CountdownNoite";
import {
  CNL,
  CNL_PAD,
  CNL_WRAP,
  CnlStyles,
  CnlSection,
  CnlHeading,
  CnlEyebrow,
  CnlCard,
  CnlDivider,
  CnlDressCode,
  CnlGhostLink,
  AgendaGala,
} from "@/components/templates/casamento/noite-luxo/ui";
import { CartaoQuandoOnde } from "@/components/templates/casamento/noite-luxo/QuandoOnde";

/** Card teaser escuro (Presentes / Recados). */
function TeaserCard({
  href,
  eyebrow,
  titulo,
  texto,
  children,
}: {
  href: string;
  eyebrow: string;
  titulo: string;
  texto: string;
  children?: ReactNode;
}) {
  return (
    <CnlCard className="group h-full">
      <Link
        href={href}
        className="flex h-full flex-col p-[clamp(1.75rem,5vw,2.5rem)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ev-rose)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14110C]"
      >
        {children ?? (
          <span
            className="mb-6 h-px w-12"
            style={{ background: "color-mix(in srgb, var(--ev-rosa) 60%, transparent)" }}
            aria-hidden
          />
        )}
        <CnlEyebrow>{eyebrow}</CnlEyebrow>
        <h3 className="cnl-gold mt-3 font-evt-script text-[clamp(2.1rem,6vw,2.7rem)] leading-[1.05]">
          {titulo}
        </h3>
        <p
          className="mt-4 grow font-evt-body text-[1.08rem] leading-relaxed"
          style={{ color: CNL.soft }}
        >
          {texto}
        </p>
        <span
          className="mt-6 inline-flex items-center gap-2 font-evt-util text-[0.62rem] font-medium uppercase tracking-[0.24em] transition-colors"
          style={{ color: "var(--ev-rose)" }}
        >
          Abrir
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </Link>
    </CnlCard>
  );
}

export function HomeCasamentoNoite({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const nome = evento.primeiroNome;
  const mensagem = evento.mensagemBoasVindas || t.conviteTeaser;
  const previa = evento.fotos.slice(0, 6);

  return (
    <main className="relative" style={{ background: CNL.bg, color: CNL.ink }}>
      <CnlStyles />

      {/* ── CAPA cinematográfica escura ── */}
      <CapaNoiteLuxo
        nome={nome}
        kicker={t.conviteTitulo}
        data={evento.data}
        horario={evento.horario}
        local={evento.local}
        traje={evento.traje}
        fotoUrl={evento.fotoUrl}
        fotoDesktopUrl={evento.fotoDesktopUrl}
      />

      {/* ── O CONVITE (evento de luxo) ── */}
      <CnlSection deep>
        <div className="mx-auto max-w-[720px] text-center">
          <Reveal>
            <CnlHeading eyebrow="O convite" title={t.conviteTitulo} />
          </Reveal>
          <Reveal delay={120}>
            <p
              className="mx-auto mt-10 max-w-[620px] font-evt-body text-[clamp(1.15rem,3.6vw,1.32rem)] leading-relaxed"
              style={{ color: CNL.soft }}
            >
              {mensagem}
            </p>
          </Reveal>
          <Reveal delay={200} className="mt-10 flex flex-col items-center gap-8">
            <p className="cnl-gold font-evt-script text-[clamp(2.1rem,6vw,3rem)] leading-[1.1]">
              {t.assinaturaPrefixo} {nome}
            </p>
            <CnlGhostLink href="/evento">Ler o convite e ver os detalhes</CnlGhostLink>
          </Reveal>
        </div>
      </CnlSection>

      {/* ── CONTADOR premium escuro ── */}
      {recursos.contador && (
        <CnlSection>
          <div className={`${CNL_WRAP} flex flex-col items-center gap-10 text-center`}>
            <Reveal className="flex flex-col items-center gap-5">
              <CnlEyebrow>Contagem para a noite</CnlEyebrow>
              <CnlDivider w="4rem" />
            </Reveal>
            <Reveal delay={120}>
              <CountdownNoite alvoISO={evento.dataAlvoISO} />
            </Reveal>
          </div>
        </CnlSection>
      )}

      {/* ── DATA & LOCAL em cards escuros ── */}
      <CnlSection deep>
        <div className={CNL_WRAP}>
          <Reveal>
            <CnlHeading eyebrow="A cerimônia" title="Quando & Onde" />
          </Reveal>
          <Reveal delay={120} className="mt-12">
            <CartaoQuandoOnde
              evento={evento}
              footer={<CnlGhostLink href="/evento">Ver mapa e programação</CnlGhostLink>}
            />
          </Reveal>
        </div>
      </CnlSection>

      {/* ── DRESS CODE em destaque (fallback Black tie) ── */}
      <CnlSection>
        <CnlDressCode traje={evento.traje} />
      </CnlSection>

      {/* ── PROGRAMAÇÃO — agenda de gala ── */}
      {recursos.programacao && evento.programacao.length > 0 && (
        <CnlSection deep>
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

      {/* ── TEASERS: Presentes + Recados (cards escuros) ── */}
      {(recursos.presentes || recursos.recados) && (
        <CnlSection>
          <div className={CNL_WRAP}>
            <Reveal>
              <CnlHeading eyebrow="Explore" title="O que mais te espera" />
            </Reveal>
            <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
              {recursos.presentes && (
                <Reveal className="h-full">
                  <TeaserCard
                    href="/presentes"
                    eyebrow="Presentes"
                    titulo="Sua presença é o presente"
                    texto={evento.presentesTexto || t.teaserPresentes}
                  />
                </Reveal>
              )}
              {recursos.recados && (
                <Reveal delay={100} className="h-full">
                  <TeaserCard
                    href="/recados"
                    eyebrow="Recados"
                    titulo="Deixe seu carinho"
                    texto={t.teaserRecados}
                  />
                </Reveal>
              )}
            </div>
          </div>
        </CnlSection>
      )}

      {/* ── GALERIA — prévia escura elegante ── */}
      {recursos.galeria && previa.length > 0 && (
        <CnlSection deep>
          <div className={CNL_WRAP}>
            <Reveal>
              <CnlHeading eyebrow="Galeria" title="Momentos" />
            </Reveal>
            <Reveal delay={120} className="mt-12">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {previa.map((src, i) => (
                  <Link
                    key={src}
                    href="/galeria"
                    aria-label={`Ver galeria — foto ${i + 1}`}
                    className="group relative aspect-[4/5] overflow-hidden rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ev-rose)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0906]"
                    style={{ background: "#0B0906" }}
                  >
                    <span
                      className="pointer-events-none absolute inset-0 z-10 rounded-[14px]"
                      style={{ boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--ev-rosa) 24%, transparent)" }}
                      aria-hidden
                    />
                    <Image
                      src={src}
                      alt={`${nome} — foto ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    />
                  </Link>
                ))}
              </div>
            </Reveal>
            <Reveal delay={180} className="mt-10 flex justify-center">
              <CnlGhostLink href="/galeria">Ver a galeria completa</CnlGhostLink>
            </Reveal>
          </div>
        </CnlSection>
      )}

      {/* ── RSVP — botão FORTE premium ── */}
      {recursos.rsvp && (
        <CnlSection>
          <Reveal className={`${CNL_WRAP} flex flex-col items-center gap-7 text-center`}>
            <CnlDivider w="3.5rem" />
            <p className="cnl-gold max-w-[640px] font-evt-script text-[clamp(2.1rem,6.5vw,3.1rem)] leading-[1.15]">
              {t.ctaConvite}
            </p>
            <p
              className="max-w-[440px] font-evt-body text-[1.05rem] leading-relaxed"
              style={{ color: CNL.soft }}
            >
              Confirme sua presença e faça parte dessa noite inesquecível.
            </p>
            <ConfirmCTA />
          </Reveal>
        </CnlSection>
      )}

      {/* ── FECHO ── */}
      <section
        className={`relative ${CNL_PAD} pb-[clamp(4rem,9vw,6rem)] pt-[clamp(1rem,3vw,2rem)]`}
        style={{ background: CNL.bg }}
      >
        <Reveal className={`${CNL_WRAP} flex flex-col items-center gap-6 text-center`}>
          <CnlDivider w="3rem" />
          <p className="cnl-gold max-w-[660px] font-evt-script text-[clamp(2.1rem,6.5vw,3.2rem)] leading-[1.2]">
            {t.fecho}
          </p>
        </Reveal>
      </section>
    </main>
  );
}
