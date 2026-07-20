"use client";

import { useState } from "react";

const ITEMS: { q: string; a: string }[] = [
  {
    q: "Preciso saber design para usar?",
    a: "Não. Você só responde algumas perguntas sobre o evento e a IA monta o convite inteiro: texto, cores, tipografia e layout. Se quiser mexer em algo, é só clicar e trocar.",
  },
  {
    q: "Como os convidados confirmam presença?",
    a: "Cada convidado recebe um link do convite. Ao abrir, ele toca em “Vou confirmar” e pronto — a confirmação aparece na sua lista em tempo real, sem planilha e sem grupo de WhatsApp.",
  },
  {
    q: "Qual a diferença para o Canva?",
    a: "No Canva você monta uma imagem estática, do zero, arrastando elementos. Aqui o convite nasce pronto, é interativo (link, mapa, fotos) e ainda coleta as confirmações de presença para você.",
  },
  {
    q: "Posso cancelar a assinatura quando quiser?",
    a: "Sim, direto no painel, sem multa e sem ligação. Os convites já publicados continuam no ar até a data dos eventos.",
  },
  {
    q: "Sou cerimonialista. Consigo usar para vários clientes?",
    a: "Sim. O plano Cerimonialista tem um painel com todos os seus eventos, lista de convidados exportável e opção de colocar a sua marca nos convites.",
  },
];

/** Acordeão de FAQ — abre um por vez (primeiro aberto por padrão). */
export function Faq({ id }: { id?: string }) {
  const [open, setOpen] = useState(0);

  return (
    <section className="sec faq" id={id}>
      <div className="sec-head">
        <h2 className="h2" data-rv="">Perguntas frequentes</h2>
      </div>
      <div className="faq-list" data-rv="">
        {ITEMS.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={it.q} className={`faq-item ${isOpen ? "open" : ""}`}>
              <button
                type="button"
                className="faq-q"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span>{it.q}</span>
                <span className="faq-chev" aria-hidden>{isOpen ? "–" : "+"}</span>
              </button>
              {isOpen ? <p className="faq-a">{it.a}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
