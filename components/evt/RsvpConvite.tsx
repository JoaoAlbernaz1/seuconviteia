"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmarPresencaFesta } from "@/lib/rsvp";
import type { GuestInput } from "@/lib/rsvpFesta";
import { ArrowRight, Plus, Check, XMark } from "@/components/evt/icons";
import { ConviteBackground } from "@/components/evt/ConviteBackground";
import { Particles } from "@/components/evt/Particles";

/**
 * RsvpConvite — replica FIEL do formulario de RSVP do festa-15-maria-clara,
 * trazido para o site multi-tenant. Mesmas escritas, layout e cores: a `PALETA`
 * do convite (--plum/--wine/--gold/...) e mapeada para os tokens do PRESET do
 * evento (--ev-*), entao o form segue o tema escolhido. Grava UMA linha `Guest`
 * via `confirmarPresencaFesta` (re-valida o evento + LGPD no servidor) e, em
 * sucesso, navega para /obrigada — identico ao festa.
 */
type Guest = GuestInput & { id: string };

// Paleta do convite mapeada para as vars de runtime do preset (definidas no
// wrapper `.evt`): o form re-tinge por tema sem mudar a estrutura/escritas.
const PALETA = {
  "--plum": "var(--ev-framboesa)",
  "--plum-2": "var(--ev-framboesa-deep)",
  "--wine": "var(--ev-rosa-ink)",
  "--rose": "var(--ev-rosa)",
  "--rose-soft": "var(--ev-blush)",
  "--gold": "var(--ev-rose)",
  "--ivory": "var(--ev-ivory)",
  "--ivory-2": "var(--ev-blush-soft)",
  "--ink": "var(--ev-ink)",
} as React.CSSProperties;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-10 flex items-center gap-3">
      <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-[var(--plum)]">
        {children}
      </h2>
      <span className="h-px flex-1 bg-[var(--plum)]/25" />
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--ivory-2)]">
      <div
        className="relative h-1.5 rounded-full bg-[var(--plum)] transition-all duration-300"
        style={{ width: `${percent}%` }}
      >
        <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-[var(--rose)]" />
      </div>
    </div>
  );
}

function GuestRow({
  guest,
  onChange,
  onRemove,
}: {
  guest: GuestInput;
  onChange: (g: GuestInput) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="relative rounded-lg border border-[var(--plum)]/15 bg-[var(--ivory)]/92 p-5 shadow-[0_1px_12px_-6px_rgba(58,14,47,0.25)]">
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remover convidado"
          className="absolute right-2.5 top-2.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[var(--plum)]/45 transition-colors duration-200 hover:bg-[var(--ivory-2)] hover:text-[var(--wine)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ivory)]"
        >
          <XMark className="h-4 w-4" />
        </button>
      )}
      <input
        value={guest.nome}
        onChange={(e) => onChange({ ...guest, nome: e.target.value })}
        placeholder="Nome do convidado"
        aria-label="Nome do convidado"
        className={`w-full border-b border-[var(--plum)]/25 bg-transparent pb-2 font-evt-body text-lg font-medium text-[var(--plum)] outline-none transition-colors duration-200 placeholder:text-[var(--plum)]/40 focus:border-[var(--gold)] focus-visible:border-[var(--gold)] ${
          onRemove ? "pr-9" : ""
        }`}
      />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange({ ...guest, vai_comparecer: true })}
          aria-pressed={guest.vai_comparecer}
          className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-3 text-[0.7rem] font-medium uppercase tracking-[0.18em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ivory)] ${
            guest.vai_comparecer
              ? "bg-[var(--plum)] text-[var(--ivory)]"
              : "border border-[var(--plum)]/25 bg-transparent text-[var(--plum)] hover:border-[var(--plum)]/40"
          }`}
        >
          <Check className="h-4 w-4" />
          Irá comparecer
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...guest, vai_comparecer: false })}
          aria-pressed={!guest.vai_comparecer}
          className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-3 text-[0.7rem] font-medium uppercase tracking-[0.18em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ivory)] ${
            !guest.vai_comparecer
              ? "bg-[var(--gold)] text-[var(--ink)]"
              : "border border-[var(--plum)]/25 bg-transparent text-[var(--plum)] hover:border-[var(--plum)]/40"
          }`}
        >
          <XMark className="h-4 w-4" />
          Não irá comparecer
        </button>
      </div>
    </div>
  );
}

