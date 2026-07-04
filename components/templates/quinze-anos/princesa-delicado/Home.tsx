// HOME — 15 anos Princesa Delicado. Scroll romântico com SEÇÕES PRÓPRIAS deste
// template (nada de _base/secoes): capa oval, mensagem emocional entre pétalas,
// quando & onde em cartões suaves, contador em medalhões, programação em renda,
// presentes/galeria/recados em convites delicados, RSVP e fecho. Tudo respeita
// os recursos ativos (plano ∩ toggle). Server component; interativos isolados.
import Image from "next/image";
import { textosDoNicho } from "@/lib/textos";
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";
import { Flourish } from "@/components/evt/icons";
import { ConfirmCTA } from "@/components/evt/ConfirmCTA";
import { CapaPrincesa } from "@/components/templates/quinze-anos/princesa-delicado/Capa";
import { ContagemPrincesa } from "@/components/templates/quinze-anos/princesa-delicado/Contagem";
import {
  EstiloPrincesa,
  CabecalhoPrincesa,
  CartaoSuave,
  BotaoSuave,
  Filigrana,
  PetalasFundo,
  AgendaRenda,
  QPD_PAD,
  QPD_RHYTHM,
  QPD_WRAP,
  QPD_WRAP_TXT,
} from "@/components/templates/quinze-anos/princesa-delicado/partes";

