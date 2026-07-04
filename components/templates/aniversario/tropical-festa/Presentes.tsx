// PRESENTES — Aniversário · Tropical Festa. Corpo PRÓPRIO: texto de abertura +
// lista COLORIDA de presentes (cartões vivos) + Pix (cartão próprio AtfPix, copiar
// chave). Server component; o Pix interativo mora em client. Gate do recurso é feito
// na rota (/presentes); aqui só o conteúdo. Data-driven por `EventoFesta`.
import Image from "next/image";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { AtfPix } from "@/components/templates/aniversario/tropical-festa/Pix";
import {
  ATF_PAD,
  ATF_WRAP,
  ATF_MEDALHOES,
  AtfStyle,
  AtfChip,
  AtfHeading,
  Leaf,
  IconGift,
} from "@/components/templates/aniversario/tropical-festa/shared";

const TEXTO_PADRAO =
  "O maior presente é ter você comemorando comigo. Mas, se quiser deixar um carinho a mais, separei algumas ideias — e a minha chave Pix também está aqui.";

export function PresentesAniversarioTropical({ evento }: PaginaTemplateProps) {
  const itens = evento.presentes ?? [];
  const temPix =
    (!!evento.pixChave && evento.pixChave.trim().length > 0) ||
    (!!evento.pixQrUrl && evento.pixQrUrl.trim().length > 0);
  const temFoto = !!evento.presentesFotoUrl && evento.presentesFotoUrl.trim().length > 0;

  return (
    <main className="bg-evt-ivory">
      <AtfStyle />

      {/* ── Abertura: texto ── */}
      <section className={`relative overflow-hidden bg-evt-ivory ${ATF_PAD} pb-[clamp(2.5rem,6vw,4rem)] pt-32`}>
        <Leaf className="atf-sway pointer-events-none absolute -left-6 top-24 h-24 w-auto text-evt-rose/40" />
        <Leaf className="atf-sway pointer-events-none absolute -right-4 top-36 h-20 w-auto rotate-[150deg] text-evt-rose/30" style={{ animationDelay: "0.7s" }} />
        <div className="mx-auto max-w-[760px] text-center">
          <Reveal className="flex flex-col items-center">
            <AtfHeading eyebrow="Presentes" title="Sua presença é o presente" />
          </Reveal>
          <Reveal delay={140}>
            <p className="mx-auto mt-7 max-w-[560px] font-evt-body text-[1.2rem] leading-relaxed text-evt-ink-soft">
              {evento.presentesTexto ?? TEXTO_PADRAO}
            </p>
          </Reveal>

          {temFoto && (
            <Reveal delay={220} className="mt-11 flex justify-center">
              <div
                className="relative rotate-[-1.5deg] rounded-[1.5rem] p-[4px] shadow-[0_28px_60px_-40px_rgba(46,26,32,0.55)]"
                style={{ background: "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))" }}
              >
                <div className="relative aspect-[4/5] w-[min(280px,72vw)] overflow-hidden rounded-[1.2rem]">
                  <Image
                    src={evento.presentesFotoUrl!}
                    alt={`Foto de ${evento.primeiroNome}`}
                    fill
                    sizes="280px"
                    className="object-cover"
                  />
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── Lista colorida ── */}
      {itens.length > 0 && (
        <section className={`bg-evt-ivory ${ATF_PAD} pb-[clamp(3rem,7vw,4.5rem)] pt-[clamp(1rem,3vw,2rem)]`}>
          <div className={`${ATF_WRAP} max-w-[820px]`}>
            <ul className="flex flex-col gap-4">
              {itens.map((it, i) => (
                <Reveal as="li" key={`${it.titulo}-${i}`} delay={(i % 6) * 80}>
                  <div className="group flex items-center gap-4 overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-white/85 p-4 pr-5 shadow-[0_22px_50px_-42px_rgba(46,26,32,0.5)] backdrop-blur-sm sm:gap-6 sm:p-5 sm:pr-7">
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1rem] text-white shadow-[0_10px_26px_-16px_rgba(0,0,0,0.5)] sm:h-16 sm:w-16"
                      style={{ background: ATF_MEDALHOES[i % ATF_MEDALHOES.length] }}
                    >
                      <IconGift className="h-7 w-7" />
                    </span>
                    <div className="flex grow flex-col gap-1">
                      <span className="font-evt-body text-[clamp(1.2rem,4vw,1.45rem)] leading-snug text-evt-ink">{it.titulo}</span>
                      {it.descricao && (
                        <span className="font-evt-body text-[0.98rem] leading-snug text-evt-ink-soft">{it.descricao}</span>
                      )}
                    </div>
                    {it.valorLabel && (
                      <span
                        className="shrink-0 rounded-full px-4 py-1.5 font-evt-util text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-evt-rosa-ink"
                        style={{ background: "color-mix(in srgb, var(--ev-rose) 28%, transparent)" }}
                      >
                        {it.valorLabel}
                      </span>
                    )}
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Pix ── */}
      {temPix && (
        <section className={`relative bg-evt-ivory ${ATF_PAD} pb-[clamp(5rem,10vw,8rem)] pt-[clamp(2rem,5vw,3.5rem)]`}>
          <div className={`${ATF_WRAP} flex flex-col items-center`}>
            <Reveal className="mb-9 flex flex-col items-center gap-3 text-center">
              <AtfChip>Ou, se preferir</AtfChip>
              <p className="font-evt-script text-[clamp(1.9rem,6vw,2.6rem)] leading-tight text-evt-ink">
                um Pix, com todo o meu carinho
              </p>
            </Reveal>
            <Reveal delay={140} className="w-full">
              <AtfPix chave={evento.pixChave} nome={evento.pixNome} qrUrl={evento.pixQrUrl} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Nada cadastrado ── */}
      {itens.length === 0 && !temPix && (
        <section className={`relative bg-evt-ivory ${ATF_PAD} pb-[clamp(5rem,10vw,8rem)] pt-[clamp(1rem,3vw,2rem)]`}>
          <Reveal className={`${ATF_WRAP} flex flex-col items-center gap-4 text-center`}>
            <span className="flex h-16 w-16 items-center justify-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--ev-rose), var(--ev-framboesa))" }}>
              <IconGift className="h-8 w-8" />
            </span>
            <p className="max-w-[520px] font-evt-script text-[clamp(1.9rem,6vw,2.6rem)] leading-tight text-evt-framboesa">
              Sua presença já é o maior presente!
            </p>
          </Reveal>
        </section>
      )}
    </main>
  );
}