export function RsvpConvite({
  eventId,
  nome,
  fotoUrl,
}: {
  eventId: string;
  nome: string;
  fotoUrl?: string;
}) {
  const router = useRouter();
  const idRef = useRef(1);
  const nextId = () => String(idRef.current++);

  const [guests, setGuests] = useState<Guest[]>([
    { id: "0", nome: "", tipo: "adulto", vai_comparecer: true },
  ]);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const adultos = guests.filter((g) => g.tipo === "adulto");
  const criancas = guests.filter((g) => g.tipo === "crianca");
  const confirmados = guests.filter(
    (g) => g.nome.trim().length > 0 && g.vai_comparecer
  ).length;
  const canRemove = guests.length > 1;

  const update = (id: string) => (next: GuestInput) =>
    setGuests((gs) => gs.map((g) => (g.id === id ? { ...next, id } : g)));
  const add = (tipo: GuestInput["tipo"]) =>
    setGuests((gs) => [...gs, { id: nextId(), nome: "", tipo, vai_comparecer: true }]);
  const remove = (id: string) => setGuests((gs) => gs.filter((g) => g.id !== id));

  async function onSubmit() {
    setError("");
    if (!consent) {
      setError("É preciso aceitar o compartilhamento dos dados.");
      return;
    }
    setSaving(true);
    const payload: GuestInput[] = guests.map(({ nome, tipo, vai_comparecer }) => ({
      nome,
      tipo,
      vai_comparecer,
    }));
    const res = await confirmarPresencaFesta(eventId, payload, consent);
    setSaving(false);
    if (!res.ok) {
      setError(res.error || "Não consegui enviar agora. Tente de novo.");
      return;
    }
    router.push("/obrigada");
  }

  return (
    <div style={PALETA} className="relative min-h-dvh text-[var(--ink)]">
      <ConviteBackground foto={fotoUrl} />
      <Particles className="z-[5]" />
      <main className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col">
        <header className="px-5 pt-[5.5rem]">
          <div className="fade-up pb-4" style={{ animationDelay: "40ms" }}>
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--plum-2)]">
              Confirmando presença — {nome}
            </span>
          </div>
          <ProgressBar percent={50} />
        </header>

        <div className="flex-1 px-5 py-9">
          <h1
            className="fade-up text-center font-evt-body text-5xl font-medium italic leading-tight text-[var(--plum)]"
            style={{ animationDelay: "120ms" }}
          >
            Quem vai?
          </h1>
          <p
            className="fade-up mx-auto mt-3 max-w-xs text-center font-evt-body text-lg text-[var(--plum-2)]"
            style={{ animationDelay: "180ms" }}
          >
            É importante fornecer o nome completo de cada convidado
          </p>

          <section className="fade-up" style={{ animationDelay: "260ms" }}>
            <SectionLabel>Adultos</SectionLabel>
            <div className="mt-4 space-y-3">
              {adultos.map((g) => (
                <GuestRow
                  key={g.id}
                  guest={g}
                  onChange={update(g.id)}
                  onRemove={canRemove ? () => remove(g.id) : undefined}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => add("adulto")}
              className="mt-3 flex min-h-[44px] w-full cursor-pointer items-center justify-between rounded-md border border-dashed border-[var(--rose)]/60 bg-transparent px-4 py-3.5 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--plum)] transition-colors duration-200 hover:border-[var(--rose)] hover:text-[var(--wine)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ivory)]"
            >
              Adicionar outro adulto
              <Plus className="h-5 w-5 text-[var(--rose)]" />
            </button>
          </section>

          <section className="fade-up" style={{ animationDelay: "340ms" }}>
            <SectionLabel>Crianças</SectionLabel>
            <div className="mt-4 space-y-3">
              {criancas.map((g) => (
                <GuestRow
                  key={g.id}
                  guest={g}
                  onChange={update(g.id)}
                  onRemove={canRemove ? () => remove(g.id) : undefined}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => add("crianca")}
              className="mt-3 flex min-h-[44px] w-full cursor-pointer items-center justify-between rounded-md border border-dashed border-[var(--rose)]/60 bg-transparent px-4 py-3.5 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--plum)] transition-colors duration-200 hover:border-[var(--rose)] hover:text-[var(--wine)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ivory)]"
            >
              Adicionar criança
              <Plus className="h-5 w-5 text-[var(--rose)]" />
            </button>
          </section>

          {error && (
            <p className="mt-5 text-center text-sm font-medium text-[var(--wine)]">{error}</p>
          )}
        </div>

        <div className="sticky bottom-0 bg-gradient-to-t from-[var(--ivory-2)] via-[var(--ivory-2)]/92 to-transparent px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
          {/* Consentimento (LGPD) — exigido antes de gravar. */}
          <label className="mb-3 flex cursor-pointer items-start gap-2.5 text-left">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-none cursor-pointer accent-[var(--plum)]"
            />
            <span className="text-[0.72rem] leading-snug text-[var(--plum-2)]">
              Concordo em compartilhar meus dados com {nome} para a organização da festa.
            </span>
          </label>
          <p
            className="mb-2.5 text-center text-[0.62rem] font-medium uppercase tracking-[0.26em] text-[var(--plum-2)]/75"
            aria-live="polite"
          >
            {confirmados} confirmado{confirmados === 1 ? "" : "s"}
          </p>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-3 rounded-md bg-[var(--plum)] py-4 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--ivory)] shadow-[inset_0_0_0_1px_rgba(250,218,221,0.5)] transition-colors duration-200 hover:bg-[var(--plum-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ivory)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              "Enviando..."
            ) : (
              <>
                Continuar
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </main>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .fade-up { opacity: 0; animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .fade-up { opacity: 1 !important; animation: none !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
