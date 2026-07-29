// ─────────────────────────────────────────────────────────────────────────────
// /evento — 15 anos "Glamour Rosé" = CLONE FIEL da página /evento do site da
// Maria Clara (festa-15-maria-clara/app/evento/page.tsx). Classes/estrutura
// idênticas ao real; tokens de cor/fonte viram `--ev-*`/`font-evt-*` e o CONTEÚDO
// vem de `EventoFesta`. Seções: O convite (carta) → contagem + Quando&Onde (card,
// "Abrir no Maps") → Traje → Programação (timeline) → CTA "Você vem?".
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { Button } from "@/components/evt/Button";
import { Card } from "@/components/evt/Card";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { Timeline } from "@/components/evt/Timeline";
import { Flourish } from "@/components/evt/icons";
import { QgrCountdown } from "./QgrCountdown";

const PAD = "px-[clamp(1.25rem,5vw,2rem)]";
const RHYTHM = "py-[clamp(4rem,9vw,7rem)]";
const WRAP = "mx-auto max-w-[1100px]";

// Cabeçalho de seção — eyebrow + heading script + filigrana (tamanho EXATO do real).
function Heading({ eyebrow, title, liveKey }: { eyebrow: string; title: string; liveKey?: string }) {
  return (
    <div className="text-center">
      <p className="eyebrow text-evt-rosa-ink">{eyebrow}</p>
      <h2 data-live={liveKey} className="mt-3 font-evt-script leading-[1.04] text-[clamp(4.01rem,11.2vw,5.66rem)] text-evt-ink">
        {title}
      </h2>
      <div className="mt-5 flex items-center justify-center" aria-hidden>
        <Flourish className="h-4 w-24 text-evt-rosa" />
      </div>
    </div>
  );
}

