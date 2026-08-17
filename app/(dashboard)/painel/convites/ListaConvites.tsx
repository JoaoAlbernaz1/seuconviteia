"use client";

// Grade de "Meus convites" com MODO DE SELEÇÃO para apagar vários de uma vez.
// Fora do modo: cards normais (Editar / Ver). No modo seleção: cada card vira um
// alvo (checkbox na capa), e uma barra flutuante mostra quantos e o botão de
// excluir — com confirmação em DOIS toques (mesmo padrão do resto do painel,
// sem dialog do navegador). A exclusão em lote roda em `excluirEventos`.
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ic, IC } from "../_shell/Ic";
import { CapaEvento } from "../_ui/CapaEvento";
import { excluirEventos } from "../acoes";

export type ItemConvite = {
  id: string;
  title: string;
  publicado: boolean;
  kicker: string;
  fotoUrl?: string;
  tema?: string;
  fontes?: string;
  local?: string;
  url: string;
  dataLabel: string;
};

export function ListaConvites({ items }: { items: ItemConvite[] }) {
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
          <p className="mt-1.5 text-[14.5px] text-[#6e6e76]">
            Veja, edite e publique todos os seus convites em um só lugar.
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
                <Link
                  href="/painel/criar"
                  className="flex items-center gap-2.5 rounded-[13px] bg-[#7C3AED] px-[22px] py-3 text-[14.5px] font-semibold !text-white transition-colors hover:bg-[#6D28D9]"
                >
                  <Ic d={IC.plus} size={15} stroke="#fff" width={2} />
                  Novo convite
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((ev) => {
          const marcado = sel.has(ev.id);
          const capa = (
            <div className="relative">
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
              <span
                className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm ${
                  ev.publicado ? "bg-[#34A177]/90 text-white" : "bg-white/90 text-[#7C3AED]"
                }`}
              >
                {ev.publicado ? "Publicado" : "Em criação"}
              </span>
            </div>
          );

          const infos = (
            <div className="flex flex-1 flex-col p-5">
              <div className="text-[16px] font-bold tracking-[-0.01em]">{ev.title}</div>
              <div className="mt-1 line-clamp-2 text-[13px] text-[#6e6e76]">
                {ev.local ? `${ev.local} · ` : ""}
                {ev.dataLabel}
              </div>

              {!modo && (
                <div className="mt-4 flex items-center gap-2.5 pt-1">
                  {/* Abre o editor em 6 passos — o mesmo que criou o convite.
                      Antes caía em `/painel/<id>` (a visão geral), que é outra
                      tela; o ícone de lápis já prometia edição. Convidados,
                      Presentes e Recebimentos seguem na barra lateral, e a
                      exclusão continua no menu "⋯" do convite. */}
                  <Link
                    href={`/painel/criar?id=${ev.id}`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-[11px] bg-[#7C3AED] px-4 py-2.5 text-[13.5px] font-semibold !text-white transition-colors hover:bg-[#6D28D9]"
                  >
                    <Ic d={IC.edit} size={14} stroke="#fff" width={2} />
                    Gerenciar
                  </Link>
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-[11px] border border-[#ececf0] bg-white px-4 py-2.5 text-[13.5px] font-semibold text-[#17171b] transition-colors hover:bg-[#f4f4f6]"
                  >
                    <Ic d={IC.eye} size={14} stroke="#17171b" />
                    Ver
                  </a>
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
