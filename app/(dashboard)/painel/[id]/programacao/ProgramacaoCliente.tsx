"use client";

// Formulário "Programação" com prévia AO VIVO da página /evento. As linhas viajam
// como colunas paralelas (`programacao_hora` / `programacao_titulo`) e a gravação
// usa a server action `salvarProgramacao` (retorna void -> `<form action={...}>`,
// com o pending do botão via `useFormStatus`).
import Link from "next/link";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { salvarProgramacao } from "../../acoes";
import type { RascunhoPreview } from "@/lib/previewEvento";
import { programacaoSugerida } from "@/lib/sugestoes";
import { PreviewSite } from "../../_ui/PreviewSite";
import {
  BTN_PRIMARIO,
  BTN_VOLTAR,
  CARD,
  COLUNA,
  INPUT,
  SUB,
  TITULO,
} from "../../_ui/estilos";

const BTN_SUGERIR =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-scv-lilac px-3 py-1.5 text-[12px] font-semibold text-scv-violet transition hover:brightness-110";

type Linha = { id: number; hora: string; titulo: string };

/** Botão de submit com estado de envio (form action sem useActionState). */
function BotaoPronto() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${BTN_PRIMARIO} w-full`}>
      {pending ? "Salvando…" : "Pronto, voltar"}
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
      programacaoSugerida(tipo).map((p) => ({
        id: proxId.current++,
        hora: p.hora,
        titulo: p.titulo,
      })),
    );
  }

  const rascunhoJson = JSON.stringify({
    ...rascunhoBase,
    programacao: linhas.map((l) => ({ hora: l.hora, titulo: l.titulo })),
  });

  return (
    <div className={`${COLUNA} scv-fade py-9 pb-20`}>
      <div className="flex items-center gap-3.5">
        <Link href={voltar} aria-label="Voltar" className={BTN_VOLTAR}>
          <i className="bi bi-chevron-left" aria-hidden />
        </Link>
        <div>
          <h1 className={TITULO}>Programação</h1>
          <p className={`mt-1 ${SUB}`}>A linha do tempo da festa, hora a hora.</p>
        </div>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form action={salvarProgramacao} className="flex flex-col gap-3.5">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="voltar" value={voltar} />

          <div className={`${CARD} p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-scv-ink">Horários</h2>
              <button type="button" onClick={sugerir} className={BTN_SUGERIR}>
                <i className="bi bi-stars" aria-hidden />
                Sugerir
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              {linhas.map((l) => (
                <div key={l.id} className="flex items-center gap-2">
                  <input
                    name="programacao_hora"
                    value={l.hora}
                    onChange={(e) => atualizar(l.id, { hora: e.target.value })}
                    placeholder="20h30"
                    maxLength={20}
                    className={`${INPUT} w-[90px] text-center`}
                  />
                  <input
                    name="programacao_titulo"
                    value={l.titulo}
                    onChange={(e) => atualizar(l.id, { titulo: e.target.value })}
                    placeholder="Recepção dos convidados"
                    maxLength={140}
                    className={`${INPUT} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => remover(l.id)}
                    disabled={linhas.length <= 1}
                    aria-label="Remover horário"
                    className="grid size-[46px] shrink-0 place-items-center rounded-[11px] border border-scv-line text-scv-faint transition hover:border-scv-dash hover:text-red-600 disabled:opacity-40 disabled:hover:border-scv-line disabled:hover:text-scv-faint"
                  >
                    <i className="bi bi-trash" aria-hidden />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={adicionar}
              className="mt-2.5 w-full rounded-[11px] border border-dashed border-scv-dash py-2.5 text-[13px] font-semibold text-scv-muted transition hover:border-violeta hover:text-scv-violet"
            >
              + Adicionar horário
            </button>
          </div>

          <BotaoPronto />
        </form>

        <div className="lg:sticky lg:top-[86px]">
          <PreviewSite rascunhoJson={rascunhoJson} pagina="evento" host={host} />
        </div>
      </div>
    </div>
  );
}
