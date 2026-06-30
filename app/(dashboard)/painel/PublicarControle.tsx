"use client";
import { useState } from "react";

/**
 * Controle de publicar/despublicar do painel, com PASSO DE CONFIRMAÇÃO (o João
 * pediu "uma mensagem confirmando que quer publicar"). Publicar tira a marca
 * d'água e deixa o site público (é a ação paga); voltar para prévia repõe a
 * marca. A `action` (server action `alternarCompra`) faz o write.
 */
export function PublicarControle({
  eventId,
  purchased,
  action,
}: {
  eventId: string;
  purchased: boolean;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [confirmando, setConfirmando] = useState(false);

  if (confirmando) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2 rounded-full bg-amber-50 px-2.5 py-1">
        <span className="text-xs text-amber-800">
          {purchased
            ? "Voltar para prévia? A marca d'água volta ao site."
            : "Publicar? A marca d'água sai e o site fica público."}
        </span>
        <form action={action} className="inline-flex">
          <input type="hidden" name="eventId" value={eventId} />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-full bg-violeta px-3 py-1 text-xs font-semibold text-white transition hover:bg-violeta/90"
          >
            <i className="bi bi-check-lg" aria-hidden />
            {purchased ? "Sim, voltar" : "Sim, publicar"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-texto-suave transition hover:text-ink"
        >
          Cancelar
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        purchased
          ? "border border-black/10 text-texto-suave hover:text-ink"
          : "bg-violeta text-white hover:bg-violeta/90"
      }`}
    >
      {purchased ? (
        <>
          <i className="bi bi-arrow-counterclockwise" aria-hidden /> Voltar p/ prévia
        </>
      ) : (
        <>
          <i className="bi bi-rocket-takeoff" aria-hidden /> Publicar — tirar marca d&apos;água
        </>
      )}
    </button>
  );
}
