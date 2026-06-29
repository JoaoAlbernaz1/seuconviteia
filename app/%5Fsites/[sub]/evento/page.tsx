// Pagina /evento do site publico (servida por subdominio). Porte fiel do
// festa-15-maria-clara (`app/evento/page.tsx`): convite -> Quando/Onde -> Mapa ->
// Contagem -> Traje -> Programacao -> CTA. Data-driven via `lerEventoFesta`; o
// chrome (atmosfera/nav/rodape) e o tema ficam no layout aninhado.
//
// DESVIO documentado (mapa): o festa usava um PNG estatico proprio
// (`/mapa-esplendor.png`), inviavel por tenant. Aqui, se `customization.mapsEmbedUrl`
// existir, renderiza um <iframe> do Google Maps (mesma moldura/animacao do card
// do festa); senao, cai para um card-link apontando p/ `mapsLinkUrl` (ou some).
import SiteIndisponivel from "@/components/SiteIndisponivel";
import { eventoPublico } from "@/lib/event";
import { carregarEventoFesta, lerEventoFesta } from "@/lib/eventoFesta";

import { SectionHeading } from "@/components/evt/SectionHeading";
import { Button } from "@/components/evt/Button";
import { Card } from "@/components/evt/Card";
import { Reveal } from "@/components/evt/Reveal";
import { Timeline } from "@/components/evt/Timeline";
import { Countdown } from "@/components/evt/Countdown";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { Flourish } from "@/components/evt/icons";

// Sempre dinamico: depende do banco e do subdominio da requisicao.
export const dynamic = "force-dynamic";

const PAD = "px-[clamp(1.25rem,5vw,2rem)]";
const RHYTHM = "py-[clamp(4rem,9vw,7rem)]";
const WRAP = "mx-auto max-w-[1100px]";

