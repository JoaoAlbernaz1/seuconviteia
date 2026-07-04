// /presentes — Casamento · Editorial Moderno. Corpo PROPRIO: materia de abertura
// (kicker + titulo display + texto) a esquerda; lista de presentes MINIMALISTA
// (linhas com filete, sem cartoes) + bloco de Pix proprio a direita. Data-driven;
// se nao houver itens nem Pix, mostra um fecho elegante.
import type { PaginaTemplateProps } from "@/components/templates/registro";
import { Reveal } from "@/components/evt/Reveal";

import { CemPix } from "./Pix";
import { CEM_SHELL, CEM_TOP, CEM_BLOCK, CemKicker, CemHeading } from "./_ui";

const TEXTO_PADRAO =
  "O maior presente é ter você com a gente nesse dia. Mas, se quiser deixar um carinho a mais, reunimos algumas ideias — e a chave Pix está logo abaixo.";

export function PresentesCasamentoEditorial({ evento }: PaginaTemplateProps) {
  const itens = evento.presentes;
  const temPix = !!(evento.pixChave || evento.pixQrUrl);
  const temConteudo = itens.length > 0 || temPix;

  return (
    <main className={`bg-transparent ${CEM_TOP} ${CEM_BLOCK}`}>
      <div className={CEM_SHELL}>
        <div className="grid items-start gap-[clamp(2.5rem,6vw,5rem)] md:grid-cols-[0.88fr_1.12fr]">
          {/* ── Materia de abertura ── */}
          <Reveal className="md:sticky md:top-[clamp(6rem,10vw,8rem)]">
            <CemKicker>Lista de presentes</CemKicker>
            <CemHeading as="h1" className="mt-6 max-w-[11ch]">
              Sua presença é o presente
            </CemHeading>
            <p className="mt-8 max-w-[40ch] font-evt-body text-[clamp(1.1rem,1.6vw,1.3rem)] leading-relaxed text-evt-ink-soft">
              {evento.presentesTexto ?? TEXTO_PADRAO}
            </p>
          </Reveal>

          {/* ── Lista minimalista + Pix ── */}
          <Reveal delay={140}>
            {itens.length > 0 && (
              <ul className="border-t border-[var(--line)]">
                {itens.map((item, i) => (
                  <li
                    key={`${item.titulo}-${i}`}
                    className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1.5 border-b border-[var(--line)] py-[clamp(1.25rem,3vw,1.75rem)]"
                  >
                    <p className="font-evt-body text-[clamp(1.2rem,1.8vw,1.42rem)] leading-snug text-evt-ink">
                      {item.titulo}
                    </p>
                    {item.valorLabel && (
                      <p className="whitespace-nowrap font-evt-util text-[0.8rem] font-medium uppercase tracking-[0.12em] text-evt-rosa-ink">
                        {item.valorLabel}
                      </p>
                    )}
                    {item.descricao && (
                      <p className="col-span-2 max-w-[52ch] font-evt-body text-[1rem] leading-relaxed text-evt-ink-soft">
                        {item.descricao}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {temPix && (
              <div className={itens.length > 0 ? "mt-[clamp(2.5rem,6vw,3.5rem)]" : ""}>
                <CemPix chave={evento.pixChave} nome={evento.pixNome} qrUrl={evento.pixQrUrl} />
              </div>
            )}

            {!temConteudo && (
              <p className="border-t border-[var(--line)] pt-[clamp(1.75rem,4vw,2.5rem)] font-evt-body text-[1.1rem] italic leading-relaxed text-evt-ink-soft">
                Em breve, alguns detalhes por aqui. Por enquanto, o presente é a sua
                presença.
              </p>
            )}
          </Reveal>
        </div>
      </div>
    </main>
  );
}