export function EventoQuinzeGlamour({ evento, recursos }: PaginaTemplateProps) {
  const nome = evento.primeiroNome;
  const local = evento.local ?? "O local";
  const assinatura = evento.assinatura || nome;
  const paragrafos = (evento.mensagemBoasVindas ?? "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const temProgramacao = recursos.programacao && evento.programacao.length > 0;

  return (
    <main className="bg-transparent">
      {/* ═══ TOPO — O convite (carta) ═══ */}
      <section data-sec="carta" className={`${PAD} pb-[clamp(4rem,9vw,7rem)] pt-32`} style={{ background: "color-mix(in srgb, var(--ev-blush-soft) 55%, transparent)" }}>
        <div className="mx-auto max-w-[680px] text-center">
          <Reveal dataSec="carta-titulo">
            <Heading eyebrow={evento.secoes.abertura.eyebrow} title={evento.secoes.abertura.titulo} liveKey="carta-titulo" />
          </Reveal>
          <Reveal delay={120} dataSec="carta-texto" className="mt-10 space-y-5 text-center">
            {evento.conviteIntro && (
              <p className="font-evt-body text-[clamp(1.4rem,4.6vw,1.72rem)] font-medium italic leading-snug text-evt-rosa-ink">
                {evento.conviteIntro}
              </p>
            )}
            <div
              className="space-y-5"
              data-live="carta-msg"
              data-live-multi=""
              data-live-class="font-evt-body text-[1.2rem] leading-relaxed text-evt-ink"
            >
              {paragrafos.map((p, i) => (
                <p key={i} className="font-evt-body text-[1.2rem] leading-relaxed text-evt-ink">
                  {p}
                </p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={200} className="mt-8 flex flex-col items-center gap-2">
            <p className="font-evt-script text-[clamp(2.5rem,11vw,4.1rem)] text-evt-rosa-ink">{evento.secoes.assinaturaLead}</p>
            <p className="whitespace-nowrap font-evt-script text-[clamp(2.5rem,11vw,4.1rem)] text-evt-rosa-ink">
              {assinatura}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══ CONTAGEM + QUANDO · ONDE ═══ */}
      <section data-sec="quando" className={`${PAD} ${RHYTHM}`}>
        {recursos.contador && (
          <Reveal className={`mb-12 flex flex-col items-center gap-6 text-center ${WRAP}`}>
            <p className="eyebrow text-evt-rosa-ink">A contagem já começou</p>
            <QgrCountdown alvoISO={evento.dataAlvoISO} />
          </Reveal>
        )}
        <Reveal className={WRAP}>
          <Card className="mx-auto max-w-[760px] p-[clamp(1.75rem,5vw,2.75rem)]">
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="text-center sm:text-left">
                <p className="eyebrow text-evt-rosa-ink">Quando</p>
                <p data-live="data" className="mt-4 font-evt-script text-[clamp(3rem,7vw,3.5rem)] leading-tight text-evt-ink">
                  {evento.data}
                </p>
                <p data-live="horario" className="mt-1 font-evt-display text-[clamp(2.2rem,6.6vw,2.7rem)] tracking-[0.04em] text-evt-rosa-ink">
                  {evento.horario}
                </p>
              </div>
              <div className="text-center sm:border-l sm:border-[var(--line)] sm:pl-8 sm:text-left">
                <p className="eyebrow text-evt-rosa-ink">Onde</p>
                <p data-live="local" className="mt-4 font-evt-script text-[clamp(3rem,7vw,3.5rem)] leading-tight text-evt-ink">
                  {local}
                </p>
                {evento.endereco && (
                  <p data-live="endereco" className="mt-2 font-evt-body text-lg text-evt-ink-soft">{evento.endereco}</p>
                )}
              </div>
            </div>
            {evento.mapsLinkUrl && (
              <div className="mt-8 flex justify-center">
                <Button href={evento.mapsLinkUrl} variant="ghost" target="_blank" rel="noreferrer">
                  Abrir no Maps
                </Button>
              </div>
            )}
          </Card>
        </Reveal>
      </section>

      {/* ═══ TRAJE ═══ */}
      {evento.traje && (
        <section data-sec="traje" className={`${PAD} py-[clamp(3.5rem,7vw,5rem)]`} style={{ background: "color-mix(in srgb, var(--ev-blush-soft) 55%, transparent)" }}>
          <Reveal className={`flex flex-col items-center gap-3 text-center ${WRAP}`}>
            <p className="eyebrow text-evt-rosa-ink">Traje</p>
            <p data-live="traje" className="font-evt-script text-[clamp(3.3rem,8.5vw,4rem)] text-evt-ink">{evento.traje}</p>
          </Reveal>
        </section>
      )}

      {/* ═══ PROGRAMAÇÃO (timeline) ═══ */}
      {temProgramacao && (
        <section data-sec="programacao" className={`${PAD} ${RHYTHM}`}>
          <div className={WRAP}>
            <Reveal>
              <Heading eyebrow="A noite" title="Programação" />
            </Reveal>
            <div className="mt-12">
              <Timeline itens={evento.programacao} />
            </div>
          </div>
        </section>
      )}

      {/* ═══ CTA — Você vem? ═══ */}
      {recursos.rsvp && (
        <section data-sec="cta" className={`bg-transparent ${PAD} py-[clamp(4.5rem,9vw,6.5rem)]`}>
          <Reveal className={`flex flex-col items-center gap-6 text-center ${WRAP}`}>
            <span className="flex items-center gap-3 text-evt-rosa" aria-hidden>
              <span className="h-px w-12 bg-evt-rosa/50" />
              <span className="rotate-45 text-[0.5rem]">◆</span>
              <span className="h-px w-12 bg-evt-rosa/50" />
            </span>
            <h2 data-live="cta-lead" className="font-evt-script text-[clamp(3.8rem,10.5vw,5rem)] leading-tight text-evt-rosa-ink">
              {evento.ctaLead ?? "Você vem?"}
            </h2>
            <ConfirmCTA label={evento.ctaLabel} href={evento.ctaHref} />
          </Reveal>
        </section>
      )}
    </main>
  );
}
