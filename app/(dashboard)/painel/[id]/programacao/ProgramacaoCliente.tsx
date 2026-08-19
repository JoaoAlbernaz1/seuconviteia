"use client";

// Tela "Programação" — mesma família visual do resto do editor (cartão com capa
// em gradiente + linhas compactas em timeline), mantendo a PRÉVIA AO VIVO da
// página /evento ao lado. As linhas viajam como colunas paralelas
// (`programacao_hora` / `programacao_titulo`); a gravação usa `salvarProgramacao`
// (retorna void -> `<form action>`), com o pending do botão via `useFormStatus`.
import Link from "next/link";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { salvarProgramacao } from "../../acoes";
import type { RascunhoPreview } from "@/lib/previewEvento";
import { programacaoSugerida } from "@/lib/sugestoes";
import { PreviewSite } from "../../_ui/PreviewSite";
import { BTN_PRIMARIO, BTN_VOLTAR, CARD, SUB, TITULO } from "../../_ui/estilos";
import { TopoCartao } from "../../_ui/TopoCartao";

type Linha = { id: number; hora: string; titulo: string };

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={BTN_PRIMARIO}>
      {pending ? "Salvando…" : "Salvar programação"}
    </button>
  );
}

export function ProgramacaoCliente({
  eventId,
  voltar,
  host,
  tipo,
  rascunhoBase,
  programacaoInicial,
}: {
  eventId: string;
  voltar: string;
  host: string;
  tipo: string;
  rascunhoBase: RascunhoPreview;
  programacaoInicial: { hora: string; titulo: string }[];
}) {
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    programacaoInicial.map((p, i) => ({ id: i, hora: p.hora, titulo: p.titulo })),
  );
  const proxId = useRef(programacaoInicial.length);

  function atualizar(id: number, patch: Partial<Linha>) {
    setLinhas((xs) => xs.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function remover(id: number) {
    setLinhas((xs) => (xs.length > 1 ? xs.filter((l) => l.id !== id) : xs));
  }
  function adicionar() {
    setLinhas((xs) => [...xs, { id: proxId.current++, hora: "", titulo: "" }]);
  }
  function sugerir() {
    setLinhas(
      programacaoSugerida(tipo).map((p) => ({ id: proxId.current++, hora: p.hora, titulo: p.titulo })),
    );
  }

  const nItens = linhas.filter((l) => l.titulo.trim()).length;
  const rascunhoJson = JSON.stringify({
    ...rascunhoBase,
    programacao: linhas.map((l) => ({ hora: l.hora, titulo: l.titulo })),
  });

  return (
    <div className="mx-auto w-full max-w-[1120px] scv-fade px-4 py-9 pb-24 sm:px-7">
      {/* CABEÇALHO */}
      <div className="flex flex-wrap items-center gap-3.5">
        <Link href={voltar} aria-label="Voltar" className={BTN_VOLTAR}>
          <i className="bi bi-chevron-left" aria-hidden />
        </Link>
        <div className="flex-1">
          <h1 className={TITULO}>Programação</h1>
          <p className={`mt-1 ${SUB}`}>A linha do tempo da festa, hora a hora.</p>
        </div>
      </div>

      <form action={salvarProgramacao} className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_0.82fr] lg:gap-7">
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="voltar" value={voltar} />

        {/* ESQUERDA — cartão com capa + timeline */}
        <div className={`${CARD} overflow-hidden`}>
          <TopoCartao
            icone="bi-clock-history"
            chapeu="Cronograma da festa"
            titulo={nItens > 0 ? `${nItens} momento${nItens === 1 ? "" : "s"}` : "Monte a linha do tempo"}
            acao={
              <button
                type="button"
                onClick={sugerir}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-scv-line bg-scv-card px-3 py-1.5 text-[12px] font-semibold text-scv-violet transition-colors duration-200 hover:border-scv-dash hover:bg-scv-field"
              >
                <i className="bi bi-stars" aria-hidden /> Sugerir
              </button>
            }
          />

          <div className="p-4">
            {/* timeline */}
            <div className="relative flex flex-col gap-2.5">
              {linhas.map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-[13px] border border-scv-line bg-scv-card p-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-scv-lilac text-scv-violet">
                    <i className="bi bi-clock text-[14px]" aria-hidden />
                  </span>
                  <input
                    name="programacao_hora"
                    value={l.hora}
                    onChange={(e) => atualizar(l.id, { hora: e.target.value })}
                    placeholder="20h30"
                    maxLength={20}
                    className="w-[84px] shrink-0 rounded-[10px] border border-scv-line bg-scv-field py-2 text-center text-[13.5px] font-semibold text-scv-ink outline-none transition focus:border-violeta"
                  />
                  <input
                    name="programacao_titulo"
                    value={l.titulo}
                    onChange={(e) => atualizar(l.id, { titulo: e.target.value })}
                    placeholder="Recepção dos convidados"
                    maxLength={140}
                    className="min-w-0 flex-1 bg-transparent text-[14px] text-scv-ink outline-none placeholder:text-scv-faint"
                  />
                  <button
                    type="button"
                    onClick={() => remover(l.id)}
                    disabled={linhas.length <= 1}
                    aria-label="Remover horário"
                    className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-scv-line text-scv-faint transition hover:border-scv-dash hover:text-red-600 disabled:opacity-40"
                  >
                    <i className="bi bi-trash text-[14px]" aria-hidden />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={adicionar}
              className="mt-3 w-full rounded-[12px] border border-dashed border-scv-dash py-2.5 text-[13px] font-semibold text-scv-muted transition hover:border-violeta hover:text-scv-violet"
            >
              <i className="bi bi-plus-lg mr-1" aria-hidden /> Adicionar horário
            </button>

            <div className="mt-5 flex items-center justify-end gap-3 border-t border-scv-line pt-4">
              <Link href={voltar} className="text-[13.5px] font-semibold text-scv-muted transition hover:text-scv-ink">
                Cancelar
              </Link>
              <BotaoSalvar />
            </div>
          </div>
        </div>

        {/* DIREITA — prévia ao vivo (mantida) */}
        <div className="lg:sticky lg:top-[84px]">
          <PreviewSite rascunhoJson={rascunhoJson} pagina="evento" host={host} rotulo="Como aparece no site" />
        </div>
      </form>
    </div>
  );
}
