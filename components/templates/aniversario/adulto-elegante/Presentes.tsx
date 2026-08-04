// PRESENTES — Aniversário Adulto Elegante. Corpo PRÓPRIO: intro editorial (+ foto
// opcional) + lista de presentes moderna (linhas com índice, título, descrição e
// valor em pílula). Dinheiro entra pela plataforma (carteira do dono).
// Server component.
import Image from "next/image";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import {
  AAE_PAD,
  AaeStyle,
  aaeDelay,
  Carta,
  Filete,
  Kicker,
} from "@/components/templates/aniversario/adulto-elegante/partes";

export function PresentesAniversarioAdulto({ evento }: PaginaTemplateProps) {
  const nome = evento.primeiroNome;
  const intro =
    evento.presentesTexto ??
    "O maior presente é ter você na festa. Mas, se quiser deixar um carinho a mais, reuni algumas ideias aqui.";
  const temLista = evento.presentes.length > 0;
  const foto = evento.presentesFotoUrl;

  return (
    <main className="relative bg-transparent">
      <AaeStyle />

      {/* ── Intro ── */}
      <section className={`bg-evt-ivory/70 ${AAE_PAD} pb-[clamp(3rem,7vw,5rem)] pt-[clamp(7rem,14vw,9rem)]`}>
        <div className="mx-auto grid w-full max-w-[980px] items-center gap-10 md:grid-cols-2">
          <div className={foto ? "" : "mx-auto max-w-[560px] text-center md:col-span-2"}>
            <p className="aae-rise" style={aaeDelay(40)}>
              <Kicker center={!foto}>Presentes</Kicker>
            </p>
            <h1
              className="aae-rise mt-6 font-evt-display uppercase leading-[1.04] tracking-[0.02em] text-evt-ink text-[clamp(2rem,5.4vw,3rem)]"
              style={aaeDelay(120)}
            >
              Sua presença é o presente
            </h1>
            <p
              className="aae-rise mt-6 font-evt-body text-[clamp(1.2rem,3vw,1.45rem)] leading-relaxed text-evt-ink-soft"
              style={aaeDelay(220)}
            >
              {intro}
            </p>
          </div>

          {foto && (
            <Reveal className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] shadow-[0_28px_70px_-52px_rgba(15,23,42,0.55)]">
              <Image
                src={foto}
                alt={`Foto de ${nome}`}
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-cover"
              />
            </Reveal>
          )}
        </div>
      </section>

      {/* ── Lista de presentes ── */}
      {temLista && (
        <section className={`bg-transparent ${AAE_PAD} py-[clamp(3rem,7vw,5rem)]`}>
          <div className="mx-auto w-full max-w-[820px]">
            <Reveal className="mb-8">
              <Kicker>Algumas ideias</Kicker>
            </Reveal>
            <Reveal delay={80}>
              <Carta className="px-[clamp(1.25rem,4vw,2.25rem)] py-2">
                <ul>
                  {evento.presentes.map((p, i) => (
                    <li key={`${p.titulo}-${i}`}>
                      {i > 0 && <Filete />}
                      <div className="flex items-start gap-5 py-6">
                        <span className="mt-1 w-8 shrink-0 font-evt-display text-[1.15rem] leading-none tabular-nums text-evt-rosa-ink/70">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 grow">
                          <p className="font-evt-body text-[1.35rem] leading-tight text-evt-ink">
                            {p.titulo}
                          </p>
                          {p.descricao && (
                            <p className="mt-1.5 font-evt-body text-[1.05rem] leading-relaxed text-evt-ink-soft">
                              {p.descricao}
                            </p>
                          )}
                        </div>
                        {p.valorLabel && (
                          <span className="mt-1 shrink-0 whitespace-nowrap rounded-full border border-[var(--line-rosa)] px-3.5 py-1.5 font-evt-util text-[0.62rem] font-medium uppercase tracking-[0.16em] text-evt-rosa-ink">
                            {p.valorLabel}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Carta>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Vazio elegante (sem lista) ── */}
      {!temLista && (
        <section className={`bg-transparent ${AAE_PAD} pb-[clamp(5rem,10vw,8rem)] pt-[clamp(1rem,3vw,2rem)]`}>
          <Reveal className="mx-auto flex max-w-[520px] flex-col items-center gap-4 text-center">
            <span className="h-px w-16 bg-evt-rosa-ink/40" aria-hidden />
            <p className="font-evt-body text-[1.2rem] italic leading-relaxed text-evt-ink-soft">
              Sua presença já é o maior presente.
            </p>
          </Reveal>
        </section>
      )}
    </main>
  );
}
