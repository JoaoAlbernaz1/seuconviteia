import Link from "next/link";
import { CapaEvento } from "./CapaEvento";
import { frasePresencas } from "@/lib/frases";
import type { EstadoEvento } from "@/lib/painelEstado";
import type { ItemFiltravel } from "@/lib/filtroEventos";

/**
 * Um evento como a home do painel precisa dele.
 *
 * Tudo aqui e serializavel (string, number, Date): estes itens atravessam a
 * fronteira Server -> Client Component quando `page.tsx` os entrega ao
 * `FiltroEventos`. Nao coloque funcao nenhuma neste tipo.
 */
export interface ItemPainel extends ItemFiltravel {
  nicho: string;
  kicker: string;
  expiraEm: Date;
  presencas: number;
  pendencia: string | null;
  tema: string;
  fontes: string;
  fotoUrl?: string;
}

const DATA_CURTA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/**
 * Selo por estado. Distingue por cor E por forma (o ponto) — nunca so por cor,
 * senao quem nao enxerga a diferenca de matiz nao distingue "No ar" de "Expirado".
 */
const SELO: Record<EstadoEvento, { texto: string; classe: string; ponto: string }> = {
  RASCUNHO: {
    texto: "Em preparação",
    classe: "bg-white/95 text-[#B45309]",
    ponto: "bg-amber-500",
  },
  NO_AR: { texto: "No ar", classe: "bg-amarelo text-preto", ponto: "bg-preto" },
  NO_AR_PENDENTE: { texto: "No ar", classe: "bg-amarelo text-preto", ponto: "bg-preto" },
  EXPIRADO: {
    texto: "Expirado",
    classe: "bg-white/95 text-scv-muted",
    ponto: "bg-scv-faint",
  },
};

export function CardEvento({ item }: { item: ItemPainel }) {
  const {
    id,
    estado,
    titulo,
    nicho,
    kicker,
    dataEvento,
    expiraEm,
    presencas,
    pendencia,
    tema,
    fontes,
    fotoUrl,
  } = item;

  const selo = SELO[estado];
  const expirado = estado === "EXPIRADO";
  const rascunho = estado === "RASCUNHO";

  const linha = rascunho
    ? "Continue de onde parou — falta pouco"
    : expirado
      ? `Este site saiu do ar em ${DATA_CURTA.format(expiraEm)}`
      : pendencia
        ? `${frasePresencas(presencas)} · ${pendencia}`
        : frasePresencas(presencas);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[20px] border border-scv-line bg-scv-card shadow-[0_16px_40px_-32px_rgba(15,23,42,0.12)] ${
        expirado ? "opacity-75 saturate-[0.35]" : ""
      }`}
    >
      <CapaEvento
        tema={tema}
        fontes={fontes}
        nome={titulo}
        kicker={kicker}
        fotoUrl={fotoUrl}
        altura={140}
      >
        <span
          className={`absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${selo.classe}`}
        >
          <span aria-hidden className={`size-[6px] rounded-full ${selo.ponto}`} />
          {selo.texto}
        </span>
      </CapaEvento>

      <div className="flex flex-1 flex-col gap-3 p-4 pb-[18px]">
        <div>
          <div className="text-[13px] font-semibold text-scv-ink">
            {nicho} · {DATA_CURTA.format(dataEvento)}
          </div>
          <div className="mt-1.5 text-[12.5px] leading-snug text-scv-muted">{linha}</div>
        </div>

        <Link
          href={rascunho ? `/painel/${id}/publicar` : `/painel/${id}`}
          className={`mt-auto w-full rounded-[11px] py-2.5 text-center text-[13.5px] font-semibold transition ${
            rascunho
              ? "bg-violeta text-white hover:brightness-110"
              : "border border-scv-line bg-scv-card text-scv-ink hover:border-scv-dash"
          }`}
        >
          {rascunho ? "Continuar montando" : "Ver e editar"}
        </Link>
      </div>
    </div>
  );
}
