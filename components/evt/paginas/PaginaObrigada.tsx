// Tela de agradecimento (/obrigada) do site do evento — COMPARTILHADA entre a
// rota pública (subdomínio) e o preview do editor, pra o profissional ver
// EXATAMENTE o que publica. Porte fiel do festa-15-maria-clara, agora
// data-driven: a mensagem muda conforme a pessoa CONFIRMOU (`vai`) ou não, com
// os textos vindos do editor (`config.msgConfirma`/`msgRecusa`). A `PALETA` do
// convite é mapeada para os tokens do preset (--ev-*), seguindo o tema.
import Link from "next/link";

import type { EventoFesta } from "@/lib/eventoFesta";
import {
  MSG_CONFIRMA_PADRAO,
  MSG_RECUSA_PADRAO,
  type RsvpConfig,
} from "@/lib/rsvpConfig";
import { acentoDoTema, TEMA_PADRAO } from "@/lib/temas";
import { coresParticulas } from "@/lib/cor";

import { Flourish } from "@/components/evt/icons";
import { ConviteBackground } from "@/components/evt/ConviteBackground";
import { Particles } from "@/components/evt/Particles";
import { Celebration } from "@/components/evt/Celebration";

// Paleta do convite mapeada para as vars de runtime do preset (no wrapper `.evt`).
const PALETA = {
  "--plum": "var(--ev-framboesa)",
  "--plum-2": "var(--ev-framboesa-deep)",
  "--wine": "var(--ev-rosa-ink)",
  "--rose": "var(--ev-rosa)",
  "--gold": "var(--ev-rose)",
  "--ivory": "var(--ev-ivory)",
  "--ivory-2": "var(--ev-blush-soft)",
  "--ink": "var(--ev-ink)",
} as React.CSSProperties;

export function PaginaObrigada({
  evento,
  config,
  vai,
}: {
  evento: EventoFesta;
  config: RsvpConfig;
  /** true = confirmou presença; false = respondeu que não vai. */
  vai: boolean;
}) {
  const cores =
    evento.tema === TEMA_PADRAO
      ? undefined
      : coresParticulas(acentoDoTema(evento.tema, evento.temaCor));

  const mensagem = vai
    ? config.msgConfirma ?? MSG_CONFIRMA_PADRAO
    : config.msgRecusa ?? MSG_RECUSA_PADRAO;
  const eyebrow = vai ? "Presença confirmada" : "Resposta registrada";
  const liveKey = vai ? "obrigada-msg-sim" : "obrigada-msg-nao";
  const secKey = vai ? "obrigada-sim" : "obrigada-nao";

  return (
    <div style={PALETA} className="relative min-h-dvh text-[var(--ink)]">
      <ConviteBackground foto={evento.fotoUrl} />
      <Particles className="z-[5]" colors={cores} />
      {/* Confete só para quem CONFIRMA (respeita reduced-motion no componente). */}
      {vai && <Celebration colors={cores} />}
      <main className="relative z-10 mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-7 pt-16 text-center">
        <div className="fade-up w-full rounded-lg border border-[var(--plum)]/15 bg-[var(--ivory)]/92 px-9 py-14 shadow-[0_18px_44px_-28px_rgba(58,14,47,0.4)]">
          <div className="fade-up flex justify-center" style={{ animationDelay: "120ms" }}>
            <Flourish className="h-4 w-32 text-[var(--rose)]/80" />
          </div>

          <p
            className="fade-up mt-5 font-evt-script text-6xl leading-none text-[var(--plum)]"
            style={{ animationDelay: "200ms" }}
          >
            Obrigada
          </p>

          <div className="fade-up mt-3 flex justify-center" style={{ animationDelay: "260ms" }}>
            <Flourish className="h-3 w-24 rotate-180 text-[var(--rose)]/55" />
          </div>

          <p
            className="fade-up mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-[var(--plum-2)]"
            style={{ animationDelay: "320ms" }}
          >
            {eyebrow}
          </p>

          <p
            data-sec={secKey}
            data-live={liveKey}
            className="fade-up mt-4 font-evt-body text-xl leading-snug text-[var(--plum-2)]"
            style={{ animationDelay: "380ms" }}
          >
            {mensagem}
          </p>

          <Link
            href="/"
            className="fade-up mt-9 inline-block cursor-pointer text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--plum)] transition-colors duration-200 hover:text-[var(--wine)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ivory)]"
            style={{ animationDelay: "440ms" }}
          >
            <span className="border-b border-[var(--plum)]/60 pb-1">Voltar ao início</span>
          </Link>
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
