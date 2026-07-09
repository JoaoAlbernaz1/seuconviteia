"use client";

import { useState } from "react";

type Plano = {
  nome: string;
  preco: string; // valor sem "R$ "
  unidade: string; // ex.: " pagamento único" | "/mês"
  desc: string;
  itens: string[];
  cta: string;
  feat?: boolean;
  pop?: string;
};

/**
 * Planos com toggle Mensal/Anual (port 1:1 do artifact).
 * Anual: Assinatura R$27, Cerimonialista R$69 (+ "/mês no plano anual").
 * Mensal: R$39 e R$99 (+ "/mês"). "Convite único" é fixo (pagamento único).
 * NOTA: os valores mensais (39/99) vieram da referência do dono — confirmar.
 */
export function Planos({ cadastroHref }: { cadastroHref: string }) {
  const [anual, setAnual] = useState(true);
  const sufixo = anual ? " no plano anual" : "";

  const planos: Plano[] = [
    {
      nome: "Convite único",
      preco: "47",
      unidade: " pagamento único",
      desc: "Para quem tem um único evento e quer resolver logo.",
      itens: [
        "1 convite digital com link exclusivo",
        "RSVP com lista de confirmados",
        "Ativo por 6 meses",
        "Edições ilimitadas até o evento",
      ],
      cta: "Criar meu convite",
    },
    {
      nome: "Assinatura",
      preco: anual ? "27" : "39",
      unidade: `/mês${sufixo}`,
      desc: "Para quem vive convidando: aniversários, chás, festas da família toda.",
      itens: [
        "Convites ilimitados",
        "Todos os modelos e estilos",
        "RSVP + lembretes automáticos no WhatsApp",
        "Página do evento com fotos e mapa",
      ],
      cta: "Assinar agora",
      feat: true,
      pop: "Mais popular",
    },
    {
      nome: "Cerimonialista",
      preco: anual ? "69" : "99",
      unidade: `/mês${sufixo}`,
      desc: "Para profissionais que gerenciam eventos de vários clientes.",
      itens: [
        "Tudo da Assinatura",
        "Painel com todos os eventos e clientes",
        "Sua marca no convite (white label)",
        "Exportação da lista de convidados",
      ],
      cta: "Testar 7 dias grátis",
    },
  ];

  return (
    <>
      <div className="toggle-row">
        <div className="toggle" role="group" aria-label="Periodicidade do plano">
          <button type="button" data-active={!anual} aria-pressed={!anual} onClick={() => setAnual(false)}>
            Mensal
          </button>
          <button type="button" data-active={anual} aria-pressed={anual} onClick={() => setAnual(true)}>
            Anual <span className="save">-30%</span>
          </button>
        </div>
      </div>

      <div className="plans">
        {planos.map((p) => (
          <div key={p.nome} className={`plan${p.feat ? " feat" : ""}`}>
            {p.pop ? <div className="pop">{p.pop}</div> : null}
            <div className="pname">{p.nome}</div>
            <div className="price">
              <span className="v disp">R$ {p.preco}</span>
              <span className="u">{p.unidade}</span>
            </div>
            <p className="pdesc">{p.desc}</p>
            <div className="feats">
              {p.itens.map((it) => (
                <div key={it}>
                  <span className="ck">✓</span>
                  {it}
                </div>
              ))}
            </div>
            <a href={cadastroHref} className={`btn block pcta ${p.feat ? "accent" : "soft"}`}>
              {p.cta}
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
