"use client";

// Grade de "Meus convites" com MODO DE SELEÇÃO para apagar vários de uma vez.
// Fora do modo: cards normais (Gerenciar / Ver). No modo seleção: cada card vira
// um alvo (checkbox na capa), e uma barra flutuante mostra quantos e o botão de
// excluir — com confirmação em DOIS toques (mesmo padrão do resto do painel,
// sem dialog do navegador). A exclusão em lote roda em `excluirEventos`.
//
// O CARD NÃO PROMETE EDIÇÃO. Publicou, fecha (ver `lib/edicao`), então o botão
// de lápis saiu: ele oferecia num toque o que o servidor recusa. O que entrou no
// lugar foi a verdade em dois níveis — o ESTADO do convite (um selo colorido,
// sempre com a palavra junto) e, abaixo dele, se a edição está aberta ou fechada
// (selo neutro, de apoio). São duas informações diferentes: um site pode estar
// no ar e fechado para mexer, e é justamente esse o caso normal.
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ic, IC } from "../_shell/Ic";
import { CapaEvento } from "../_ui/CapaEvento";
import { PILL_ATENCAO, PILL_NEUTRO, SELO_ESTADO } from "../_ui/estilos";
import type { EstadoConvite } from "@/lib/estadoConvite";
import { excluirEventos } from "../acoes";

// O tipo dos estados e o mapa de selos moram fora deste arquivo (`lib/
// estadoConvite` e `_ui/estilos`): a tela do convite mostra os MESMOS quatro
// estados, e enquanto cada tela tinha o seu mapa elas divergiam na palavra.
export type { EstadoConvite };

export type ItemConvite = {
  id: string;
  title: string;
  estado: EstadoConvite;
  /** A janela de edição do site está aberta agora (cortesia, plano ou passe). */
  edicaoLiberada: boolean;
  kicker: string;
  fotoUrl?: string;
  tema?: string;
  fontes?: string;
  local?: string;
  url: string;
  dataLabel: string;
};

