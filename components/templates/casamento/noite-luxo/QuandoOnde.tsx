// Cartões escuros QUANDO & ONDE — próprios do template Noite Luxo, reutilizados
// por Home e Evento. Server component; grafite + filete dourado, data/hora e
// local em destaque, linha de traje. `footer` opcional (ações por página).
import type { ReactNode } from "react";
import type { EventoFesta } from "@/lib/eventoFesta";
import { CNL, CnlCard, CnlEyebrow } from "@/components/templates/casamento/noite-luxo/ui";

export function CartaoQuandoOnde({
  evento,
  footer,
}: {
  evento: EventoFesta;
  footer?: ReactNode;
}) {
  const local = evento.local ?? "O local";
  return (
    <CnlCard className="mx-auto max-w-[860px] p-[clamp(1.75rem,5vw,3rem)]">
      <div className="grid gap-10 sm:grid-cols-2">
        {/* Quando */}
        <div className="text-center sm:text-left">
          <CnlEyebrow>Quando</CnlEyebrow>
          <p
            className="mt-4 font-evt-script text-[clamp(1.9rem,5.5vw,2.5rem)] leading-tight"
            style={{ color: CNL.ink }}
          >
            {evento.data}
          </p>
          <p
            className="mt-1 font-evt-display text-[clamp(1.9rem,6vw,2.6rem)] tracking-[0.06em]"
            style={{ color: "var(--ev-rose)" }}
          >
            {evento.horario}
          </p>
        </div>

        {/* Onde */}
        <div className="relative text-center sm:pl-10 sm:text-left">
          {/* separador — hairline dourado (horizontal no mobile, vertical no desktop) */}
          <span
            className="mx-auto mb-6 block h-px w-16 sm:absolute sm:inset-y-1 sm:left-0 sm:mx-0 sm:mb-0 sm:h-auto sm:w-px"
            style={{ background: "color-mix(in srgb, var(--ev-rosa) 40%, transparent)" }}
            aria-hidden
          />
          <CnlEyebrow>Onde</CnlEyebrow>
          <p
            className="mt-4 font-evt-script text-[clamp(1.9rem,5.5vw,2.5rem)] leading-tight"
            style={{ color: CNL.ink }}
          >
            {local}
          </p>
          {evento.endereco && (
            <p className="mt-2 font-evt-body text-[1.05rem] leading-relaxed" style={{ color: CNL.soft }}>
              {evento.endereco}
            </p>
          )}
          {evento.traje && (
            <p
              className="mt-4 font-evt-util text-[0.62rem] uppercase tracking-[0.28em]"
              style={{ color: CNL.mute }}
            >
              Traje · {evento.traje}
            </p>
          )}
        </div>
      </div>

      {footer && (
        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-start">
          {footer}
        </div>
      )}
    </CnlCard>
  );
}
