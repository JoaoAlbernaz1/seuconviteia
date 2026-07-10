// Home do painel — "Meus eventos": saudacao + resumo em blocos + busca/filtro +
// grade com um card por evento, em quatro estados (rascunho, no ar, no ar com
// pendencia, expirado). Sem sidebar: tudo em coluna central sob a topbar.
//
// A logica vive em modulos puros e testados (lib/frases, lib/painelEstado,
// lib/filtroEventos). Aqui so tem composicao.
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { lerTemaKey } from "@/lib/temas";
import { lerFonteKey } from "@/lib/fontes";
import { textosDoNicho } from "@/lib/textos";
import { TIPO_LABEL } from "@/lib/painelUi";
import { limiteEventos } from "@/lib/plans";
import { fraseResumo } from "@/lib/frases";
import { estadoDoEvento, pendenciaDoEvento } from "@/lib/painelEstado";
import { COLUNA, TITULO } from "./_ui/estilos";
import { ResumoBlocos } from "./_ui/ResumoBlocos";
import { EstadoVazio } from "./_ui/EstadoVazio";
import { FiltroEventos } from "./_ui/FiltroEventos";

export const dynamic = "force-dynamic";

function lerCustomStr(c: unknown, k: string): string | undefined {
  if (c && typeof c === "object" && k in c) {
    const v = (c as Record<string, unknown>)[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return undefined;
}

export default async function MeusEventosPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const [prof, events] = await Promise.all([
    prisma.professional.findUnique({
      where: { id: session.user.id },
      select: { name: true, plan: true },
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

  const agora = new Date();
  const primeiro = (prof?.name ?? "").split(" ")[0] || "você";

  // Um unico passe: deriva estado e pendencia de cada evento.
  const itens = events.map((e) => {
    const fotoUrl = lerCustomStr(e.customization, "fotoUrl");
    const pendencia = pendenciaDoEvento(Boolean(fotoUrl), e._count.gifts);
    return {
      id: e.id,
      titulo: e.title,
      estado: estadoDoEvento(e, pendencia, agora),
      criadoEm: e.createdAt,
      dataEvento: e.eventDate,
      expiraEm: e.expiresAt,
      presencas: e._count.guests,
      pendencia,
      nicho: TIPO_LABEL[e.type] ?? e.type,
      kicker: textosDoNicho(e.type).conviteTitulo,
      tema: lerTemaKey(e.customization),
      fontes: lerFonteKey(e.customization),
      fotoUrl,
    };
  });

  // "No ar" conta quem esta publicado E dentro do prazo. Antes era
  // `status === "PUBLISHED"`, entao um evento vencido era contado como no ar.
  const noAr = itens.filter(
    (i) => i.estado === "NO_AR" || i.estado === "NO_AR_PENDENTE",
  ).length;
  const presencas = itens.reduce((a, i) => a + i.presencas, 0);
  const recados = events.reduce((a, e) => a + e._count.recados, 0);

  const limite = limiteEventos(prof?.plan ?? "BASICO");
  const noLimite = limite !== null && events.length >= limite;

  return (
    <div className={`${COLUNA} scv-fade py-11 pb-20 ${EVT_FONTS_CLASS}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={`${TITULO} text-[34px]`}>Olá, {primeiro}</h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-scv-muted">
            {events.length === 0
              ? "Sua jornada para o evento perfeito começa aqui."
              : fraseResumo(noAr, presencas, recados)}
          </p>
        </div>

        {events.length > 0 && !noLimite && (
          <Link
            href="/painel/novo"
            className="rounded-full bg-preto px-5 py-3 text-[13.5px] font-semibold text-white transition hover:brightness-125"
          >
            + Criar novo evento
          </Link>
        )}
      </div>

      <ResumoBlocos sites={noAr} presencas={presencas} recados={recados} />

      {events.length === 0 ? (
        <EstadoVazio />
      ) : (
        <>
          {noLimite && (
            <div className="mt-6 rounded-[16px] border border-scv-line bg-cinza px-5 py-4 text-[13.5px] text-preto">
              Você chegou ao limite de {limite} eventos do seu plano.{" "}
              <Link
                href="/painel/plano"
                className="font-semibold underline underline-offset-2"
              >
                Ver planos
              </Link>{" "}
              para criar mais.
            </div>
          )}

          {/* `itens` e serializavel (string/number/Date). Uma funcao aqui
              quebraria: nao atravessa a fronteira Server -> Client. */}
          <FiltroEventos itens={itens} />
        </>
      )}
    </div>
  );
}
