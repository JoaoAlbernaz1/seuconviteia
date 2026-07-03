// Acompanhar o evento (site já no ar): link para copiar/abrir, KPIs reais,
// confirmações recentes e os atalhos para editar o site. Rascunho ainda não
// publicado volta ao passo de publicar.
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { lerTemaKey } from "@/lib/temas";
import { lerFonteKey } from "@/lib/fontes";
import { textosDoNicho } from "@/lib/textos";
import { despublicarEvento } from "@/app/(dashboard)/actions";
import { ExcluirEvento } from "./ExcluirEvento";
import {
  carregarEventoDono,
  hostDoEvento,
  urlDoEvento,
  lerCustomStr,
} from "./_carregar";
import { CapaEvento } from "../_ui/CapaEvento";
import { CopiarLink } from "./CopiarLink";
import {
  BTN_CARD,
  BTN_FORTE,
  BTN_PRIMARIO,
  BTN_VOLTAR,
  CARD,
  COLUNA,
  PILL_NO_AR,
} from "../_ui/estilos";

export const dynamic = "force-dynamic";

const DATA_DDMM = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
});

/** Iniciais para o avatar (primeira + última palavra do nome). */
function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = p[0]?.[0] ?? "";
  const ultima = p.length > 1 ? (p[p.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase() || "•";
}

export default async function AcompanharEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await carregarEventoDono(id);
  if (event.status === "DRAFT") redirect(`/painel/${id}/publicar`);

  const host = hostDoEvento(event.subdomain);
  const url = urlDoEvento(event.subdomain);
  const base = `/painel/${event.id}`;

  const confirmados = await prisma.guest.findMany({
    where: { eventId: event.id, status: "CONFIRMED" },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const kpis = [
    { n: event._count.guests, label: "convidados confirmaram" },
    { n: event._count.recados, label: "recados de carinho" },
    { n: event.gifts.length, label: "presentes na lista" },
  ];

  const linksMenores = [
    { label: "Fotos", href: `${base}/fotos` },
    { label: "Presentes", href: `${base}/presentes` },
    { label: "Programação", href: `${base}/programacao` },
    { label: "Convidados", href: `${base}/convidados` },
  ];

  return (
    <div className={`${COLUNA} scv-fade py-9 pb-20 ${EVT_FONTS_CLASS}`}>
      {/* topo */}
      <div className="flex flex-wrap items-center gap-3.5">
        <Link href="/painel" aria-label="Voltar" className={BTN_VOLTAR}>
          <i className="bi bi-chevron-left" aria-hidden />
        </Link>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-scv-ink">
          {event.title}
        </h1>
        <span className={PILL_NO_AR}>No ar</span>
      </div>

      {/* barra do link */}
      <div className={`${CARD} mt-5 flex flex-wrap items-center gap-3 px-4 py-3`}>
        <i className="bi bi-link-45deg text-lg text-scv-violet" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[13.5px] text-scv-ink">{host}</span>
        <CopiarLink url={url} className={BTN_CARD} />
        <a href={url} target="_blank" rel="noopener noreferrer" className={BTN_FORTE}>
          Ver site ↗
        </a>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className={`${CARD} p-5`}>
            <div className="font-display text-[30px] font-semibold text-scv-ink">{k.n}</div>
            <div className="mt-1 text-[12.5px] text-scv-muted">{k.label}</div>
          </div>
        ))}
      </div>

      {/* corpo */}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        {/* confirmações recentes */}
        <div className={`${CARD} p-5 sm:p-6`}>
          <h2 className="text-[15px] font-semibold text-scv-ink">Confirmações recentes</h2>
          {confirmados.length === 0 ? (
            <p className="mt-4 text-[13.5px] leading-relaxed text-scv-muted">
              Ainda ninguém confirmou. Compartilhe o link do site e as confirmações aparecem
              aqui.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {confirmados.map((g) => (
                <li key={g.id} className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-scv-lilac text-[12.5px] font-bold text-scv-violet">
                    {iniciais(g.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-scv-ink">
                      {g.name}
                    </div>
                    <div className="text-[12px] text-scv-muted">
                      {g.companions > 0
                        ? `leva +${g.companions} acompanhante${g.companions === 1 ? "" : "s"}`
                        : "vai sozinho(a)"}
                    </div>
                  </div>
                  <span className="shrink-0 text-[12px] text-scv-faint">
                    {DATA_DDMM.format(g.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* capa + ações */}
        <div className="flex flex-col gap-4">
          <CapaEvento
            tema={lerTemaKey(event.customization)}
            fontes={lerFonteKey(event.customization)}
            nome={event.title}
            kicker={textosDoNicho(event.type).conviteTitulo}
            fotoUrl={lerCustomStr(event.customization, "fotoUrl")}
            altura={170}
            className="rounded-[18px]"
          />
          <div className="flex flex-col gap-2.5">
            <Link href={`${base}/detalhes`} className={`${BTN_PRIMARIO} block w-full text-center`}>
              Editar o site
            </Link>
            <Link
              href={`${base}/estilo`}
              className="block w-full rounded-xl border border-dashed border-violeta/50 bg-violeta/5 py-3 text-center text-[13.5px] font-semibold text-scv-violet transition hover:bg-violeta/10"
            >
              Trocar o estilo
            </Link>
            <Link href={`${base}/recursos`} className={`${BTN_CARD} block w-full text-center`}>
              Recursos do site
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-1 text-[12.5px]">
            {linksMenores.map((l, i) => (
              <span key={l.href} className="flex items-center gap-2">
                <Link
                  href={l.href}
                  className="font-semibold text-scv-violet transition hover:opacity-80"
                >
                  {l.label}
                </Link>
                {i < linksMenores.length - 1 ? (
                  <span aria-hidden className="text-scv-faint">
                    ·
                  </span>
                ) : null}
              </span>
            ))}
          </div>

          <form action={despublicarEvento} className="pt-1">
            <input type="hidden" name="eventId" value={event.id} />
            <button
              type="submit"
              className="text-[12.5px] font-medium text-scv-faint transition hover:text-scv-muted"
            >
              Tirar do ar
            </button>
          </form>
          <div className="pt-1">
            <ExcluirEvento eventId={event.id} titulo={event.title} />
          </div>
        </div>
      </div>
    </div>
  );
}
