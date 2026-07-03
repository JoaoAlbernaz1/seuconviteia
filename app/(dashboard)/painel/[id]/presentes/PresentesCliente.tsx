"use client";

// Formulário "Lista de presentes" com prévia AO VIVO da página de presentes.
// Os itens viajam como colunas paralelas no FormData (`gift_titulo` /
// `gift_descricao` / `gift_valor`) — a server action `salvarPresentes` faz o zip.
// Cada linha emite um `gift_descricao` vazio para manter os 3 arrays alinhados.
import Link from "next/link";
import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { salvarPresentes, type AcaoEventoState } from "../../acoes";
import type { RascunhoPreview } from "@/lib/previewEvento";
import { textosDoNicho } from "@/lib/textos";
import { presentesSugeridos } from "@/lib/sugestoes";
import { PreviewSite } from "../../_ui/PreviewSite";
import { EscolherFoto, useEnvio } from "../../_ui/Uploads";
import {
  BTN_PRIMARIO,
  BTN_VOLTAR,
  CARD,
  COLUNA,
  INPUT,
  LABEL,
  SUB,
  TITULO,
} from "../../_ui/estilos";

const BTN_SUGERIR =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-scv-lilac px-3 py-1.5 text-[12px] font-semibold text-scv-violet transition hover:brightness-110";

type Linha = { id: number; titulo: string; valor: string };

