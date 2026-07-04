// HOME — Aniversário Adulto Elegante. Corpo PRÓPRIO (nada de _base/secoes): capa
// editorial split + seções em ritmo de revista, neutras e adultas. Tudo gated por
// recurso (plano ∩ toggle); seção vazia some. Server component; interatividade
// (contador) isolada em client. Reveal cuida das entradas (reduced-motion safe).
import Link from "next/link";
import Image from "next/image";
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { CapaAdulto } from "@/components/templates/aniversario/adulto-elegante/Capa";
import { ContadorAdulto } from "@/components/templates/aniversario/adulto-elegante/ContadorAdulto";
import {
  AAE_PAD,
  AAE_RHYTHM,
  AAE_WRAP,
  AaeStyle,
  BotaoConfirmar,
  Carta,
  Filete,
  Kicker,
  LinkGhost,
  TituloSecao,
} from "@/components/templates/aniversario/adulto-elegante/partes";

export function HomeAniversarioAdulto({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const nome = evento.primeiroNome;
  const conviteTexto = evento.mensagemBoasVindas || t.conviteTeaser;
  const temProgramacao = recursos.programacao && evento.programacao.length > 0;
  const temGaleria = recursos.galeria && evento.fotos.length > 0;

  return (
    <main className="relative bg-transparent">
      <AaeStyle />

      <CapaAdulto
        nome={nome}
        idade={evento.idade}
        kicker={t.conviteTitulo}
        data={evento.data}
        horario={evento.horario}
        local={evento.local}
        fotoUrl={evento.fotoUrl}
        fotoDesktopUrl={evento.fotoDesktopUrl}
      />

      {/* ── O convite — declaração curta, em uma coluna estreita e arejada ── */}
      <section className={`bg-evt-ivory/70 ${AAE_PAD} ${AAE_RHYTHM}`}>
        <div className="mx-auto max-w-[640px]">
          <Reveal>
            <Kicker>O convite</Kicker>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-8 font-evt-body text-[clamp(1.35rem,3.4vw,1.7rem)] leading-[1.6] text-evt-ink">
              {conviteTexto}
            </p>
          </Reveal>
          <Reveal delay={160} className="mt-10 flex flex-col gap-7">
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-evt-rosa-ink/40" aria-hidden />
              <p className="font-evt-util text-[0.7rem] uppercase tracking-[0.28em] text-evt-ink-soft">
                {t.assinaturaPrefixo} <span className="text-evt-rosa-ink">{nome}</span>
              </p>
            </div>
            <LinkGhost href="/evento" className="self-start">
              Ler o convite completo
            </LinkGhost>
          </Reveal>
        </div>
      </section>

      {/* ── Quando & Onde — dois cartões modernos, numerados ── */}
      <section className={`bg-transparent ${AAE_PAD} ${AAE_RHYTHM}`}>
        <div className={AAE_WRAP}>
          <Reveal>
            <TituloSecao kicker="A celebração" titulo="Quando & Onde" indice="01" />
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <Reveal className="h-full">
              <Carta className="flex h-full flex-col p-[clamp(1.75rem,5vw,2.75rem)]">
                <div className="flex items-baseline justify-between">
                  <Kicker>Quando</Kicker>
                  <span className="font-evt-util text-[0.66rem] tracking-[0.2em] text-evt-ink-soft/50">
                    / 01
                  </span>
                </div>
                <p className="mt-7 font-evt-body text-[clamp(1.5rem,4vw,1.9rem)] leading-tight text-evt-ink">
                  {evento.data}
                </p>
                <p className="mt-2 font-evt-display text-[clamp(2.4rem,7vw,3.4rem)] leading-none tracking-[0.03em] text-evt-rosa-ink">
                  {evento.horario}
                </p>
                <div className="mt-auto pt-8">
                  <LinkGhost href="/agenda">Adicionar à agenda</LinkGhost>
                </div>
              </Carta>
            </Reveal>

            <Reveal delay={100} className="h-full">
              <Carta className="flex h-full flex-col p-[clamp(1.75rem,5vw,2.75rem)]">
                <div className="flex items-baseline justify-between">
                  <Kicker>Onde</Kicker>
                  <span className="font-evt-util text-[0.66rem] tracking-[0.2em] text-evt-ink-soft/50">
                    / 02
                  </span>
                </div>
                <p className="mt-7 font-evt-body text-[clamp(1.5rem,4vw,1.9rem)] leading-tight text-evt-ink">
                  {evento.local ?? "A definir"}
                </p>
                {evento.endereco && (
                  <p className="mt-2 font-evt-body text-[1.1rem] leading-relaxed text-evt-ink-soft">
                    {evento.endereco}
                  </p>
                )}
                {evento.traje && (
                  <p className="mt-5 font-evt-util text-[0.62rem] uppercase tracking-[0.26em] text-evt-ink-soft">
                    Traje · <span className="text-evt-rosa-ink">{evento.traje}</span>
                  </p>
                )}
                <div className="mt-auto pt-8">
                  <LinkGhost href="/evento">Ver mapa e detalhes</LinkGhost>
                </div>
              </Carta>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Contador discreto ── */}
      {recursos.contador && (
        <section className={`bg-evt-blush-soft/40 ${AAE_PAD} py-[clamp(3.5rem,8vw,5.5rem)]`}>
          <Reveal className={`${AAE_WRAP} flex flex-col items-center gap-9 text-center`}>
            <Kicker center>A contagem começou</Kicker>
            <ContadorAdulto alvoISO={evento.dataAlvoISO} />
          </Reveal>
        </section>
      )}

      {/* ── Programação (prévia condensada) ── */}
      {temProgramacao && (
        <section className={`bg-transparent ${AAE_PAD} ${AAE_RHYTHM}`}>
          <div className="mx-auto w-full max-w-[720px]">
            <Reveal>
              <TituloSecao kicker="A noite" titulo="Como vai ser" indice="02" />
            </Reveal>
            <Reveal delay={100} className="mt-11">
              <ol className="flex flex-col">
                {evento.programacao.map((item, i) => (
                  <li key={`${item.hora}-${i}`}>
                    {i > 0 && <Filete />}
                    <div className="flex items-baseline gap-6 py-5">
                      <span className="w-[4.5rem] shrink-0 font-evt-display text-[1.5rem] leading-none tabular-nums text-evt-rosa-ink">
                        {item.hora}
                      </span>
                      <span className="font-evt-body text-[1.2rem] text-evt-ink">
                        {item.titulo}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Galeria (prévia editorial) ── */}
      {temGaleria && (
        <section className={`bg-evt-ivory/70 ${AAE_PAD} ${AAE_RHYTHM}`}>
          <div className={AAE_WRAP}>
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <TituloSecao kicker="Momentos" titulo="Um pouco da história" indice="03" />
              <LinkGhost href="/galeria">Ver a galeria</LinkGhost>
            </Reveal>
            <Reveal delay={120} className="mt-11">
              <Link
                href="/galeria"
                aria-label="Abrir a galeria de fotos"
                className={`group grid gap-3 rounded-[var(--radius-card)] sm:gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink focus-visible:ring-offset-4 focus-visible:ring-offset-evt-ivory ${
                  evento.fotos.length > 1 ? "md:grid-cols-2" : "mx-auto max-w-[720px]"
                }`}
              >
                <PreviaFoto
                  src={evento.fotos[0]}
                  alt={`Foto de ${nome}`}
                  ratio={evento.fotos.length > 1 ? "aspect-[4/5]" : "aspect-[16/10]"}
                  lead
                />
                {evento.fotos.length > 1 && (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {evento.fotos.slice(1, 5).map((src, n) => (
                      <PreviaFoto
                        key={`${src}-${n}`}
                        src={src}
                        alt={`Foto de ${nome}`}
                        ratio="aspect-square"
                      />
                    ))}
                  </div>
                )}
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Presentes / Recados — dois convites editoriais lado a lado ── */}
      {(recursos.presentes || recursos.recados) && (
        <section className={`bg-transparent ${AAE_PAD} ${AAE_RHYTHM}`}>
          <div className={`${AAE_WRAP} grid gap-5 ${recursos.presentes && recursos.recados ? "md:grid-cols-2" : "mx-auto max-w-[560px]"}`}>
            {recursos.presentes && (
              <Reveal className="h-full">
                <Carta className="flex h-full flex-col p-[clamp(1.75rem,5vw,2.75rem)]">
                  <Kicker>Presentes</Kicker>
                  <h3 className="mt-6 font-evt-display uppercase leading-[1.06] tracking-[0.02em] text-evt-ink text-[clamp(1.6rem,4vw,2.1rem)]">
                    Sua presença é o presente
                  </h3>
                  <p className="mt-4 grow font-evt-body text-[1.15rem] leading-relaxed text-evt-ink-soft">
                    {t.teaserPresentes}
                  </p>
                  <div className="pt-7">
                    <LinkGhost href="/presentes">Ver a lista e o Pix</LinkGhost>
                  </div>
                </Carta>
              </Reveal>
            )}
            {recursos.recados && (
              <Reveal delay={100} className="h-full">
                <Carta className="flex h-full flex-col p-[clamp(1.75rem,5vw,2.75rem)]">
                  <Kicker>Recados</Kicker>
                  <h3 className="mt-6 font-evt-display uppercase leading-[1.06] tracking-[0.02em] text-evt-ink text-[clamp(1.6rem,4vw,2.1rem)]">
                    Deixe uma mensagem
                  </h3>
                  <p className="mt-4 grow font-evt-body text-[1.15rem] leading-relaxed text-evt-ink-soft">
                    {t.teaserRecados}
                  </p>
                  <div className="pt-7">
                    <LinkGhost href="/recados">Escrever um recado</LinkGhost>
                  </div>
                </Carta>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* ── RSVP direto ── */}
      {recursos.rsvp && (
        <section className={`bg-evt-blush-soft/40 ${AAE_PAD} py-[clamp(4.5rem,10vw,7rem)]`}>
          <Reveal className={`${AAE_WRAP} flex flex-col items-center gap-8 text-center`}>
            <Kicker center>{t.ctaConvite}</Kicker>
            <p className="max-w-[620px] font-evt-display uppercase leading-[1.08] tracking-[0.02em] text-evt-ink text-[clamp(1.9rem,5vw,2.8rem)]">
              Você vem?
            </p>
            <BotaoConfirmar />
          </Reveal>
        </section>
      )}

      {/* ── Fecho ── */}
      <section className={`bg-transparent ${AAE_PAD} pb-[clamp(4rem,9vw,6rem)] pt-[clamp(3.5rem,8vw,5.5rem)]`}>
        <Reveal className={`${AAE_WRAP} flex flex-col items-center gap-6 text-center`}>
          <span className="h-px w-16 bg-evt-rosa-ink/40" aria-hidden />
          <p className="max-w-[620px] font-evt-body text-[clamp(1.4rem,4vw,2rem)] italic leading-[1.5] text-evt-ink-soft">
            {t.fecho}
          </p>
        </Reveal>
      </section>
    </main>
  );
}

/** Foto da prévia da galeria (não abre lightbox aqui — o bloco todo leva a /galeria). */
function PreviaFoto({
  src,
  alt,
  ratio,
  lead = false,
}: {
  src?: string;
  alt: string;
  ratio: string;
  lead?: boolean;
}) {
  return (
    <div className={`relative ${ratio} overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)]`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={lead ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <div className="h-full w-full [background:linear-gradient(150deg,var(--ev-blush-soft),var(--ev-blush))]" />
      )}
    </div>
  );
}
