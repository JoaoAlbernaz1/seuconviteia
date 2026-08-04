// PRESENTES — Casamento · Clássico Elegante. Texto de abertura + lista de presentes
// em cartas sofisticadas + foto opcional em moldura. Corpo PRÓPRIO; dinheiro
// entra pela plataforma (carteira do dono) — sem chave Pix no site.
// Gate por dados: cada bloco só aparece se houver conteúdo. Server component.
import Image from "next/image";
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { Flourish } from "@/components/evt/icons";
import {
  CceEstilo,
  Medalhao,
  Divisor,
  Moldura,
  CCE_PAD,
} from "@/components/templates/casamento/classico-elegante/sections";

export function PresentesCasamentoClassico({ evento, nicho }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const nome = evento.primeiroNome;
  const inicial = nome.trim().charAt(0).toUpperCase() || "❦";
  const intro = evento.presentesTexto ?? t.teaserPresentes;
  const temItens = evento.presentes.length > 0;

  return (
    <main className={`bg-transparent ${CCE_PAD} pb-[clamp(5rem,10vw,8rem)] pt-32`}>
      <CceEstilo />
      <div className="mx-auto max-w-[920px]">
        {/* ── Cabeçalho ── */}
        <Reveal className="flex flex-col items-center text-center">
          <Medalhao inicial={inicial} />
          <p className="mt-7 eyebrow text-evt-rosa-ink">Presentes</p>
          <Flourish className="mt-5 h-4 w-28 text-evt-rosa" />
          <h1 className="mt-5 font-evt-script text-[clamp(2.6rem,8vw,3.8rem)] leading-[1.04] text-evt-ink">
            Sua presença é o presente
          </h1>
          <p className="mt-7 max-w-[560px] font-evt-body text-[1.15rem] leading-relaxed text-evt-ink-soft">
            {intro}
          </p>
        </Reveal>

        {/* ── Foto opcional em moldura ── */}
        {evento.presentesFotoUrl && (
          <Reveal delay={140} className="mt-12">
            <div className="mx-auto max-w-[540px] rounded-[calc(var(--radius-card)+0.55rem)] border border-[var(--line-rosa)] bg-white/40 p-1.5 shadow-[0_34px_82px_-58px_rgba(46,26,32,0.55)]">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)]">
                <Image
                  src={evento.presentesFotoUrl}
                  alt={`Foto de ${nome}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 540px"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
        )}

        {/* ── Lista de presentes em cartas sofisticadas ── */}
        {temItens && (
          <div className="mt-14">
            <Reveal className="flex flex-col items-center">
              <Divisor />
              <p className="mt-5 eyebrow text-evt-rosa-ink">Algumas ideias</p>
            </Reveal>
            <div
              className={`mt-9 grid gap-6 ${
                evento.presentes.length === 1
                  ? "mx-auto max-w-md"
                  : "sm:grid-cols-2"
              }`}
            >
              {evento.presentes.map((g, i) => (
                <Reveal key={`${g.titulo}-${i}`} delay={i * 90} className="h-full">
                  <Moldura className="flex h-full flex-col p-7">
                    <span className="h-px w-10 bg-[var(--line-rosa)]" aria-hidden />
                    <h3 className="mt-5 font-evt-display text-[1.5rem] leading-snug tracking-[0.02em] text-evt-ink">
                      {g.titulo}
                    </h3>
                    {g.descricao && (
                      <p className="mt-3 grow font-evt-body text-[1.05rem] leading-relaxed text-evt-ink-soft">
                        {g.descricao}
                      </p>
                    )}
                    {g.valorLabel && (
                      <p className="mt-6 font-evt-util text-[0.7rem] uppercase tracking-[0.2em] text-evt-rosa-ink">
                        {g.valorLabel}
                      </p>
                    )}
                  </Moldura>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* ── Vazio elegante ── */}
        {!temItens && (
          <Reveal delay={140} className="mt-14 flex flex-col items-center gap-4 text-center">
            <Flourish className="h-4 w-28 text-evt-rosa" />
            <p className="max-w-[440px] font-evt-body text-[1.12rem] leading-relaxed text-evt-ink-soft">
              A lista de presentes chega em breve. Por ora, o maior presente é ter você com a gente.
            </p>
          </Reveal>
        )}
      </div>
    </main>
  );
}
