// ─────────────────────────────────────────────────────────────────────────────
// /presentes — 15 anos "Glamour Rosé". CORPO PRÓPRIO.
// ─────────────────────────────────────────────────────────────────────────────
// Texto de abertura + lista de presentes (glossy, foil no valor) + Pix (PixCard
// compartilhado, funcional). Sem checkout — Pix direto. Estado vazio elegante.
import Image from "next/image";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { PixCard } from "@/components/evt/PixCard";
import { QgrStyle, QgrHeading, QgrEyebrow, QgrPanel, QgrSparkle, QgrSparkleTrio } from "./glam";

const PAD = "px-[clamp(1.25rem,5vw,2rem)]";
const WRAP = "mx-auto max-w-[880px]";

export function PresentesQuinzeGlamour({ evento }: PaginaTemplateProps) {
  const nome = evento.primeiroNome;
  const itens = evento.presentes ?? [];
  const temItens = itens.length > 0;
  const temPix = !!(evento.pixChave?.trim() || evento.pixQrUrl?.trim());
  const texto =
    evento.presentesTexto ??
    "O maior presente é ter você comemorando comigo. Mas, se quiser deixar um carinho a mais, separei algumas ideias — e a minha chave Pix também está aqui.";

  return (
    <main className={`bg-transparent ${PAD} pb-[clamp(5rem,10vw,8rem)] pt-32`}>
      <QgrStyle />

      <div className={WRAP}>
        <Reveal>
          <QgrHeading eyebrow="Presentes" titulo="Sua presença é o presente" />
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-7 max-w-[560px] text-center font-evt-body text-[1.15rem] leading-relaxed text-evt-ink-soft">
            {texto}
          </p>
        </Reveal>

        {/* Foto (opcional) — enquadrada em moldura foil. */}
        {evento.presentesFotoUrl && (
          <Reveal delay={180} className="mt-12">
            <div className="qgr-frame mx-auto max-w-[520px] rounded-[calc(1.6rem+3px)] p-[3px]">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.6rem]">
                <Image
                  src={evento.presentesFotoUrl}
                  alt={`Foto de ${nome}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 520px"
                  className="object-cover"
                />
                <span className="qgr-sheen qgr-sheen--auto" aria-hidden />
              </div>
            </div>
          </Reveal>
        )}

        {/* Lista de presentes. */}
        {temItens && (
          <Reveal delay={200} className="mt-12">
            <QgrPanel autoSheen className="p-[clamp(1.75rem,6vw,2.75rem)]">
              <div className="flex flex-col items-center text-center">
                <QgrSparkle className="qgr-twinkle h-5 w-5 text-evt-rosa" />
                <p className="mt-3 font-evt-util text-[0.62rem] uppercase tracking-[0.32em] text-evt-rosa-ink">
                  Lista de presentes
                </p>
                <h2 className="mt-2 font-evt-script text-[clamp(2rem,6vw,2.6rem)] leading-tight text-evt-ink">
                  Se quiser me presentear
                </h2>
              </div>
              <ul className="mx-auto mt-8 flex max-w-[620px] flex-col">
                {itens.map((it, i) => (
                  <li
                    key={`${it.titulo}-${i}`}
                    className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4 ${
                      i > 0 ? "border-t border-[var(--line-rosa)]" : ""
                    }`}
                  >
                    <span className="font-evt-body text-[1.22rem] text-evt-ink">{it.titulo}</span>
                    {it.valorLabel && (
                      <span className="qgr-foil font-evt-display text-[1.15rem] tabular-nums">
                        {it.valorLabel}
                      </span>
                    )}
                    {it.descricao && (
                      <span className="basis-full font-evt-body text-[0.98rem] leading-snug text-evt-ink-soft">
                        {it.descricao}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </QgrPanel>
          </Reveal>
        )}

        {/* Pix (funcional, compartilhado). */}
        {temPix && (
          <Reveal delay={temItens ? 260 : 200} className="mt-12">
            {temItens && (
              <div className="mb-8 flex flex-col items-center gap-3 text-center">
                <QgrEyebrow>Ou, se preferir</QgrEyebrow>
                <p className="font-evt-script text-[clamp(1.9rem,6vw,2.6rem)] leading-tight text-evt-rosa-ink">
                  um Pix, com todo o meu obrigada
                </p>
              </div>
            )}
            <PixCard chave={evento.pixChave} nome={evento.pixNome} qrUrl={evento.pixQrUrl} />
          </Reveal>
        )}

        {/* Estado vazio elegante. */}
        {!temItens && !temPix && (
          <Reveal delay={200} className="mt-14 flex flex-col items-center gap-6 text-center">
            <QgrSparkleTrio />
            <p className="max-w-[520px] font-evt-script text-[clamp(2rem,6vw,2.8rem)] leading-tight text-evt-rosa-ink">
              Sua presença é, de longe, o presente mais lindo.
            </p>
          </Reveal>
        )}
      </div>
    </main>
  );
}
