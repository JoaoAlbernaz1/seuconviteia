"use client";

// Form dos detalhes essenciais (cliente) + preview AO VIVO. Cada tecla atualiza
// o rascunho serializado que alimenta o <PreviewSite> (página "evento" do site,
// onde a mensagem de boas-vindas aparece). Salvar chama `atualizarDetalhes`.
import { useActionState, useState } from "react";
import Link from "next/link";
import type { RascunhoPreview } from "@/lib/previewEvento";
import { atualizarDetalhes, type AcaoEventoState } from "../../acoes";
import { PreviewSite } from "../../_ui/PreviewSite";
import {
  BTN_GHOST,
  BTN_PRIMARIO,
  CARD,
  INPUT,
  LABEL,
} from "../../_ui/estilos";

type Inicial = {
  title: string;
  date: string;
  time: string;
  local: string;
  endereco: string;
  traje: string;
  mensagem: string;
};

function Erro({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span className="mt-1 block text-xs text-red-400">{msg}</span>;
}

export function FormDetalhes({
  eventId,
  voltar,
  host,
  rascunhoBase,
  inicial,
  nomeLabel,
}: {
  eventId: string;
  voltar: string;
  host: string;
  rascunhoBase: RascunhoPreview;
  inicial: Inicial;
  nomeLabel: string;
}) {
  const [state, formAction, pending] = useActionState<AcaoEventoState, FormData>(
    atualizarDetalhes,
    {},
  );
  const [title, setTitle] = useState(inicial.title);
  const [date, setDate] = useState(inicial.date);
  const [time, setTime] = useState(inicial.time);
  const [local, setLocal] = useState(inicial.local);
  const [endereco, setEndereco] = useState(inicial.endereco);
  const [traje, setTraje] = useState(inicial.traje);
  const [mensagem, setMensagem] = useState(inicial.mensagem);

  const rascunhoJson = JSON.stringify({
    ...rascunhoBase,
    title,
    date,
    time,
    local,
    endereco,
    traje,
    mensagem,
  });

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form action={formAction} className={`${CARD} flex flex-col gap-4 p-7`}>
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="voltar" value={voltar} />

        <label className="block">
          <span className={LABEL}>{nomeLabel}</span>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={INPUT}
          />
          <Erro msg={state.fieldErrors?.title} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={LABEL}>Data da festa</span>
            <input
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={INPUT}
            />
            <Erro msg={state.fieldErrors?.date} />
          </label>
          <label className="block">
            <span className={LABEL}>Horário</span>
            <input
              name="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={INPUT}
            />
            <Erro msg={state.fieldErrors?.time} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={LABEL}>Local</span>
            <input
              name="local"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex.: Buffet Jardim das Flores"
              className={INPUT}
            />
            <Erro msg={state.fieldErrors?.local} />
          </label>
          <label className="block">
            <span className={LABEL}>Traje (opcional)</span>
            <input
              name="traje"
              value={traje}
              onChange={(e) => setTraje(e.target.value)}
              placeholder="Ex.: Esporte fino"
              className={INPUT}
            />
            <Erro msg={state.fieldErrors?.traje} />
          </label>
        </div>

        <label className="block">
          <span className={LABEL}>Endereço</span>
          <input
            name="endereco"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Rua, número, bairro — cidade"
            className={INPUT}
          />
          <Erro msg={state.fieldErrors?.endereco} />
          <span className="mt-1.5 block text-xs text-scv-faint">
            Os convidados veem o endereço com um mapa no site.
          </span>
        </label>

        <label className="block">
          <span className={LABEL}>Mensagem de boas-vindas</span>
          <textarea
            name="mensagem"
            rows={3}
            maxLength={2000}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            className={`${INPUT} resize-y leading-relaxed`}
          />
          <Erro msg={state.fieldErrors?.mensagem} />
          <span className="mt-1.5 block text-xs text-scv-faint">
            Dica: fale como você falaria com os convidados.
          </span>
        </label>

        {state.error ? (
          <p role="alert" className="text-sm text-red-400">
            {state.error}
          </p>
        ) : null}

        <div className="mt-1 flex gap-2.5">
          <Link href={voltar} className={BTN_GHOST}>
            Cancelar
          </Link>
          <button type="submit" disabled={pending} className={`${BTN_PRIMARIO} flex-1`}>
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>

      <div className="lg:sticky lg:top-[86px]">
        <PreviewSite rascunhoJson={rascunhoJson} pagina="evento" host={host} />
      </div>
    </div>
  );
}
