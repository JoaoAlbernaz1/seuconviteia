// "Meus convites" — a lista de tudo que o profissional já criou. Grade de cards
// (capa real ou gradiente da paleta + nome, data, estado) com ações Gerenciar
// (tela do convite) e Ver (site no ar), mais "Novo convite" e a SELEÇÃO MÚLTIPLA
// para apagar vários (ver ListaConvites).
//
// Esta tela NAO edita e nao promete editar: publicou, fecha (ver lib/edicao).
// Por isso ela carrega tambem `foraDoAr`/`edicaoAte` — o card so consegue dizer
// a verdade sobre um convite se souber em qual dos quatro estados ele esta e se
// a janela de edicao esta aberta agora.
// Mesmo visual do Dashboard (Claude Design, roxo #7C3AED).
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { eventPublicUrl, rootDomain } from "@/lib/tenant";
import { conviteEncerrado } from "@/lib/event";
import { edicaoAberta } from "@/lib/edicao";
import { TIPO_LABEL } from "@/lib/painelUi";
import { planoEfetivo, podeCriarEvento, SELECT_ASSINATURA } from "@/lib/plans";
import { Ic, IC } from "../_shell/Ic";
import { ListaConvites, type EstadoConvite, type ItemConvite } from "./ListaConvites";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = rootDomain();

const DATA_LONGA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function lerCustomStr(c: unknown, k: string): string | undefined {
  if (c && typeof c === "object" && k in c) {
    const v = (c as Record<string, unknown>)[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/**
 * Em qual dos quatro estados este convite esta AGORA.
 *
 * A ordem das perguntas e a regra. "Festa encerrada" vem antes de "fora do ar"
 * porque um convite pode ser as duas coisas, e a que manda e a definitiva: o
 * dono pode religar o que ele mesmo pausou, mas nao pode desencerrar a festa.
 */
function estadoDoConvite(
  ev: { status: string; expiresAt: Date; foraDoAr: boolean },
  agora: Date,
): EstadoConvite {
  if (ev.status === "DRAFT") return "rascunho";
  if (conviteEncerrado(ev, agora)) return "encerrada";
  if (ev.foraDoAr) return "fora-do-ar";
  return "no-ar";
}

export default async function MeusConvitesPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const agora = new Date();
  const [eventos, prof] = await Promise.all([
    prisma.event.findMany({
      where: { professionalId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.professional.findUnique({
      where: { id: session.user.id },
      select: SELECT_ASSINATURA,
    }),
  ]);
  // Vaga no plano: convite vencido nao ocupa lugar (festa que ja passou).
  const podeCriar = podeCriarEvento(
    prof ? planoEfetivo(prof, agora) : "BASICO",
    eventos.filter((e) => e.expiresAt > agora).length,
  );

  if (eventos.length === 0) {
    return (
      <div className="dash-fade mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-10 sm:py-9">
        <div className="mb-7">
          <h1 className="text-[27px] font-bold tracking-[-0.025em]">Meus convites</h1>
          <p className="mt-1.5 text-[14.5px] text-[#6e6e76]">
            Acompanhe seus convites e continue os rascunhos.
          </p>
        </div>
        <div className="rounded-[20px] border border-[#ececf0] bg-white px-10 py-14 text-center shadow-[0_2px_10px_rgba(23,23,27,0.04)]">
          <span className="mx-auto mb-5 grid size-[58px] place-items-center rounded-full bg-[#F3EFFE]">
            <Ic d={IC.mail} size={24} stroke="#7C3AED" width={1.8} />
          </span>
          <div className="text-xl font-bold tracking-[-0.02em]">Você ainda não tem convites</div>
          <div className="mx-auto mt-2 max-w-md text-sm text-[#6e6e76]">
            Crie o primeiro convite e ele aparece aqui para você acompanhar.
          </div>
          <Link
            href="/painel/criar"
            className="mt-6 inline-block rounded-[13px] bg-[#7C3AED] px-[26px] py-3.5 text-[14.5px] font-semibold !text-white transition-colors hover:bg-[#6D28D9]"
          >
            Criar meu primeiro convite
          </Link>
        </div>
      </div>
    );
  }

  const items: ItemConvite[] = eventos.map((ev) => ({
    id: ev.id,
    title: ev.title,
    estado: estadoDoConvite(ev, agora),
    // A janela de edicao NAO se deduz do status: publicado e aberto convivem
    // (a cortesia de 1h e o passe pago). Quem perguntasse ao status pintaria
    // "Edicao fechada" em cima de um convite que a pessoa acabou de liberar.
    edicaoLiberada: edicaoAberta(ev, agora),
    kicker: TIPO_LABEL[ev.type] ?? ev.type,
    fotoUrl: lerCustomStr(ev.customization, "fotoUrl"),
    tema: lerCustomStr(ev.customization, "tema"),
    fontes: lerCustomStr(ev.customization, "fontes"),
    local: lerCustomStr(ev.customization, "local"),
    url: eventPublicUrl(ev.subdomain, ROOT_DOMAIN),
    dataLabel: DATA_LONGA.format(ev.eventDate),
  }));

  return <ListaConvites items={items} podeCriar={podeCriar} />;
}
