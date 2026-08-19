// "Meus convites" — o lugar único para VER e EDITAR todos os convites do
// profissional. Grade de cards (capa real ou gradiente da paleta + nome, tipo,
// data, status) com ações Editar (tela de gestão do convite) e Ver (site no ar),
// mais "Novo convite" e a SELEÇÃO MÚLTIPLA para apagar vários (ver ListaConvites).
// Mesmo visual do Dashboard (Claude Design, roxo #7C3AED).
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { eventPublicUrl, rootDomain } from "@/lib/tenant";
import { TIPO_LABEL } from "@/lib/painelUi";
import { planoEfetivo, podeCriarEvento, SELECT_ASSINATURA } from "@/lib/plans";
import { Ic, IC } from "../_shell/Ic";
import { ListaConvites, type ItemConvite } from "./ListaConvites";

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
            Veja, edite e publique todos os seus convites em um só lugar.
          </p>
        </div>
        <div className="rounded-[20px] border border-[#ececf0] bg-white px-10 py-14 text-center shadow-[0_2px_10px_rgba(23,23,27,0.04)]">
          <span className="mx-auto mb-5 grid size-[58px] place-items-center rounded-full bg-[#F3EFFE]">
            <Ic d={IC.mail} size={24} stroke="#7C3AED" width={1.8} />
          </span>
          <div className="text-xl font-bold tracking-[-0.02em]">Você ainda não tem convites</div>
          <div className="mx-auto mt-2 max-w-md text-sm text-[#6e6e76]">
            Crie o primeiro convite e ele aparece aqui para você ver e editar quando quiser.
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
    publicado: ev.status === "PUBLISHED",
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
