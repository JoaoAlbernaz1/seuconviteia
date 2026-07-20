// ─────────────────────────────────────────────────────────────────────────────
// HOME — 15 anos "Glamour Rosé" = CLONE FIEL da home do site da Maria Clara
// (festa-15-maria-clara/app/page.tsx). Estrutura/markup/classes idênticos ao site
// real; só os tokens de cor/fonte viram `--ev-*`/`font-evt-*` (mesmos valores da
// festa no preset rose) e o CONTEÚDO vem de `EventoFesta` (data-driven).
//
// Seções (iguais ao real): capa → "O convite" (carta + assinatura) → "Quando &
// Onde" (card) + Confirmar presença → Traje + 2 teasers (Presentes/Recados).
// Contagem, programação e galeria completas ficam em /evento e /galeria.
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { Button } from "@/components/evt/Button";
import { Card } from "@/components/evt/Card";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { Flourish } from "@/components/evt/icons";
import { CapaGlamour } from "./Capa";

const PAD = "px-[clamp(1.25rem,5vw,2rem)]";
const RHYTHM = "py-[clamp(5rem,10vw,8rem)]";
const WRAP = "mx-auto max-w-[1100px]";
// bg-blush-soft/55 do site real (translúcido sobre a atmosfera).
const BLUSH_55 = "color-mix(in srgb, var(--ev-blush-soft) 55%, transparent)";

