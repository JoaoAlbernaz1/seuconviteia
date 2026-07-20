"use client";

import { useState, type CSSProperties } from "react";

/**
 * Seção de preços da landing (réplica do design do Claude Design).
 * Toggle Mensal/Anual troca os valores da Assinatura (R$39/27) e do
 * Cerimonialista (R$99/69); o "Convite único" é pagamento único fixo.
 */
export function Pricing({ id, cadastroHref }: { id?: string; cadastroHref: string }) {
  const [anual, setAnual] = useState(true);

  const precoAssinatura = anual ? "27" : "39";
  const precoPro = anual ? "69" : "99";
  const sufixo = anual ? " no plano anual" : "";

  return (
    <section className="sec pricing" id={id}>
      <div className="sec-head">
        <h2 className="h2" data-rv="">Um preço para cada momento.</h2>
        <p className="lead" data-rv="">
          Vai convidar uma vez ou convida o ano inteiro? Tem plano para os dois.
        </p>
      </div>

      <div className="toggle" data-rv="" role="group" aria-label="Ciclo de cobrança">
        <button
          type="button"
          className={anual ? "" : "on"}
          aria-pressed={!anual}
          onClick={() => setAnual(false)}
        >
          Mensal
        </button>
        <button
          type="button"
          className={anual ? "on" : ""}
          aria-pressed={anual}
          onClick={() => setAnual(true)}
        >
          Anual <span className="save">-30%</span>
        </button>
      </div>

      <div className="plans">
        {/* Convite único */}
        <div className="plan" data-rv="">
          <div className="p-for">Convite único</div>
          <div className="p-price"><span className="v">R$ 47</span><span className="per"> pagamento único</span></div>
          <p className="p-desc">Para quem tem um único evento e quer resolver logo.</p>
          <ul className="p-list">
            <li><span className="ck">✓</span>1 convite digital com link exclusivo</li>
            <li><span className="ck">✓</span>RSVP com lista de confirmados</li>
            <li><span className="ck">✓</span>Ativo por 6 meses</li>
            <li><span className="ck">✓</span>Edições ilimitadas até o evento</li>
          </ul>
          <a className="btn soft block" href={cadastroHref}>Criar meu convite</a>
        </div>

        {/* Assinatura (destaque, escuro) */}
        <div className="plan hot" data-rv="" style={{ "--d": "70ms" } as CSSProperties}>
          <span className="p-badge">Mais popular</span>
          <div className="p-for">Assinatura</div>
          <div className="p-price">
            <span className="v">R$ {precoAssinatura}</span>
            <span className="per">/mês{sufixo}</span>
          </div>
          <p className="p-desc">Para quem vive convidando: aniversários, chás, festas da família toda.</p>
          <ul className="p-list">
            <li><span className="ck acc">✓</span>Convites ilimitados</li>
            <li><span className="ck acc">✓</span>Todos os modelos e estilos</li>
            <li><span className="ck acc">✓</span>RSVP + lembretes automáticos no WhatsApp</li>
            <li><span className="ck acc">✓</span>Página do evento com fotos e mapa</li>
          </ul>
          <a className="btn primary block" href={cadastroHref}>Assinar agora</a>
        </div>

        {/* Cerimonialista */}
        <div className="plan" data-rv="" style={{ "--d": "140ms" } as CSSProperties}>
          <div className="p-for">Cerimonialista</div>
          <div className="p-price">
            <span className="v">R$ {precoPro}</span>
            <span className="per">/mês{sufixo}</span>
          </div>
          <p className="p-desc">Para profissionais que gerenciam eventos de vários clientes.</p>
          <ul className="p-list">
            <li><span className="ck">✓</span>Tudo da Assinatura</li>
            <li><span className="ck">✓</span>Painel com todos os eventos e clientes</li>
            <li><span className="ck">✓</span>Sua marca no convite (white label)</li>
            <li><span className="ck">✓</span>Exportação da lista de convidados</li>
          </ul>
          <a className="btn soft block" href={cadastroHref}>Testar 7 dias grátis</a>
        </div>
      </div>
    </section>
  );
}
