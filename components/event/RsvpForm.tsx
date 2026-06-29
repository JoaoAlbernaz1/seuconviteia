"use client";

import { useActionState, useState } from "react";
import { confirmarPresenca, type RsvpState } from "@/lib/rsvp";

const inicial: RsvpState = { status: "idle" };

/**
 * Formulario de RSVP do site do evento (Fase 6). Progressive enhancement via
 * `useActionState` -> server action `confirmarPresenca` (grava o Guest).
 * Estilo deriva do `.cv` (cor do evento). Em sucesso, vira um agradecimento.
 */
export function RsvpForm({ eventId }: { eventId: string }) {
  const [state, formAction, pending] = useActionState(
    confirmarPresenca,
    inicial,
  );
  const [presenca, setPresenca] = useState<"sim" | "nao">("sim");

  if (state.status === "ok") {
    const vem = state.presenca !== "nao";
    return (
      <div className="cv-rsvp-done cv-reveal" role="status">
        <span className="cv-rsvp-done-mark" aria-hidden />
        <p className="cv-rsvp-done-title">
          {vem ? "Presença confirmada!" : "Recebemos seu recado"}
        </p>
        <p className="cv-rsvp-done-text">
          {vem ? (
            <>
              Que alegria, <strong>{state.nome}</strong>. Vai ser inesquecível
              com você lá.
            </>
          ) : (
            <>
              Obrigado por avisar, <strong>{state.nome}</strong>. Você vai fazer
              falta — fica para a próxima!
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="cv-rsvp-form">
      <input type="hidden" name="eventId" value={eventId} />

      <div className="cv-seg" role="radiogroup" aria-label="Você vai comparecer?">
        <label className={`cv-seg-opt${presenca === "sim" ? " is-on" : ""}`}>
          <input
            type="radio"
            name="presenca"
            value="sim"
            checked={presenca === "sim"}
            onChange={() => setPresenca("sim")}
          />
          Vou comparecer
        </label>
        <label className={`cv-seg-opt${presenca === "nao" ? " is-on" : ""}`}>
          <input
            type="radio"
            name="presenca"
            value="nao"
            checked={presenca === "nao"}
            onChange={() => setPresenca("nao")}
          />
          Não poderei ir
        </label>
      </div>

      <label className="cv-field">
        <span className="cv-field-lbl">Seu nome</span>
        <input
          name="nome"
          type="text"
          required
          maxLength={80}
          autoComplete="name"
          placeholder="Como devemos te chamar"
          className="cv-input"
        />
      </label>

      {presenca === "sim" && (
        <label className="cv-field">
          <span className="cv-field-lbl">Acompanhantes</span>
          <input
            name="acompanhantes"
            type="number"
            min={0}
            max={20}
            defaultValue={0}
            inputMode="numeric"
            className="cv-input cv-input--num"
          />
          <span className="cv-field-hint">Quantas pessoas vêm com você</span>
        </label>
      )}

      <label className="cv-field">
        <span className="cv-field-lbl">Recado (opcional)</span>
        <textarea
          name="recado"
          maxLength={400}
          rows={3}
          placeholder="Deixe uma mensagem carinhosa"
          className="cv-input cv-textarea"
        />
      </label>

      <label className="cv-consent">
        <input type="checkbox" name="consentimento" required />
        <span>
          Concordo em compartilhar meu nome e recado com os anfitriões para a
          organização do evento.
        </span>
      </label>

      {state.status === "error" && (
        <p className="cv-rsvp-err" role="alert">
          {state.message}
        </p>
      )}

      <button type="submit" className="cv-cta" disabled={pending}>
        {pending
          ? "Enviando…"
          : presenca === "sim"
            ? "Confirmar presença"
            : "Enviar resposta"}
      </button>
    </form>
  );
}
