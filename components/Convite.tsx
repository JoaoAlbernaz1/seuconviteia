import type { CSSProperties, ReactNode } from "react";
import type { ConviteConteudo } from "@/lib/convite";
import type { SecoesPlano } from "@/lib/plans";

// Suite de convite editorial (tema claro, marfim) — Server Component, sem JS.
// Todo o tema deriva de --accent (conteudo.accent); cada secao some sozinha
// quando seus dados estao vazios. Revelacoes sao CSS-only e respeitam
// prefers-reduced-motion (ver o bloco `.cv` em app/globals.css).

type Marca = { brandName?: string; name: string };

type ConviteProps = {
  conteudo: ConviteConteudo;
  gating: SecoesPlano;
  whiteLabel: boolean;
  marca: Marca;
};

// pequeno helper p/ stagger das revelacoes (delay inline).
const delay = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

export function Convite({ conteudo, gating, whiteLabel, marca }: ConviteProps) {
  const {
    titulo,
    nichoLabel,
    dataLabel,
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

  const temFoto = Boolean(fotoUrl);

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

  // Atribuicao: white-label (PREMIUM) credita o profissional; senao, a plataforma.
  const creditaProfissional = whiteLabel && gating.semMarcaPlataforma;

  return (
    <div className="cv" style={{ ["--accent" as string]: accent } as CSSProperties}>
      {/* moldura impressa do convite (keyline) */}
      <div className="cv-frameline" aria-hidden />

      {/* ——— CAPA / HERO ——— */}
      <header className="cv-shell">
        <div className={`cv-hero${temFoto ? "" : " cv-hero--solo"}`}>
          <div className="cv-hero-text">
            <p className="cv-label cv-reveal" style={delay(0.05)}>
              {nichoLabel}
            </p>
            <h1 className="cv-name cv-reveal" style={delay(0.12)}>
              {titulo}
            </h1>
            <span className="cv-tick cv-reveal" style={delay(0.24)} aria-hidden />
            {dataLabel && (
              <p className="cv-date cv-reveal" style={delay(0.3)}>
                {dataLabel}
              </p>
            )}
            {local && (
              <p className="cv-when cv-reveal" style={delay(0.36)}>
                {local}
              </p>
            )}
          </div>

          {temFoto && (
            <figure className="cv-hero-photo cv-reveal" style={delay(0.18)}>
              <div className="cv-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fotoUrl} alt={titulo} />
              </div>
            </figure>
          )}
        </div>
      </header>

      {/* ——— MENSAGEM / CONVITE ——— */}
      {mensagem && (
        <section className="cv-shell cv-section">
          <div className="cv-message cv-reveal">
            <Ornament center />
            <p>{mensagem}</p>
          </div>
        </section>
      )}

      {/* ——— EVENTO ——— */}
      {temEvento && (
        <section className="cv-shell cv-section">
          <div className="cv-reveal">
            <p className="cv-label">A celebração</p>
            <h2 className="cv-h2">Onde &amp; quando</h2>
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
        </section>
      )}

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
          <div className="cv-reveal">
            <p className="cv-label cv-label--center">Álbum</p>
            <h2 className="cv-h2 cv-album-h">Momentos</h2>
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
        <div className="cv-reveal">
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