export function HomeQuinzeGlamour({ evento, recursos }: PaginaTemplateProps) {
  const nome = evento.primeiroNome;
  const assinatura = evento.assinatura || nome;
  const paragrafos = (evento.mensagemBoasVindas ?? "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Teasers (Presentes / Recados) — só os recursos ativos, como no site real.
  const teasers = [
    recursos.presentes && {
      href: "/presentes",
      eyebrow: "Presentes",
      titulo: "Sua presença é o presente",
      texto: "Se quiser deixar um carinho a mais, minha chave Pix está aqui.",
    },
    recursos.recados && {
      href: "/recados",
      eyebrow: "Recados",
      titulo: "Deixe seu carinho",
      texto: `Escreva uma mensagem para a ${nome} — ela vai amar ler cada palavra.`,
    },
  ].filter(Boolean) as { href: string; eyebrow: string; titulo: string; texto: string }[];

  return (
    <main className="bg-transparent">
      {/* ═══ HERO cinematográfico — capa do convite ═══ */}
      <CapaGlamour
        nome={nome}
        idade={evento.idade}
        data={evento.data}
        horario={evento.horario}
        local={evento.local}
        fotoUrl={evento.fotoUrl}
        fotoDesktopUrl={evento.fotoDesktopUrl}
      />

      {/* ═══ O CONVITE (carta + assinatura) ═══ */}
      <section className={`${PAD} ${RHYTHM}`} style={{ background: BLUSH_55 }}>
        <div className="mx-auto max-w-[680px]">
          <Reveal>
            <div className="text-center">
              <p className="eyebrow text-evt-rosa-ink">O convite</p>
              <h2 className="mt-3 font-evt-script leading-[1.04] text-[clamp(4.01rem,11.2vw,5.66rem)] text-evt-ink">
                Vem comemorar comigo
              </h2>
              <div className="mt-5 flex items-center justify-center" aria-hidden>
                <Flourish className="h-4 w-24 text-evt-rosa" />
              </div>
            </div>
          </Reveal>
          <Reveal delay={120} className="mt-10 space-y-5 text-center">
            {evento.conviteIntro && (
              <p className="font-evt-body text-[clamp(1.4rem,4.6vw,1.72rem)] font-medium italic leading-snug text-evt-rosa-ink">
                {evento.conviteIntro}
              </p>
            )}
            {paragrafos.map((p, i) => (
              <p key={i} className="font-evt-body text-[1.2rem] leading-relaxed text-evt-ink">
                {p}
              </p>
            ))}
          </Reveal>
          <Reveal delay={200} className="mt-9 flex flex-col items-center gap-2 text-center">
            <p className="font-evt-script text-[clamp(2.5rem,11vw,4.1rem)] text-evt-rosa-ink">Com carinho,</p>
            <p className="whitespace-nowrap font-evt-script text-[clamp(2.5rem,11vw,4.1rem)] text-evt-rosa-ink">
              {assinatura}
            </p>
            <Button href="/evento" variant="ghost" className="mt-5">
              Ler o convite e ver os detalhes
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ═══ QUANDO & ONDE + Confirmar presença ═══ */}
      <section className={`bg-transparent ${PAD} ${RHYTHM}`}>
        <div className={WRAP}>
          <Reveal>
            <Card className="mx-auto max-w-[760px] p-[clamp(1.75rem,5vw,2.75rem)]">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="text-center sm:text-left">
                  <p className="eyebrow text-evt-rosa-ink">Quando</p>
                  <p className="mt-3 font-evt-body text-[clamp(1.7rem,5.2vw,2.15rem)] leading-tight text-evt-ink">
                    {evento.data}
                  </p>
                  <p className="font-evt-display text-[clamp(2rem,6vw,2.7rem)] tracking-[0.04em] text-evt-rosa-ink">
                    {evento.horario}
                  </p>
                </div>
                <div className="text-center sm:border-l sm:border-[var(--line)] sm:pl-8 sm:text-left">
                  <p className="eyebrow text-evt-rosa-ink">Onde</p>
                  <p className="mt-3 font-evt-body text-[clamp(1.7rem,5.2vw,2.15rem)] leading-tight text-evt-ink">
                    {evento.local ?? "O local"}
                  </p>
                  {evento.endereco && (
                    <p className="mt-1 font-evt-body text-lg text-evt-ink-soft">{evento.endereco}</p>
                  )}
                </div>
              </div>
              <div className="mt-8 flex justify-center sm:justify-start">
                <Button href="/evento" variant="ghost" className="whitespace-nowrap" style={{ letterSpacing: "0.14em" }}>
                  Ver mapa e programação
                </Button>
              </div>
            </Card>
          </Reveal>

          {recursos.rsvp && (
            <Reveal delay={140} className="mt-12 flex flex-col items-center gap-5 text-center">
              <span className="flex items-center gap-3 text-evt-rosa" aria-hidden>
                <span className="h-px w-12 bg-evt-rosa/50" />
                <span className="rotate-45 text-[0.5rem]">◆</span>
                <span className="h-px w-12 bg-evt-rosa/50" />
              </span>
              <p className="font-evt-script text-[clamp(3.3rem,8.8vw,4.1rem)] text-evt-rosa-ink">
                Faça parte dessa noite
              </p>
              <ConfirmCTA />
            </Reveal>
          )}
        </div>
      </section>

      {/* ═══ TRAJE + TEASERS ═══ */}
      <section className={`${PAD} ${RHYTHM}`} style={{ background: BLUSH_55 }}>
        <div className={WRAP}>
          {evento.traje && (
            <Reveal className="flex flex-col items-center gap-3 text-center">
              <p className="eyebrow text-evt-rosa-ink">Traje</p>
              <p className="font-evt-script text-[clamp(3.3rem,8.5vw,4rem)] text-evt-ink">{evento.traje}</p>
            </Reveal>
          )}
          {teasers.length > 0 && (
            <div className="mx-auto mt-12 grid max-w-[760px] gap-6 md:grid-cols-2">
              {teasers.map((t, i) => (
                <Reveal key={t.href} delay={i * 100} className="h-full">
                  <Card interactive className="group h-full p-8">
                    <a
                      href={t.href}
                      className="flex h-full flex-col rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      <span className="mb-6 h-px w-12 bg-evt-rosa/60" aria-hidden />
                      <p className="eyebrow text-evt-rosa-ink">{t.eyebrow}</p>
                      <h3 className="mt-3 font-evt-script text-[clamp(3.4rem,8.6vw,3.9rem)] leading-[1.08] text-evt-ink">
                        {t.titulo}
                      </h3>
                      <p className="mt-4 grow font-evt-body text-[1.14rem] leading-relaxed text-evt-ink-soft">
                        {t.texto}
                      </p>
                      <span className="mt-6 font-evt-util text-[0.74rem] uppercase tracking-[0.2em] text-evt-rosa-ink transition-colors group-hover:text-evt-framboesa">
                        Abrir →
                      </span>
                    </a>
                  </Card>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
