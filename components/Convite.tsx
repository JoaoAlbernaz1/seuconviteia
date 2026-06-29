import type { CSSProperties, ReactNode } from "react";
import type { ConviteConteudo } from "@/lib/convite";
import type { SecoesPlano } from "@/lib/plans";
import { Atmosphere } from "@/components/event/Atmosphere";
import { CoverCinematic } from "@/components/event/CoverCinematic";
import { Countdown } from "@/components/event/Countdown";
import { RsvpForm } from "@/components/event/RsvpForm";

// Site publico do evento — replica a estetica cinematografica do
// festa-15-maria-clara (capa escura + Ken Burns + particulas), porem TEMATIZAVEL
// pela cor de cada evento (`--accent`) e multi-nicho. A capa e dark; o corpo e
// editorial claro flutuando sobre a atmosfera. Cada secao some se vazia.
// Movimento CSS-only, respeita prefers-reduced-motion (ver `.cv` em globals.css).

type Marca = { brandName?: string; name: string };

type ConviteProps = {
  conteudo: ConviteConteudo;
  gating: SecoesPlano;
  whiteLabel: boolean;
  marca: Marca;
  /** Id do evento — alvo do RSVP (server action). */
  eventId: string;
};

const delay = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

export function Convite({
  conteudo,
  gating,
  whiteLabel,
  marca,
  eventId,
}: ConviteProps) {
  const {
    titulo,
    nichoLabel,
    dataLabel,
    dataISO,
    accent,
    mensagem,
    local,
    endereco,
    mapsUrl,
    traje,
    programacao,
    fotoUrl,
    fotos,
    pixNome,
    pixChave,
    presentes,
  } = conteudo;

  // Fatos do evento (cada um some se vazio).
  const fatos: { lbl: string; val: ReactNode }[] = [];
  if (dataLabel) fatos.push({ lbl: "Data", val: dataLabel });
  if (local) fatos.push({ lbl: "Local", val: local });
  if (endereco)
    fatos.push({
      lbl: "Endereço",
      val: mapsUrl ? (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
          {endereco}
        </a>
      ) : (
        endereco
      ),
    });
  if (traje) fatos.push({ lbl: "Traje", val: traje });

  const temEvento = fatos.length > 0 || programacao.length > 0;
  const temPresentes = Boolean(pixChave || pixNome || presentes.length > 0);
  const temAlbum = gating.album && fotos.length > 0;
  const creditaProfissional = whiteLabel && gating.semMarcaPlataforma;

  return (
    <div className="cv" style={{ ["--accent" as string]: accent } as CSSProperties}>
      <Atmosphere accent={accent} />

      {/* ——— CAPA CINEMATOGRÁFICA ——— */}
      <CoverCinematic
        titulo={titulo}
        nichoLabel={nichoLabel}
        dataLabel={dataLabel}
        accent={accent}
        fotoUrl={fotoUrl}
      />

      {/* ——— MENSAGEM / CONVITE ——— */}
      {mensagem && (
        <section className="cv-shell cv-section">
          <div className="cv-message cv-reveal">
            <Ornament center />
            <p>{mensagem}</p>
          </div>
        </section>
      )}

      {/* ——— EVENTO + CONTAGEM ——— */}
      {temEvento && (
        <section className="cv-shell cv-section">
          <div className="cv-reveal cv-center">
            <p className="cv-label cv-label--center">A celebração</p>
            <h2 className="cv-h2">Quando &amp; onde</h2>
          </div>

          <div className="cv-event-grid">
            {fatos.length > 0 && (
              <dl className="cv-facts cv-reveal" style={delay(0.08)}>
                {fatos.map((f) => (
                  <div className="cv-fact" key={f.lbl}>
                    <dt className="lbl">{f.lbl}</dt>
                    <dd className="val">{f.val}</dd>
                  </div>
                ))}
              </dl>
            )}

            {programacao.length > 0 && (
              <div className="cv-tl cv-reveal" style={delay(0.16)}>
                <p className="cv-label cv-tl-head">Programação</p>
                <ol className="cv-tl-list">
                  {programacao.map((p, i) => (
                    <li className="cv-tl-item" key={`${p.hora}-${i}`}>
                      <span className="cv-tl-time">{p.hora}</span>
                      <span className="cv-tl-title">{p.titulo}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="cv-countdown cv-reveal" style={delay(0.22)}>
            <p className="cv-label cv-label--center">A contagem já começou</p>
            <Countdown alvoISO={dataISO} />
          </div>
        </section>
      )}

      {/* ——— CONFIRMAR PRESENÇA (RSVP) ——— */}
      <section className="cv-shell cv-section" id="confirmar">
        <div className="cv-rsvp cv-reveal">
          <div className="cv-center">
            <Ornament center />
            <p className="cv-label cv-label--center">Confirmação</p>
            <h2 className="cv-h2">Você vem?</h2>
            <p className="cv-rsvp-lead">
              Sua presença é o que vai tornar essa noite inesquecível. Conte pra
              gente até logo.
            </p>
          </div>
          <RsvpForm eventId={eventId} />
        </div>
      </section>

      {/* ——— PRESENTES ——— */}
      {temPresentes && (
        <section className="cv-shell cv-section">
          <div className="cv-gift cv-reveal">
            <Ornament center />
            <p className="cv-label cv-label--center">Presentes</p>
            <p className="cv-gift-text">
              Sua presença já é o nosso maior presente. Mas, se desejar
              presentear, deixamos com carinho as opções abaixo.
            </p>

            {(pixNome || pixChave) && (
              <div className="cv-pix">
                {pixNome && (
                  <>
                    <span className="cv-pix-tag">Em nome de</span>
                    <span className="cv-pix-nome">{pixNome}</span>
                  </>
                )}
                {pixChave && (
                  <>
                    <span className="cv-pix-tag">Chave Pix</span>
                    <span className="cv-pix-key">{pixChave}</span>
                  </>
                )}
              </div>
            )}

            {presentes.length > 0 && (
              <ul className="cv-gift-list">
                {presentes.map((g, i) => (
                  <li className="cv-gift-item" key={`${g.titulo}-${i}`}>
                    <span className="cv-gift-item-name">{g.titulo}</span>
                    {g.descricao && (
                      <span className="cv-gift-item-desc">{g.descricao}</span>
                    )}
                    {g.valorLabel && (
                      <span className="cv-gift-item-val">{g.valorLabel}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* ——— ÁLBUM ——— (só com plano que libera + fotos) */}
      {temAlbum && (
        <section className="cv-shell cv-section">
          <div className="cv-reveal cv-center">
            <p className="cv-label cv-label--center">Álbum</p>
            <h2 className="cv-h2">Momentos</h2>
          </div>
          <div className="cv-album-grid cv-reveal" style={delay(0.1)}>
            {fotos.map((src, i) => (
              <figure className="cv-album-cell" key={`${src}-${i}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${titulo} — foto ${i + 1}`} loading="lazy" />
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ——— RODAPÉ ——— */}
      <footer className="cv-shell cv-footer">
        <div className="cv-reveal cv-center">
          <Ornament center />
          <p className="cv-footer-name">{titulo}</p>
          <p className="cv-footer-close">Esperamos por você.</p>
          <p className="cv-attr">
            {creditaProfissional ? (
              <>Por {marca.brandName ?? marca.name}</>
            ) : (
              <>
                Feito com{" "}
                <span className="cv-attr-brand">seuconviteia.com</span>
              </>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}

function Ornament({ center }: { center?: boolean }) {
  return (
    <span className={`cv-orn${center ? " cv-orn--center" : ""}`} aria-hidden>
      <i />
    </span>
  );
}
