"use client";

// Ações interativas do card "Seu convite": botão de copiar o link (com feedback
// "Copiado!") e o menu "⋯" (visualizar, copiar, compartilhar, pausar, excluir).
// Ações destrutivas levam à página de gestão do convite — nada é apagado inline.
import { useState } from "react";
import Link from "next/link";
import { Ic, IC } from "./Ic";

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
  publicado,
}: {
  url: string;
  fid: string;
  publicado: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { copiado, copiar } = useCopiado(url);

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
      <Link
        href={publicado ? `/painel/${fid}` : `/painel/${fid}/publicar`}
        className="cursor-pointer rounded-xl bg-[#7C3AED] px-5 py-3 text-sm font-semibold !text-white transition-colors hover:bg-[#6D28D9]"
      >
        {publicado ? "Gerenciar convite" : "Continuar edição"}
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
            <button onClick={() => { void copiar(); setOpen(false); }} className={itemCls}>
              {copiado ? "Copiado!" : "Copiar link"}
            </button>
            <button onClick={compartilhar} className={itemCls}>
              Compartilhar
            </button>
            <Link href={`/painel/${fid}/publicar`} onClick={() => setOpen(false)} className={itemCls}>
              {publicado ? "Pausar convite" : "Publicar"}
            </Link>
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