export default async function EventoPage({
  params,
}: {
  params: Promise<{ sub: string }>;
}) {
  const { sub } = await params;
  const event = await carregarEventoFesta(sub);

  const visivel = eventoPublico(event, new Date());
  if (!visivel.ok || !event) {
    return <SiteIndisponivel motivo={visivel.motivo ?? "inexistente"} />;
  }

  const evento = lerEventoFesta(event);
  const nome = evento.primeiroNome;
  const local = evento.local ?? "O local";
  const temEmbed = !!evento.mapsEmbedUrl && /^https:\/\//i.test(evento.mapsEmbedUrl);

  return (
    <main className="bg-transparent">
      {/* ═══ TOPO — cabeçalho da página + convite (claro) ═══ */}
      <section className={`bg-evt-blush-soft/55 ${PAD} pb-[clamp(4rem,9vw,7rem)] pt-32`}>
        <div className="mx-auto max-w-[680px] text-center">
          <Reveal>
            <SectionHeading eyebrow="O convite" title="Vem comemorar comigo" />
          </Reveal>
          <Reveal delay={120}>
            <p className="drop-cap mt-10 text-left font-evt-body text-[1.2rem] leading-relaxed text-evt-ink">
              {evento.mensagemBoasVindas ??
                "Há quinze anos, o sonho mais bonito da nossa vida chegou em forma de menina. Hoje esse sonho floresce — e não existe celebração completa sem as pessoas que fizeram parte dessa história. Será uma alegria imensa ter você ao meu lado nesta noite, para rir, dançar e guardar para sempre a lembrança dos meus 15 anos."}
            </p>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-8 font-evt-script text-[clamp(2rem,6vw,2.8rem)] text-evt-rosa-ink">Com carinho, {nome}</p>
          </Reveal>
        </div>
      </section>

      {/* ═══ QUANDO · ONDE ═══ */}
      <section className={`${PAD} ${RHYTHM}`}>
        <div className={`grid gap-6 md:grid-cols-2 ${WRAP}`}>
          {/* Quando */}
          <Reveal className="h-full">
            <Card className="flex h-full flex-col p-[clamp(1.75rem,5vw,2.5rem)] text-center md:text-left">
              <p className="eyebrow text-evt-rosa-ink">Quando</p>
              <p className="mt-4 font-evt-script text-[clamp(1.9rem,5vw,2.4rem)] leading-tight text-evt-ink">
                {evento.data}
              </p>
              <p className="mt-1 font-evt-display text-[clamp(1.8rem,6vw,2.4rem)] tracking-[0.04em] text-evt-rosa-ink">
                {evento.horario}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row md:items-start">
                <Button href="/api/agenda.ics" variant="ghost" prefetch={false}>
                  Adicionar à agenda
                </Button>
              </div>
            </Card>
          </Reveal>

          {/* Onde */}
          <Reveal delay={100} className="h-full">
            <Card className="flex h-full flex-col p-[clamp(1.75rem,5vw,2.5rem)] text-center md:text-left">
              <p className="eyebrow text-evt-rosa-ink">Onde</p>
              <p className="mt-4 font-evt-script text-[clamp(1.9rem,5vw,2.4rem)] leading-tight text-evt-ink">
                {local}
              </p>
              {evento.endereco && (
                <p className="mt-2 font-evt-body text-base text-evt-ink-soft">{evento.endereco}</p>
              )}
              {evento.mapsLinkUrl && (
                <div className="mt-7 flex justify-center md:justify-start">
                  <Button
                    href={evento.mapsLinkUrl}
                    variant="ghost"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir no Maps
                  </Button>
                </div>
              )}
            </Card>
          </Reveal>
        </div>

        {/* Mapa — iframe do Google Maps (se houver embed); senão, card-link com a
            pílula. DESVIO documentado vs. festa (que usava PNG estático próprio). */}
        {temEmbed ? (
          <Reveal delay={140} className={`mt-6 ${WRAP}`}>
            <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] shadow-[0_22px_50px_-40px_rgba(46,26,32,0.35)]">
              <iframe
                src={evento.mapsEmbedUrl}
                title={`Mapa — ${local}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="block h-[300px] w-full border-0 sm:h-[380px]"
              />
              {evento.mapsLinkUrl && (
                <a
                  href={evento.mapsLinkUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir ${local} no Google Maps`}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/95 px-5 py-2 font-evt-util text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-evt-rosa-ink shadow-[0_8px_24px_-8px_rgba(46,26,32,0.4)] transition-colors hover:text-evt-framboesa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  Abrir no Google Maps →
                </a>
              )}
            </div>
          </Reveal>
        ) : (
          evento.mapsLinkUrl && (
            <Reveal delay={140} className={`mt-6 ${WRAP}`}>
              <a
                href={evento.mapsLinkUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Abrir ${local} no Google Maps`}
                className="group relative block overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] shadow-[0_22px_50px_-40px_rgba(46,26,32,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <div className="relative flex h-[300px] w-full flex-col items-center justify-center gap-3 overflow-hidden [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))] transition-transform duration-500 group-hover:scale-[1.03] sm:h-[380px]">
                  <Flourish className="h-5 w-28 text-evt-rosa" />
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

        {/* ═══ CONTAGEM REGRESSIVA ═══ */}
        <Reveal delay={180} className={`mt-14 flex flex-col items-center gap-7 text-center ${WRAP}`}>
          <p className="eyebrow text-evt-rosa-ink">A contagem já começou</p>
          <Countdown alvoISO={evento.dataAlvoISO} />
        </Reveal>
      </section>

      {/* ═══ TRAJE ═══ */}
      {evento.traje && (
        <section className={`bg-evt-blush-soft/55 ${PAD} py-[clamp(3.5rem,7vw,5rem)]`}>
          <Reveal className={`flex flex-col items-center gap-3 text-center ${WRAP}`}>
            <p className="eyebrow text-evt-rosa-ink">Traje</p>
            <p className="font-evt-script text-[clamp(2rem,6vw,2.8rem)] text-evt-ink">{evento.traje}</p>
          </Reveal>
        </section>
      )}

      {/* ═══ PROGRAMAÇÃO (timeline) ═══ */}
      {evento.programacao.length > 0 && (
        <section className={`${PAD} ${RHYTHM}`}>
          <div className={WRAP}>
            <Reveal>
              <SectionHeading eyebrow="A noite" title="Programação" />
            </Reveal>
            <div className="mt-12">
              <Timeline itens={evento.programacao} />
            </div>
          </div>
        </section>
      )}

      {/* ═══ CTA — claro ═══ */}
      <section className={`bg-evt-blush-soft/55 ${PAD} py-[clamp(4.5rem,9vw,6.5rem)]`}>
        <Reveal className={`flex flex-col items-center gap-6 text-center ${WRAP}`}>
          <h2 className="font-evt-script text-[clamp(2.2rem,7vw,3.2rem)] leading-tight text-evt-ink">
            Você vem?
          </h2>
          <ConfirmCTA />
        </Reveal>
      </section>
    </main>
  );
}
