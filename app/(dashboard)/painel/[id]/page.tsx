// Acompanhar o evento (site já no ar): um cartão-herói com a prévia + link +
// ação principal, KPIs com ícone, confirmações recentes e um menu único e
// consistente para gerenciar cada parte do site. Ações destrutivas ficam
// agrupadas numa zona própria no rodapé. Rascunho ainda não publicado não abre
// aqui: gerenciar é para site no ar, então volta para "Meus convites" (a edição
// do rascunho acontece no editor).
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
  BTN_GHOST,
  CARD,
  COLUNA,
  PILL_NO_AR,
  BTN_VOLTAR,
} from "../_ui/estilos";

export const dynamic = "force-dynamic";

const DATA_DDMM = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
});

const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "numeric",
  month: "long",
  year: "numeric",
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
  if (event.status === "DRAFT") redirect("/painel/convites");

  const host = hostDoEvento(event.subdomain);
  const url = urlDoEvento(event.subdomain);
  const base = `/painel/${event.id}`;

  const local = lerCustomStr(event.customization, "local");
  const subtitulo = [local, DATA_LONGA.format(event.eventDate)]
    .filter(Boolean)
    .join(" · ");

  const confirmados = await prisma.guest.findMany({
    where: { eventId: event.id, status: "CONFIRMED" },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const kpis = [
    { n: event._count.guests, label: "confirmaram presença", icon: "bi-check2-circle" },
    { n: event._count.recados, label: "recados de carinho", icon: "bi-chat-heart" },
    { n: event.gifts.length, label: "presentes na lista", icon: "bi-gift" },
  ];

  const menu = [
    { label: "Fotos", desc: "Capa e galeria do site", href: `${base}/fotos`, icon: "bi-images" },
    { label: "Presentes", desc: "Lista e recebimento por Pix", href: `${base}/presentes`, icon: "bi-gift" },
    { label: "Programação", desc: "Os momentos da festa", href: `${base}/programacao`, icon: "bi-calendar2-event" },
    { label: "Convidados", desc: "Lista e confirmações", href: `${base}/convidados`, icon: "bi-people" },
    { label: "Recursos do site", desc: "Ative e oculte seções", href: `${base}/recursos`, icon: "bi-sliders2" },
  ];

  return (
    <div className={`${COLUNA} scv-fade py-9 pb-20 ${EVT_FONTS_CLASS}`}>
      {/* topo */}
      <div className="flex flex-wrap items-center gap-3.5">
        <Link href="/painel" aria-label="Voltar" className={BTN_VOLTAR}>
          <i className="bi bi-chevron-left" aria-hidden />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="truncate font-display text-[28px] font-semibold tracking-tight text-scv-ink">
              {event.title}
            </h1>
            <span className={PILL_NO_AR}>No ar</span>
          </div>
          {subtitulo ? (
            <p className="mt-0.5 truncate text-[13px] text-scv-muted">{subtitulo}</p>
          ) : null}
        </div>
      </div>

      {/* cartão-herói: prévia + link + ação principal */}
      <div className={`${CARD} mt-6`}>
        <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-stretch sm:gap-6 sm:p-6">
          <div className="shrink-0 overflow-hidden rounded-[16px] ring-1 ring-black/5 sm:w-[300px]">
            <CapaEvento
              tema={lerTemaKey(event.customization)}
              fontes={lerFonteKey(event.customization)}
              nome={event.title}
              kicker={textosDoNicho(event.type).conviteTitulo}
              fotoUrl={lerCustomStr(event.customization, "fotoUrl")}
              altura={180}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-scv-teal">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-scv-teal/60 motion-safe:animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-scv-teal" />
              </span>
              Seu convite está no ar
            </div>

            {/* link público */}
            <div className="mt-3 flex flex-wrap items-center gap-2.5 rounded-xl border border-scv-line bg-scv-field px-3.5 py-2.5">
              <i className="bi bi-link-45deg text-lg text-scv-violet" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-scv-ink">{host}</span>
              <CopiarLink url={url} className={BTN_CARD} />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${BTN_FORTE} !text-white`}
              >
                Ver site ↗
              </a>
            </div>

            {/* ações principais */}
            <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-4">
              <Link
                href={`${base}/detalhes`}
                className="group inline-flex items-center gap-3 rounded-xl bg-violeta py-3.5 pl-5 pr-3.5 text-[14.5px] font-semibold !text-white shadow-[0_10px_24px_-12px_rgba(109,40,217,0.45)] transition-[filter,box-shadow,transform] duration-200 hover:brightness-110 hover:shadow-[0_14px_30px_-12px_rgba(109,40,217,0.5)] active:scale-[0.99]"
              >
                Editar o site
                <span className="grid size-7 place-items-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5">
                  <i className="bi bi-arrow-right text-[13px]" aria-hidden />
                </span>
              </Link>
              <Link href={`${base}/estilo`} className={BTN_GHOST}>
                <i className="bi bi-palette mr-1.5" aria-hidden />
                Trocar o estilo
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className={`${CARD} flex items-center gap-4 p-5`}>
            <span className="grid size-11 shrink-0 place-items-center rounded-[13px] bg-scv-lilac text-scv-violet">
              <i className={`bi ${k.icon} text-lg`} aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="font-display text-[28px] font-semibold leading-none text-scv-ink">
                {k.n}
              </div>
              <div className="mt-1.5 text-[12.5px] text-scv-muted">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* corpo */}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        {/* confirmações recentes */}
        <div className={`${CARD} p-5 sm:p-6`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-scv-ink">Confirmações recentes</h2>
            {confirmados.length > 0 ? (
              <Link
                href={`${base}/convidados`}
                className="shrink-0 text-[12.5px] font-semibold text-scv-violet transition-opacity hover:opacity-80"
              >
                Ver todos →
              </Link>
            ) : null}
          </div>
          {confirmados.length === 0 ? (
            <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-dashed border-scv-dash/70 bg-scv-field py-10 text-center">
              <span className="grid size-11 place-items-center rounded-full bg-scv-lilac text-scv-violet">
                <i className="bi bi-people text-lg" aria-hidden />
              </span>
              <p className="max-w-[280px] text-[13px] leading-relaxed text-scv-muted">
                Ainda ninguém confirmou. Compartilhe o link do site e as confirmações
                aparecem aqui na hora.
              </p>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-1">
              {confirmados.map((g) => (
                <li
                  key={g.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-scv-field"
                >
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

        {/* menu único: gerenciar o site */}
        <div className={`${CARD} overflow-hidden`}>
          <div className="border-b border-scv-line px-5 py-4">
            <h2 className="text-[15px] font-semibold text-scv-ink">Gerenciar o site</h2>
            <p className="mt-0.5 text-[12.5px] text-scv-muted">Edite cada parte do convite</p>
          </div>
          <div className="flex flex-col">
            {menu.map((m, i) => (
              <Link
                key={m.href}
                href={m.href}
                className={`group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-scv-field ${
                  i > 0 ? "border-t border-scv-line/70" : ""
                }`}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-scv-lilac text-scv-violet">
                  <i className={`bi ${m.icon}`} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-scv-ink">
                    {m.label}
                  </span>
                  <span className="block truncate text-[12px] text-scv-muted">{m.desc}</span>
                </span>
                <i
                  className="bi bi-chevron-right text-scv-faint transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* zona de ajustes / risco */}
      <div className="mt-8 flex flex-col gap-3.5 rounded-2xl border border-scv-line/80 bg-scv-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-scv-ink">Ajustes do site</div>
          <div className="text-[12px] text-scv-muted">
            Tire o convite do ar temporariamente ou apague de vez.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <form action={despublicarEvento}>
            <input type="hidden" name="eventId" value={event.id} />
            <button
              type="submit"
              className="inline-flex cursor-pointer items-center gap-1.5 text-[12.5px] font-medium text-scv-muted transition-colors duration-200 hover:text-scv-ink"
            >
              <i className="bi bi-pause-circle" aria-hidden />
              Tirar do ar
            </button>
          </form>
          <span className="hidden h-4 w-px bg-scv-line sm:block" aria-hidden />
          <ExcluirEvento eventId={event.id} titulo={event.title} />
        </div>
      </div>
    </div>
  );
}
