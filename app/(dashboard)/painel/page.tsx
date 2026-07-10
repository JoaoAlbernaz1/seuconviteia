// Home do painel — "Meus eventos" (mockup DARK): saudação + resumo real +
// grade com o card "Criar novo evento" e um card por evento (capa com a foto
// real ou o gradiente da paleta, nome na fonte do evento, status e próximo
// passo). Sem sidebar: tudo em coluna central.
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { lerTemaKey } from "@/lib/temas";
import { lerFonteKey } from "@/lib/fontes";
import { textosDoNicho } from "@/lib/textos";
import { TIPO_LABEL } from "@/lib/painelUi";
import { CapaEvento } from "./_ui/CapaEvento";
import { COLUNA, PILL_NO_AR, PILL_PREPARO, TITULO } from "./_ui/estilos";

export const dynamic = "force-dynamic";

function lerCustomStr(c: unknown, k: string): string | undefined {
  if (c && typeof c === "object" && k in c) {
    const v = (c as Record<string, unknown>)[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

const DATA_CURTA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function MeusEventosPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const [prof, events] = await Promise.all([
    prisma.professional.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    }),
    prisma.event.findMany({
      where: { professionalId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            guests: { where: { status: "CONFIRMED" } },
            recados: true,
            gifts: true,
            photos: true,
          },
        },
      },
    }),
  ]);

  const primeiro = (prof?.name ?? "").split(" ")[0] || "você";
  const noAr = events.filter((e) => e.status === "PUBLISHED").length;
  const confirmadas = events.reduce((a, e) => a + e._count.guests, 0);
  const recados = events.reduce((a, e) => a + e._count.recados, 0);
  const resumo =
    events.length === 0
      ? "Seu primeiro site de evento está a 4 passos daqui."
      : `${noAr} site${noAr === 1 ? "" : "s"} no ar · ${confirmadas} presença${
          confirmadas === 1 ? "" : "s"
        } confirmada${confirmadas === 1 ? "" : "s"} · ${recados} recado${
          recados === 1 ? "" : "s"
        } de carinho`;

  return (
    <div className={`${COLUNA} scv-fade py-11 pb-20 ${EVT_FONTS_CLASS}`}>
      <h1 className={`${TITULO} text-[34px]`}>Olá, {primeiro}</h1>
      <p className="mt-2.5 text-[15px] leading-relaxed text-scv-muted">{resumo}</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/painel/novo"
          className="flex min-h-[280px] flex-col items-center justify-center gap-3.5 rounded-[20px] border-[1.5px] border-dashed border-scv-dash bg-violeta/5 text-center transition hover:border-violeta hover:bg-violeta/10"
        >
          <span className="grid size-[54px] place-items-center rounded-full bg-violeta text-white shadow-[0_12px_26px_-8px_rgba(122,64,237,0.5)]">
            <i className="bi bi-plus-lg text-xl" aria-hidden />
          </span>
          <span className="text-base font-semibold text-scv-ink">Criar novo evento</span>
          <span className="max-w-[200px] text-[12.5px] leading-normal text-scv-muted">
            Em 4 passos simples seu site fica pronto
          </span>
        </Link>

        {events.map((e) => {
          const publicado = e.status === "PUBLISHED";
          const tema = lerTemaKey(e.customization);
          const fontes = lerFonteKey(e.customization);
          const fotoUrl = lerCustomStr(e.customization, "fotoUrl");
          const nicho = TIPO_LABEL[e.type] ?? e.type;
          const kicker = textosDoNicho(e.type).conviteTitulo;
          const faltando = !fotoUrl
            ? "faltam as fotos"
            : e._count.gifts === 0
              ? "falta a lista de presentes"
              : null;
          const dica = publicado
            ? `${e._count.guests} convidado${e._count.guests === 1 ? "" : "s"} confirmaram${
                faltando ? ` · ${faltando}` : ""
              }`
            : "Continue de onde parou — falta pouco";
          return (
            <div
              key={e.id}
              className="flex flex-col overflow-hidden rounded-[20px] border border-scv-line bg-scv-card shadow-[0_16px_40px_-32px_rgba(15,23,42,0.12)]"
            >
              <CapaEvento
                tema={tema}
                fontes={fontes}
                nome={e.title}
                kicker={kicker}
                fotoUrl={fotoUrl}
                altura={140}
              >
                <span
                  className={`absolute right-2.5 top-2.5 ${publicado ? PILL_NO_AR : PILL_PREPARO} !bg-white/95 ${
                    publicado ? "!text-[#0EA5A6]" : "!text-[#B45309]"
                  }`}
                >
                  {publicado ? "No ar" : "Em preparação"}
                </span>
              </CapaEvento>
              <div className="flex flex-1 flex-col gap-3 p-4 pb-[18px]">
                <div>
                  <div className="text-[13px] font-semibold text-scv-ink">
                    {nicho} · {DATA_CURTA.format(e.eventDate)}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-scv-muted">
                    <span
                      aria-hidden
                      className={`size-[7px] shrink-0 rounded-full ${
                        publicado ? "bg-teal" : "bg-amber-500"
                      }`}
                    />
                    {dica}
                  </div>
                </div>
                <Link
                  href={publicado ? `/painel/${e.id}` : `/painel/${e.id}/publicar`}
                  className={`mt-auto w-full rounded-[11px] py-2.5 text-center text-[13.5px] font-semibold transition ${
                    publicado
                      ? "border border-scv-line bg-scv-card text-scv-ink hover:border-scv-dash"
                      : "bg-violeta text-white shadow-[0_10px_22px_-10px_rgba(122,64,237,0.55)] hover:brightness-110"
                  }`}
                >
                  {publicado ? "Ver e editar" : "Continuar montando"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
