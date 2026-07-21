// Pagina /obrigada do site publico (servida por subdominio). Porte FIEL do
// festa-15-maria-clara (`app/obrigada/page.tsx`): tela de presenca confirmada,
// com fundo claro (foto) + particulas + confete. A `PALETA` do convite e mapeada
// para os tokens do PRESET do evento (--ev-*), seguindo o tema. Data-driven:
// resolve o evento pelo subdominio (so para o nome + foto + cores do confete).
import Link from "next/link";

import SiteIndisponivel from "@/components/SiteIndisponivel";
import { eventoPublico } from "@/lib/event";
import { carregarEventoFesta } from "@/lib/eventoFesta";
import { comFotosDemo } from "@/lib/demoFotos";
import { acentoDoTema, TEMA_PADRAO } from "@/lib/temas";
import { coresParticulas } from "@/lib/cor";

import { Flourish } from "@/components/evt/icons";
import { ConviteBackground } from "@/components/evt/ConviteBackground";
import { Particles } from "@/components/evt/Particles";
import { Celebration } from "@/components/evt/Celebration";

// Sempre dinamico: depende do banco e do subdominio da requisicao.
export const dynamic = "force-dynamic";

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

export default async function ObrigadaPage({
  params,
}: {
  params: Promise<{ sub: string }>;
}) {
  const { sub } = await params;
  const event = await carregarEventoFesta(sub);

  const visivel = eventoPublico(event, new Date());
  if (!visivel.ok || !event) {
    return <SiteIndisponivel motivo={visivel.motivo ?? "inexistente"} />;
  }

  const evento = comFotosDemo(event);
  const cores =
    evento.tema === TEMA_PADRAO ? undefined : coresParticulas(acentoDoTema(evento.tema));

  return (
    <div style={PALETA} className="relative min-h-dvh text-[var(--ink)]">
      <ConviteBackground foto={evento.fotoUrl} />
      <Particles className="z-[5]" colors={cores} />
      <Celebration colors={cores} />
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
            Presença confirmada
          </p>

          <p
            className="fade-up mt-4 font-evt-body text-xl leading-snug text-[var(--plum-2)]"
            style={{ animationDelay: "380ms" }}
          >
            {evento.primeiroNome} te espera para vivermos juntos um momento inesquecível!
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
