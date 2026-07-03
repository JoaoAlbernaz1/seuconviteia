"use client";

// Excluir o site do evento — confirmação em DOIS toques inline (sem dialog do
// navegador): o primeiro clique arma a confirmação por alguns segundos; o
// segundo envia a action `excluirEvento` (apaga convidados, presentes, fotos,
// recados e o próprio evento).
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { excluirEvento } from "../acoes";

function BotaoConfirmar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="cursor-pointer rounded-[10px] bg-red-600 px-4 py-2 text-[12.5px] font-semibold text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Excluindo…" : "Confirmar exclusão"}
    </button>
  );
}

export function ExcluirEvento({ eventId, titulo }: { eventId: string; titulo: string }) {
  const [armado, setArmado] = useState(false);

  // Desarma sozinho se o segundo clique não vier.
  useEffect(() => {
    if (!armado) return;
    const t = setTimeout(() => setArmado(false), 6000);
    return () => clearTimeout(t);
  }, [armado]);

  if (!armado) {
    return (
      <button
        type="button"
        onClick={() => setArmado(true)}
        className="cursor-pointer text-[12.5px] font-medium text-scv-faint transition-colors duration-200 hover:text-red-600"
      >
        <i className="bi bi-trash3 mr-1" aria-hidden />
        Excluir este site
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
      <span className="text-[12.5px] text-red-700">
        Apagar <strong>{titulo}</strong> de vez? Convidados, presentes e fotos vão junto.
      </span>
      <form action={excluirEvento} className="flex items-center gap-2">
        <input type="hidden" name="eventId" value={eventId} />
        <BotaoConfirmar />
        <button
          type="button"
          onClick={() => setArmado(false)}
          className="cursor-pointer text-[12.5px] font-semibold text-scv-muted hover:text-scv-ink"
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}
