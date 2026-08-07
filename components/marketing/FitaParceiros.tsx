import type { CSSProperties } from "react";

/**
 * Fita de parceiros (cerimonialistas e casas de festa) — marquee infinito.
 *
 * ⚠️ REGRA: só entram aqui nomes que REALMENTE usam/autorizaram o seuconvite.
 * Citar empresa real que não é parceira é uso indevido de marca + publicidade
 * enganosa. Enquanto a lista real não chega, a fita roda no modo "vagas
 * abertas" — que também converte (chama parceiro) e não afirma nada falso.
 *
 * Para ligar a fita de verdade: preencha PARCEIROS com os nomes autorizados
 * (e as cidades) e troque MODO para "reais". Nada mais precisa mudar.
 */

type Modo = "reais" | "vagas";

const MODO: Modo = "vagas";

/** Parceiros de verdade (nome + cidade). Preencher quando autorizarem. */
const PARCEIROS: { nome: string; cidade: string }[] = [
  // { nome: "Esplendor Hall", cidade: "Brasília" },
  // { nome: "Cerimonial X", cidade: "Goiânia" },
];

const VAGAS = [
  "Seu espaço aqui",
  "Sua assessoria aqui",
  "Seu buffet aqui",
  "Seu cerimonial aqui",
  "Sua casa de festas aqui",
];

export function FitaParceiros() {
  const itens =
    MODO === "reais" && PARCEIROS.length
      ? PARCEIROS.map((p) => ({ forte: p.nome, fraco: p.cidade, vaga: false }))
      : VAGAS.map((v) => ({ forte: v, fraco: "", vaga: true }));

  // duplica a trilha para o loop ficar contínuo
  const trilha = [...itens, ...itens, ...itens, ...itens];

  return (
    <section className="fita" aria-label="Parceiros">
      <div className="fita-in">
        <span className="fita-label" data-rv="">
          {MODO === "reais"
            ? "Aprovado por quem faz festa acontecer"
            : "Parcerias abertas para espaços e cerimonialistas"}
        </span>

        <div className="fita-trilho" aria-hidden>
          <div className="fita-track">
            {trilha.map((it, i) => (
              <span key={i} className={it.vaga ? "fita-item vaga" : "fita-item"} style={{ "--i": i } as CSSProperties}>
                <span className="pt" />
                <b>{it.forte}</b>
                {it.fraco ? <i>{it.fraco}</i> : null}
              </span>
            ))}
          </div>
        </div>

        {MODO === "vagas" ? (
          <a className="fita-cta" href="mailto:sac@seuconviteia.com?subject=Quero%20ser%20parceiro%20do%20seuconvite">
            Quero ser parceiro
          </a>
        ) : null}
      </div>
    </section>
  );
}