export function ListaConvites({ items, podeCriar = true }: { items: ItemConvite[]; podeCriar?: boolean }) {
  const router = useRouter();
  const [modo, setModo] = useState(false); // modo seleção ligado?
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, iniciar] = useTransition();

  const total = items.length;
  const nSel = sel.size;
  const todosMarcados = nSel > 0 && nSel === total;

  function sair() {
    setModo(false);
    setSel(new Set());
    setConfirmando(false);
  }

  function toggle(id: string) {
    setConfirmando(false);
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function marcarTodos() {
    setConfirmando(false);
    setSel(todosMarcados ? new Set() : new Set(items.map((i) => i.id)));
  }

  function excluir() {
    if (nSel === 0) return;
    if (!confirmando) {
      setConfirmando(true);
      return;
    }
    const ids = Array.from(sel);
    iniciar(async () => {
      await excluirEventos(ids);
      sair();
      router.refresh();
    });
  }

  return (
    <div className="dash-fade mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-10 sm:py-9">
      {/* HEADER */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[27px] font-bold tracking-[-0.025em]">Meus convites</h1>
          {/* A linha antiga prometia "edite" — o que esta tela nao faz mais. */}
          <p className="mt-1.5 text-[14.5px] text-[#6e6e76]">
            Acompanhe seus convites e continue os rascunhos.
          </p>
        </div>

        {total > 0 && (
          <div className="flex items-center gap-2.5">
            {modo ? (
              <>
                <button
                  onClick={marcarTodos}
                  className="rounded-[13px] border border-[#ececf0] bg-white px-[18px] py-3 text-[14px] font-semibold text-[#17171b] transition-colors hover:bg-[#f4f4f6]"
                >
                  {todosMarcados ? "Limpar seleção" : "Selecionar todos"}
                </button>
                <button
                  onClick={sair}
                  className="rounded-[13px] px-[16px] py-3 text-[14px] font-semibold text-[#6e6e76] transition-colors hover:bg-[#f4f4f6]"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setModo(true)}
                  className="flex items-center gap-2 rounded-[13px] border border-[#ececf0] bg-white px-[18px] py-3 text-[14px] font-semibold text-[#17171b] transition-colors hover:bg-[#f4f4f6]"
                >
                  <Ic d={IC.check} size={15} stroke="#17171b" width={2.2} />
                  Selecionar
                </button>
                {/* Sem vaga no plano o botao nao some — ele DIZ o que falta.
                    Sumir deixaria a pessoa procurando onde clicar. */}
                <Link
                  href={podeCriar ? "/painel/criar" : "/painel/plano"}
                  className="flex items-center gap-2.5 rounded-[13px] bg-[#7C3AED] px-[22px] py-3 text-[14.5px] font-semibold !text-white transition-colors hover:bg-[#6D28D9]"
                >
                  <Ic d={podeCriar ? IC.plus : IC.lock} size={15} stroke="#fff" width={2} />
                  {podeCriar ? "Novo convite" : "Mais convites"}
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((ev) => {
          const marcado = sel.has(ev.id);
          const selo = SELO_ESTADO[ev.estado];
          const rascunho = ev.estado === "rascunho";
          // Festa encerrada nao mostra selo de edicao: ela nunca reabre, e
          // "Edicao fechada" sem porta para abrir e so mais uma negativa.
          const mostraEdicao = ev.estado === "no-ar" || ev.estado === "fora-do-ar";

          const capa = (
            <div className="relative">
              {/* A capa ficou LIMPA: o selo de estado desceu para junto do nome,
                  onde o fundo e branco. Sobre foto, o verde translucido do "No
                  ar" dependia da sorte da imagem para ser legivel. */}
              <CapaEvento
                tema={ev.tema}
                fontes={ev.fontes}
                nome={ev.title}
                kicker={ev.kicker}
                fotoUrl={ev.fotoUrl}
                altura={150}
              />
              {modo && (
                <span
                  className={`absolute left-3 top-3 grid size-7 place-items-center rounded-full border-2 transition-colors ${
                    marcado
                      ? "border-[#7C3AED] bg-[#7C3AED]"
                      : "border-white/90 bg-black/25 backdrop-blur-sm"
                  }`}
                >
                  {marcado && <Ic d={IC.check} size={15} stroke="#fff" width={3} />}
                </span>
              )}
            </div>
          );

          const infos = (
            <div className="flex flex-1 flex-col p-5">
              <div className="text-[16px] font-bold tracking-[-0.01em]">{ev.title}</div>
              <div className="mt-1 line-clamp-2 text-[13px] text-[#6e6e76]">
                {ev.local ? `${ev.local} · ` : ""}
                {ev.dataLabel}
              </div>

              {/* DOIS NIVEIS na mesma linha: o estado do convite (colorido) e,
                  depois dele, o que da para mexer (neutro). A ordem e a
                  hierarquia — o que vem primeiro e o que manda. */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`${selo.cls} inline-flex items-center gap-1.5`}>
                  {selo.ponto ? <span className="size-1.5 rounded-full bg-current" /> : null}
                  {selo.icone ? <i className={`bi ${selo.icone}`} aria-hidden /> : null}
                  {selo.texto}
                </span>
                {mostraEdicao ? (
                  ev.edicaoLiberada ? (
                    <span className={`${PILL_ATENCAO} inline-flex items-center gap-1.5`}>
                      <i className="bi bi-unlock" aria-hidden /> Edição aberta
                    </span>
                  ) : (
                    <span className={`${PILL_NEUTRO} inline-flex items-center gap-1.5`}>
                      <i className="bi bi-lock" aria-hidden /> Edição fechada
                    </span>
                  )
                ) : null}
              </div>

              {!modo && (
                /* SEM `mt-auto`. Colar a acao no rodape alinhava a base dos
                   cards, mas ao custo de desalinhar os BOTOES: o card sem o link
                   (rascunho, festa encerrada) empurrava o proprio botao ~44px
                   para baixo do botao do vizinho, e a folga no meio lia como
                   buraco. Sem ele, os botoes da fileira batem — o que sobra vai
                   para o rodape do card, onde le como respiro.
                   A outra saida seria reservar a linha do link em TODOS os
                   cards; com 26 rascunhos na conta real, seria espaco morto na
                   maioria deles. */
                <div className="pt-4">
                  <div className="flex items-center gap-2.5">
                    {/* GERENCIAR = a tela do convite (`/painel/<id>`): quem
                        confirmou, os recados, o que entrou de presente. Nao e o
                        editor — e por isso o lapis saiu daqui. Ele oferecia num
                        toque o que o servidor recusa depois de publicar; quem
                        precisa mesmo mexer no site tem o link discreto abaixo.
                        No rascunho ainda nao ha o que gerenciar: o botao leva ao
                        editor, que e onde ele vira site publicado. */}
                    <Link
                      href={rascunho ? `/painel/criar?id=${ev.id}` : `/painel/${ev.id}`}
                      aria-label={
                        rascunho ? `Continuar ${ev.title}` : `Gerenciar ${ev.title}`
                      }
                      className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[11px] bg-[#7C3AED] px-4 py-2.5 text-[13.5px] font-semibold !text-white transition-colors hover:bg-[#6D28D9]"
                    >
                      <Ic
                        d={rascunho ? IC.chevronRight : IC.grid}
                        size={14}
                        stroke="#fff"
                        width={2}
                      />
                      {rascunho ? "Continuar" : "Gerenciar"}
                    </Link>
                    {/* "Ver" abre o site publico — que so existe depois de
                        publicar. No rascunho ele fica de fora. Fora do ar ele
                        FICA: e assim que o dono confere o que o convidado ve. */}
                    {!rascunho && (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Ver o site de ${ev.title} (abre em outra aba)`}
                        className="flex min-h-[44px] items-center justify-center gap-2 rounded-[11px] border border-[#ececf0] bg-white px-4 py-2.5 text-[13.5px] font-semibold !text-[#17171b] transition-colors hover:bg-[#f4f4f6]"
                      >
                        <Ic d={IC.eye} size={14} stroke="#17171b" />
                        Ver
                      </a>
                    )}
                  </div>

                  {/* A saida para quem precisa mexer no site. Discreta de
                      proposito: e o caminho da excecao, nao o do dia a dia — e
                      com a janela ja aberta ela vira o atalho direto para o
                      editor, porque ai nao ha nada a liberar (a tela de liberar
                      redireciona para la de qualquer jeito).
                      Sublinhado FIXO, nao no hover: desde que o lapis saiu, esta
                      e a unica porta de edicao da tela, e no celular nao existe
                      hover — cinza de 12,5px sem sublinhado lia como legenda do
                      card, nao como link. "Discreto" nao e "invisivel".
                      O rotulo e o MESMO da tela do convite ("Liberar edicao"),
                      que e o titulo do destino: com "Precisa mudar algo no
                      site?" aqui, a mesma porta tinha dois nomes e parecia
                      levar a lugares diferentes. Pergunta tambem nao diz o que
                      acontece depois do clique.
                      `!text-` E `!underline` porque `.dash :where(a…)` declara
                      `color` e `text-decoration: none` FORA das @layer do
                      Tailwind v4 — e regra sem camada vence utility com camada,
                      qualquer que seja a especificidade. Sem o `!`, o
                      sublinhado sai do JSX e nao chega na tela (conferido no
                      `getComputedStyle`, nao no olho). */}
                  {mostraEdicao ? (
                    <Link
                      href={
                        ev.edicaoLiberada
                          ? `/painel/criar?id=${ev.id}`
                          : `/painel/${ev.id}/liberar`
                      }
                      className="-mb-2 inline-flex min-h-[44px] items-center text-[12.5px] !text-scv-muted !underline underline-offset-4 transition-colors hover:!text-scv-ink"
                    >
                      {ev.edicaoLiberada ? "Editar o site agora" : "Liberar edição"}
                    </Link>
                  ) : null}
                </div>
              )}
            </div>
          );

          const cardCls =
            "flex flex-col overflow-hidden rounded-[20px] border bg-white shadow-[0_2px_10px_rgba(23,23,27,0.04)] transition-all";

          // No modo seleção o card inteiro é um botão que marca/desmarca.
          if (modo) {
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => toggle(ev.id)}
                aria-pressed={marcado}
                className={`${cardCls} cursor-pointer text-left ${
                  marcado
                    ? "border-[#7C3AED] ring-2 ring-[#7C3AED]/25"
                    : "border-[#ececf0] hover:border-[#DCCDFB]"
                }`}
              >
                {capa}
                {infos}
              </button>
            );
          }

          return (
            <div
              key={ev.id}
              className={`${cardCls} border-[#ececf0] hover:-translate-y-0.5 hover:border-[#DCCDFB] hover:shadow-[0_12px_28px_rgba(124,58,237,0.10)]`}
            >
              {capa}
              {infos}
            </div>
          );
        })}
      </div>

      {/* BARRA FLUTUANTE de exclusão (só no modo seleção, com algo marcado) */}
      {modo && nSel > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
          <div className="dash-fade flex flex-wrap items-center gap-3 rounded-2xl border border-[#ececf0] bg-white px-4 py-3 shadow-[0_16px_40px_rgba(23,23,27,0.18)]">
            <span className="pl-1 text-[14px] font-semibold text-[#17171b]">
              {nSel} selecionado{nSel === 1 ? "" : "s"}
            </span>
            {confirmando ? (
              <>
                <span className="hidden text-[13px] text-[#6e6e76] sm:inline">
                  Apagar de vez? Não tem volta.
                </span>
                <button
                  onClick={excluir}
                  disabled={apagando}
                  className="flex items-center gap-2 rounded-xl bg-[#d9376e] px-4 py-2.5 text-[13.5px] font-semibold !text-white transition-colors hover:bg-[#c22b60] disabled:opacity-60"
                >
                  <Ic d={IC.trash} size={15} stroke="#fff" width={2} />
                  {apagando ? "Apagando…" : `Confirmar exclusão (${nSel})`}
                </button>
                <button
                  onClick={() => setConfirmando(false)}
                  disabled={apagando}
                  className="rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-[#6e6e76] transition-colors hover:bg-[#f4f4f6] disabled:opacity-60"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={excluir}
                className="flex items-center gap-2 rounded-xl bg-[#fdf0f5] px-4 py-2.5 text-[13.5px] font-semibold text-[#d9376e] transition-colors hover:bg-[#fbe3ec]"
              >
                <Ic d={IC.trash} size={15} stroke="#d9376e" width={2} />
                Excluir selecionados
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
