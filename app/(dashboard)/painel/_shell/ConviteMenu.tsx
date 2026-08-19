"use client";

// Ações interativas do card "Seu convite": botão de copiar o link (com feedback
// "Copiado!") e o menu "⋯" (visualizar, copiar, compartilhar, pausar, excluir).
// Ações destrutivas levam à página de gestão do convite — nada é apagado inline.
//
// O menu segue o ESTADO do convite, não o status do banco: ele oferecia "Pausar
// convite" a quem já estava pausado, e "copiar/compartilhar" o link de uma festa
// que já aconteceu — cujo site responde com o aviso de convite encerrado.
import { useState } from "react";
import Link from "next/link";
import { Ic, IC } from "./Ic";
import type { EstadoConvite } from "@/lib/estadoConvite";

function useCopiado(texto: string) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      /* clipboard indisponível — ignora */
    }
  };
  return { copiado, copiar };
}

export function CopyLinkButton({ url }: { url: string }) {
  const { copiado, copiar } = useCopiado(url);
  return (
    <>
      <button onClick={copiar} aria-label="Copiar link" className="cursor-pointer">
        <Ic d={IC.copy} size={14} stroke="#6E6E76" />
      </button>
      {copiado && <span className="text-[11.5px] font-semibold text-[#34A177]">Copiado!</span>}
    </>
  );
}

export function ConviteMenu({
  url,
  fid,
  estado,
}: {
  url: string;
  fid: string;
  estado: EstadoConvite;
}) {
  const [open, setOpen] = useState(false);
  const { copiado, copiar } = useCopiado(url);
  const rascunho = estado === "rascunho";
  const encerrada = estado === "encerrada";
  // A quarta linha do menu é a que MUDA o estado do convite — e por isso ela só
  // existe quando há mudança possível. Depois da festa não há: o servidor não
  // reabre nem republica, e um item que só leva a uma negativa é ruído.
  const virar = rascunho
    ? { label: "Publicar", href: `/painel/criar?id=${fid}` }
    : estado === "no-ar"
      ? { label: "Pausar convite", href: `/painel/${fid}` }
      : estado === "fora-do-ar"
        ? { label: "Voltar ao ar", href: `/painel/${fid}` }
        : null;

  const compartilhar = async () => {
    setOpen(false);
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "Meu convite", url });
        return;
      } catch {
        /* cancelado */
      }
    }
    void copiar();
  };

  const itemCls =
    "block w-full rounded-lg px-3.5 py-2.5 text-left text-[13px] font-medium !text-[#17171b] transition-colors hover:bg-[#f4f4f6]";

  return (
    <div className="relative flex items-center gap-2.5">
      {/* Publicado -> tela do convite (gerenciar: quem confirmou, quanto
          entrou, partes do site). Rascunho -> editor de 6 passos, que e onde
          ele parou. Sao dois verbos diferentes e nao devem cair no mesmo
          lugar. */}
      <Link
        href={rascunho ? `/painel/criar?id=${fid}` : `/painel/${fid}`}
        className="cursor-pointer rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-semibold !text-white transition-colors hover:bg-[#6D28D9]"
      >
        {rascunho ? "Continuar edição" : "Gerenciar convite"}
      </Link>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Mais ações"
        className="grid size-[42px] cursor-pointer place-items-center rounded-xl border border-[#ececf0] bg-white text-[17px] leading-none text-[#17171b] transition-colors hover:bg-[#f4f4f6]"
      >
        ⋯
      </button>
      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="dash-fade absolute right-0 top-[52px] z-20 w-[190px] rounded-2xl border border-[#ececf0] bg-white p-1.5 shadow-[0_14px_34px_rgba(23,23,27,0.14)]">
            <a href={url} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className={itemCls}>
              Visualizar site
            </a>
            {/* Copiar e compartilhar somem com a festa encerrada: o link ainda
                existe, mas quem abrir lê que o convite acabou — espalhá-lo é
                convidar para uma porta fechada. "Visualizar site" fica: é assim
                que o dono vê o que o convidado vê. */}
            {encerrada ? null : (
              <>
                <button onClick={() => { void copiar(); setOpen(false); }} className={itemCls}>
                  {copiado ? "Copiado!" : "Copiar link"}
                </button>
                <button onClick={compartilhar} className={itemCls}>
                  Compartilhar
                </button>
              </>
            )}
            {virar ? (
              <Link href={virar.href} onClick={() => setOpen(false)} className={itemCls}>
                {virar.label}
              </Link>
            ) : null}
            <Link
              href={`/painel/${fid}`}
              onClick={() => setOpen(false)}
              className="block w-full rounded-lg px-3.5 py-2.5 text-left text-[13px] font-medium !text-[#d9376e] transition-colors hover:bg-[#fdf0f5]"
            >
              Excluir convite
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
