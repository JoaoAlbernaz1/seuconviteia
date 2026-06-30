"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/evt/Button";
import { Flourish } from "@/components/evt/icons";
import { deixarRecado } from "@/lib/recados";

const MAX = 500;

/**
 * RecadoForm — deixa um recado no mural (client). Porte FIEL do festa, com as
 * cores renomeadas para os tokens `evt-` (segue o preset). Chama `deixarRecado`
 * (server action): re-valida o evento + exige consentimento (LGPD). O recado e
 * auto-aprovado e aparece no mural na hora (router.refresh re-busca a lista).
 */
export function RecadoForm({ eventId, nome }: { eventId: string; nome: string }) {
  const router = useRouter();
  const [nomeConvidado, setNome] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit() {
    setError("");
    if (nomeConvidado.trim().length < 2) return setError("Diga seu nome.");
    if (mensagem.trim().length < 2) return setError("Escreva um recado.");
    if (!consent) return setError("É preciso aceitar o compartilhamento dos dados.");
    startTransition(async () => {
      const res = await deixarRecado({
        eventId,
        nome: nomeConvidado,
        mensagem,
        consentimento: consent,
      });
      if (!res.ok) return setError(res.error);
      router.refresh();
      setDone(true);
    });
  }

  if (done) {
    return (
      <div
        className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-evt-blush-soft px-[clamp(1.5rem,6vw,2.5rem)] py-[clamp(2.5rem,7vw,3.5rem)] text-center"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-5">
          <Flourish className="h-5 w-32 text-evt-rosa" />
          <p className="max-w-sm font-evt-script text-[clamp(1.8rem,6vw,2.4rem)] leading-tight text-evt-rosa-ink">
            Recado enviado! Obrigada 💗
          </p>
          <p className="max-w-xs font-evt-body text-base text-evt-ink-soft">
            Ele já está no mural, logo abaixo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-white p-[clamp(1.5rem,5vw,2.25rem)] shadow-[0_22px_50px_-40px_rgba(46,26,32,0.35)]">
      <label className="block">
        <span className="eyebrow text-evt-rosa-ink">Seu nome</span>
        <input
          type="text"
          value={nomeConvidado}
          onChange={(e) => setNome(e.target.value)}
          maxLength={60}
          placeholder="Como você se chama"
          className="mt-2 w-full border-0 border-b border-[var(--line)] bg-transparent pb-2 font-evt-body text-xl text-evt-ink outline-none transition-colors placeholder:text-evt-ink-soft/50 focus:border-evt-rosa"
        />
      </label>

      <label className="mt-7 block">
        <span className="eyebrow text-evt-rosa-ink">Recado</span>
        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value.slice(0, MAX))}
          rows={4}
          placeholder={`Escreva um carinho para ${nome}…`}
          className="mt-3 w-full resize-none rounded-[10px] border border-[var(--line)] bg-evt-blush-soft/40 p-4 font-evt-body text-lg leading-relaxed text-evt-ink outline-none transition-colors placeholder:text-evt-ink-soft/50 focus:border-evt-rosa"
        />
        <span className="mt-1 block text-right font-evt-util text-[0.62rem] uppercase tracking-[0.18em] text-evt-ink-soft/70">
          {mensagem.length}/{MAX}
        </span>
      </label>

      <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-left">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-none cursor-pointer accent-evt-rosa"
        />
        <span className="font-evt-body text-sm leading-snug text-evt-ink-soft">
          Concordo em compartilhar meu nome e recado para aparecerem no mural do evento.
        </span>
      </label>

      <p className="min-h-[1.25rem] text-center font-evt-body text-base text-evt-rosa-ink" aria-live="polite">
        {error}
      </p>

      <div className="mt-2 flex justify-center">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={pending}
          aria-busy={pending}
          className="w-full sm:w-auto"
        >
          {pending ? "Enviando…" : "Enviar recado"}
        </Button>
      </div>
    </div>
  );
}