export function PresentesCliente({
  eventId,
  voltar,
  host,
  tipo,
  rascunhoBase,
  pixNomeInicial,
  pixChaveInicial,
  pixQrUrlInicial,
  presentesTextoInicial,
  giftsIniciais,
}: {
  eventId: string;
  voltar: string;
  host: string;
  tipo: string;
  rascunhoBase: RascunhoPreview;
  pixNomeInicial: string;
  pixChaveInicial: string;
  pixQrUrlInicial: string;
  presentesTextoInicial: string;
  giftsIniciais: { titulo: string; valor: string }[];
}) {
  const base = giftsIniciais.length ? giftsIniciais : [{ titulo: "", valor: "" }];
  const [pixQrUrl, setPixQrUrl] = useState(pixQrUrlInicial);
  const [presentesTexto, setPresentesTexto] = useState(presentesTextoInicial);
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    base.map((g, i) => ({ id: i, titulo: g.titulo, valor: g.valor })),
  );
  const proxId = useRef(base.length);

  const [state, formAction, pending] = useActionState<AcaoEventoState, FormData>(
    salvarPresentes,
    {},
  );
  const { enviando, erro, enviarUma } = useEnvio();

  function atualizar(id: number, patch: Partial<Linha>) {
    setLinhas((xs) => xs.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function remover(id: number) {
    setLinhas((xs) => (xs.length > 1 ? xs.filter((l) => l.id !== id) : xs));
  }
  function adicionar() {
    setLinhas((xs) => [...xs, { id: proxId.current++, titulo: "", valor: "" }]);
  }
  function sugerirItens() {
    setLinhas(
      presentesSugeridos(tipo).map((p) => ({
        id: proxId.current++,
        titulo: p.titulo,
        valor: p.valor,
      })),
    );
  }

  const rascunhoJson = JSON.stringify({
    ...rascunhoBase,
    presentesTexto: presentesTexto || undefined,
    presentes: linhas.map((l) => ({ titulo: l.titulo, valor: l.valor || undefined })),
  });

  return (
    <div className={`${COLUNA} scv-fade py-9 pb-20`}>
      <div className="flex items-center gap-3.5">
        <Link href={voltar} aria-label="Voltar" className={BTN_VOLTAR}>
          <i className="bi bi-chevron-left" aria-hidden />
        </Link>
        <div>
          <h1 className={TITULO}>Lista de presentes</h1>
          <p className={`mt-1 ${SUB}`}>
            Convidados presenteiam por Pix — o dinheiro cai direto na sua conta.
          </p>
        </div>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form action={formAction} className="flex flex-col gap-3.5">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="voltar" value={voltar} />
          <input type="hidden" name="pixQrUrl" value={pixQrUrl} />

          {/* a. Chave Pix */}
          <div className={`${CARD} p-5 sm:p-6`}>
            <h2 className="text-[15px] font-semibold text-scv-ink">Sua chave Pix</h2>
            <p className="mt-0.5 text-[12.5px] text-scv-muted">
              Pode ser e-mail, telefone ou chave aleatória.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={LABEL}>Nome de quem recebe</span>
                <input
                  name="pixNome"
                  defaultValue={pixNomeInicial}
                  placeholder="Ex.: Maria Clara Souza"
                  maxLength={140}
                  className={INPUT}
                />
              </label>
              <label className="block">
                <span className={LABEL}>Chave Pix</span>
                <input
                  name="pixChave"
                  defaultValue={pixChaveInicial}
                  placeholder="Ex.: (11) 90000-0000"
                  maxLength={200}
                  className={INPUT}
                />
              </label>
            </div>
          </div>

          {/* b. QR Code (opcional) */}
          <div className={`${CARD} p-5 sm:p-6`}>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-scv-ink">
                QR Code do Pix
              </h2>
              <span className="rounded-full bg-scv-teal/10 px-2 py-0.5 text-[10px] font-bold text-scv-teal">
                OPCIONAL
              </span>
            </div>
            <p className="mt-0.5 text-[12.5px] text-scv-muted">
              Abra o app do seu banco, salve a imagem do QR Code e suba aqui. Ele
              aparece junto da lista.
            </p>
            <div className="mt-4 flex items-start gap-4">
              {pixQrUrl ? (
                <div className="relative size-[150px] shrink-0 overflow-hidden rounded-[14px] bg-white ring-1 ring-scv-line">
                  <Image
                    src={pixQrUrl}
                    alt="QR Code do Pix"
                    fill
                    unoptimized
                    className="object-contain p-1.5"
                  />
                </div>
              ) : (
                <EscolherFoto
                  enviando={enviando}
                  onFile={(files) => enviarUma(files[0], setPixQrUrl)}
                  className="flex size-[150px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-scv-dash text-scv-faint transition hover:border-violeta hover:text-scv-violet"
                >
                  <i className="bi bi-qr-code text-2xl" aria-hidden />
                  <span className="text-[12px] font-medium">
                    {enviando ? "Enviando…" : "Enviar QR Code"}
                  </span>
                </EscolherFoto>
              )}
              <div className="flex flex-col gap-2 pt-1">
                <p className="text-[12.5px] leading-relaxed text-scv-muted">
                  Com o QR na tela, o convidado só aponta a câmera — nem precisa
                  digitar a chave.
                </p>
                {pixQrUrl ? (
                  <button
                    type="button"
                    onClick={() => setPixQrUrl("")}
                    className="self-start text-[12.5px] font-medium text-scv-faint transition hover:text-red-600"
                  >
                    Remover
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* c. Texto da lista */}
          <div className={`${CARD} p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-scv-ink">
                  Texto da lista
                </h2>
                <p className="mt-0.5 text-[12.5px] text-scv-muted">
                  Um convite gentil para quem quiser presentear.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPresentesTexto(textosDoNicho(tipo).teaserPresentes)}
                className={BTN_SUGERIR}
              >
                <i className="bi bi-stars" aria-hidden />
                Sugerir
              </button>
            </div>
            <textarea
              name="presentesTexto"
              rows={2}
              maxLength={500}
              value={presentesTexto}
              onChange={(e) => setPresentesTexto(e.target.value)}
              placeholder="Se quiser deixar um carinho a mais, minha chave Pix está aqui."
              className={`${INPUT} mt-4 resize-y leading-relaxed`}
            />
          </div>

          {/* d. Presentes */}
          <div className={`${CARD} p-5 sm:p-6`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold text-scv-ink">Presentes</h2>
                <p className="mt-0.5 text-[12.5px] text-scv-muted">
                  Dê nomes carinhosos e escolha os valores.
                </p>
              </div>
              <button type="button" onClick={sugerirItens} className={BTN_SUGERIR}>
                <i className="bi bi-stars" aria-hidden />
                Sugerir
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              {linhas.map((l) => (
                <div key={l.id} className="flex items-center gap-2">
                  <input
                    name="gift_titulo"
                    value={l.titulo}
                    onChange={(e) => atualizar(l.id, { titulo: e.target.value })}
                    placeholder="Cota da festa"
                    maxLength={140}
                    className={`${INPUT} flex-1`}
                  />
                  <input
                    name="gift_valor"
                    value={l.valor}
                    onChange={(e) => atualizar(l.id, { valor: e.target.value })}
                    placeholder="150,00"
                    inputMode="decimal"
                    className={`${INPUT} basis-[100px] shrink-0 text-center`}
                  />
                  <input type="hidden" name="gift_descricao" value="" />
                  <button
                    type="button"
                    onClick={() => remover(l.id)}
                    disabled={linhas.length <= 1}
                    aria-label="Remover presente"
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
              + Adicionar presente
            </button>
          </div>

          {erro ? (
            <p role="alert" className="text-sm text-red-600">
              {erro}
            </p>
          ) : null}
          {state.error ? (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className={`${BTN_PRIMARIO} w-full`}
          >
            {pending ? "Salvando…" : "Pronto, voltar"}
          </button>
        </form>

        <div className="lg:sticky lg:top-[86px]">
          <PreviewSite
            rascunhoJson={rascunhoJson}
            pagina="presentes"
            host={host}
            rotulo="Como os convidados veem"
          />
        </div>
      </div>
    </div>
  );
}