export function HomeQuinzePrincesa({ evento, nicho, recursos }: PaginaTemplateProps) {
  const t = textosDoNicho(nicho);
  const nome = evento.primeiroNome;
  const mensagem = evento.mensagemBoasVindas || t.conviteTeaser;
  const temPrograma = recursos.programacao && evento.programacao.length > 0;
  const temGaleria = recursos.galeria && evento.fotos.length > 0;
  const previa = evento.fotos.slice(0, 3);

  return (
    <main className="bg-transparent">
      <EstiloPrincesa />

      <CapaPrincesa
        nome={nome}
        idade={evento.idade}
        kicker={t.conviteTitulo}
        data={evento.data}
        horario={evento.horario}
        local={evento.local}
        fotoUrl={evento.fotoUrl}
        fotoDesktopUrl={evento.fotoDesktopUrl}
      />

      {/* ── Mensagem emocional — entre pétalas de brilho ── */}
      <section className={`relative overflow-hidden bg-evt-blush-soft/40 ${QPD_PAD} ${QPD_RHYTHM}`}>
        <PetalasFundo />
        <div className={`relative ${QPD_WRAP_TXT}`}>
          <CabecalhoPrincesa eyebrow="O convite" titulo={t.conviteTitulo} />
          <Reveal delay={120}>
            <p className="drop-cap mt-10 font-evt-body text-[1.24rem] leading-relaxed text-evt-ink">
              {mensagem}
            </p>
          </Reveal>
          <Reveal delay={200} className="mt-10 flex flex-col items-center gap-7 text-center">
            <p className="font-evt-script text-[clamp(2.1rem,6.5vw,3rem)] leading-tight text-evt-rosa-ink">
              {t.assinaturaPrefixo} {nome}
            </p>
            <BotaoSuave href="/evento">Ler o convite completo</BotaoSuave>
          </Reveal>
        </div>
      </section>

      {/* ── Quando & Onde — cartões suaves ── */}
      <section className={`bg-transparent ${QPD_PAD} ${QPD_RHYTHM}`}>
        <div className={QPD_WRAP}>
          <CabecalhoPrincesa eyebrow="A celebração" titulo="Quando & Onde" />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal className="h-full">
              <CartaoSuave className="h-full p-[clamp(1.75rem,5vw,2.5rem)] text-center">
                <p className="eyebrow text-evt-rosa-ink">Quando</p>
                <p className="mt-4 font-evt-script text-[clamp(1.9rem,5.5vw,2.5rem)] leading-tight text-evt-ink">
                  {evento.data}
                </p>
                <p className="mt-1 font-evt-display text-[clamp(2rem,7vw,2.7rem)] tracking-[0.05em] text-evt-rosa-ink">
                  {evento.horario}
                </p>
              </CartaoSuave>
            </Reveal>
            <Reveal delay={110} className="h-full">
              <CartaoSuave className="flex h-full flex-col p-[clamp(1.75rem,5vw,2.5rem)] text-center">
                <p className="eyebrow text-evt-rosa-ink">Onde</p>
                <p className="mt-4 font-evt-script text-[clamp(1.9rem,5.5vw,2.5rem)] leading-tight text-evt-ink">
                  {evento.local ?? "O local"}
                </p>
                {evento.endereco && (
                  <p className="mt-2 font-evt-body text-[1.05rem] text-evt-ink-soft">{evento.endereco}</p>
                )}
                {evento.traje && (
                  <p className="mt-auto pt-5 font-evt-util text-[0.6rem] uppercase tracking-[0.26em] text-evt-ink-soft">
                    Traje · {evento.traje}
                  </p>
                )}
              </CartaoSuave>
            </Reveal>
          </div>
          <Reveal delay={160} className="mt-10 flex justify-center">
            <BotaoSuave href="/evento">Ver mapa e detalhes</BotaoSuave>
          </Reveal>
        </div>
      </section>

      {/* ── Contador delicado ── */}
      {recursos.contador && (
        <section className={`relative overflow-hidden bg-evt-blush-soft/40 ${QPD_PAD} ${QPD_RHYTHM}`}>
          <div className={`${QPD_WRAP} flex flex-col items-center gap-9 text-center`}>
            <Reveal className="flex flex-col items-center gap-4">
              <p className="eyebrow text-evt-rosa-ink">Cada dia mais perto</p>
              <Flourish className="qpd-float h-4 w-24 text-evt-rosa" />
            </Reveal>
            <Reveal delay={120}>
              <ContagemPrincesa alvoISO={evento.dataAlvoISO} />
            </Reveal>
            <Reveal delay={180}>
              <p className="font-evt-body text-[1.05rem] text-evt-ink-soft">
                {evento.data}
                {evento.horario ? ` · ${evento.horario}` : ""}
              </p>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Programação — linha do tempo em renda ── */}
      {temPrograma && (
        <section className={`bg-transparent ${QPD_PAD} ${QPD_RHYTHM}`}>
          <div className={QPD_WRAP}>
            <CabecalhoPrincesa eyebrow="A noite" titulo="Programação" />
            <div className="mt-12">
              <AgendaRenda itens={evento.programacao} />
            </div>
          </div>
        </section>
      )}

      {/* ── Presentes — convite delicado ── */}
      {recursos.presentes && (
        <section className={`bg-evt-blush-soft/40 ${QPD_PAD} ${QPD_RHYTHM}`}>
          <div className={`${QPD_WRAP_TXT} flex flex-col items-center`}>
            <CabecalhoPrincesa
              eyebrow="Presentes"
              titulo="Sua presença é o presente"
              intro={t.teaserPresentes}
            />
            <Reveal delay={140} className="mt-9">
              <BotaoSuave href="/presentes">Ver lista e Pix</BotaoSuave>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Galeria — prévia com molduras leves ── */}
      {temGaleria && (
        <section className={`bg-transparent ${QPD_PAD} ${QPD_RHYTHM}`}>
          <div className={QPD_WRAP}>
            <CabecalhoPrincesa eyebrow="Recordações" titulo="Momentos" />
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
              {previa.map((src, i) => (
                <Reveal
                  key={`${src}-${i}`}
                  delay={i * 100}
                  className={i === 2 ? "col-span-2 sm:col-span-1" : ""}
                >
                  <div className="relative rounded-[1.4rem] border border-[var(--line)] bg-white/45 p-[6px] shadow-[0_28px_64px_-50px_rgba(46,26,32,0.42)]">
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.05rem]">
                      <Image
                        src={src}
                        alt={`Foto de ${nome}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={160} className="mt-10 flex justify-center">
              <BotaoSuave href="/galeria">Ver a galeria</BotaoSuave>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Recados — teaser ── */}
      {recursos.recados && (
        <section className={`bg-evt-blush-soft/40 ${QPD_PAD} ${QPD_RHYTHM}`}>
          <div className={`${QPD_WRAP_TXT} flex flex-col items-center`}>
            <CabecalhoPrincesa
              eyebrow="Recados"
              titulo="Deixe seu carinho"
              intro={t.teaserRecados}
            />
            <Reveal delay={140} className="mt-9">
              <BotaoSuave href="/recados">Escrever um recado</BotaoSuave>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── RSVP — chamado principal ── */}
      {recursos.rsvp && (
        <section className={`relative overflow-hidden bg-transparent ${QPD_PAD} ${QPD_RHYTHM}`}>
          <PetalasFundo />
          <Reveal className={`relative ${QPD_WRAP} flex flex-col items-center gap-7 text-center`}>
            <Filigrana />
            <p className="max-w-[18ch] font-evt-script text-[clamp(2.2rem,7vw,3.2rem)] leading-[1.15] text-evt-rosa-ink">
              {t.ctaConvite}
            </p>
            <ConfirmCTA />
          </Reveal>
        </section>
      )}

      {/* ── Fecho — despedida em cursiva + linha do rodapé ── */}
      <section className={`bg-transparent ${QPD_PAD} pb-[clamp(3.5rem,8vw,5.5rem)] pt-[clamp(1rem,3vw,2rem)]`}>
        <Reveal className={`${QPD_WRAP} flex flex-col items-center gap-6 text-center`}>
          <Filigrana />
          <p className="max-w-[22ch] font-evt-script text-[clamp(2.1rem,6.5vw,3.2rem)] leading-[1.22] text-evt-rosa-ink">
            {t.fecho}
          </p>
          <p className="font-evt-util text-[0.62rem] uppercase tracking-[0.3em] text-evt-ink-soft">
            {evento.footerInfo}
          </p>
        </Reveal>
      </section>
    </main>
  );
}
