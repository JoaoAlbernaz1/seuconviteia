// "Meus convites" — o lugar único para VER e EDITAR todos os convites do
// profissional. Grade de cards (capa real ou gradiente da paleta + nome, tipo,
// data, status) com ações Editar (tela de gestão do convite) e Ver (site no ar),
// mais "Novo convite". Mesmo visual do Dashboard (Claude Design, roxo #7C3AED).
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { eventPublicUrl } from "@/lib/tenant";
import { TIPO_LABEL } from "@/lib/painelUi";
import { Ic, IC } from "../_shell/Ic";
import { CapaEvento } from "../_ui/CapaEvento";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

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

  const eventos = await prisma.event.findMany({
    where: { professionalId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="dash-fade mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-10 sm:py-9">
      {/* HEADER */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[27px] font-bold tracking-[-0.025em]">Meus convites</h1>
          <p className="mt-1.5 text-[14.5px] text-[#6e6e76]">
            Veja, edite e publique todos os seus convites em um só lugar.
          </p>
        </div>
        <Link
          href="/painel/criar"
          className="flex items-center gap-2.5 rounded-[13px] bg-[#7C3AED] px-[22px] py-3 text-[14.5px] font-semibold !text-white transition-colors hover:bg-[#6D28D9]"
        >
          <Ic d={IC.plus} size={15} stroke="#fff" width={2} />
          Novo convite
        </Link>
      </div>

      {eventos.length === 0 ? (
        /* ESTADO VAZIO */
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
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {eventos.map((ev) => {
            const publicado = ev.status === "PUBLISHED";
            const kicker = TIPO_LABEL[ev.type] ?? ev.type;
            const fotoUrl = lerCustomStr(ev.customization, "fotoUrl");
            const tema = lerCustomStr(ev.customization, "tema");
            const fontes = lerCustomStr(ev.customization, "fontes");
            const local = lerCustomStr(ev.customization, "local");
            const url = eventPublicUrl(ev.subdomain, ROOT_DOMAIN);

            return (
              <div
                key={ev.id}
                className="flex flex-col overflow-hidden rounded-[20px] border border-[#ececf0] bg-white shadow-[0_2px_10px_rgba(23,23,27,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#DCCDFB] hover:shadow-[0_12px_28px_rgba(124,58,237,0.10)]"
              >
                {/* CAPA (foto real ou gradiente da paleta) + badge de status */}
                <div className="relative">
                  <CapaEvento tema={tema} fontes={fontes} nome={ev.title} kicker={kicker} fotoUrl={fotoUrl} altura={150} />
                  <span
                    className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm ${
                      publicado ? "bg-[#34A177]/90 text-white" : "bg-white/90 text-[#7C3AED]"
                    }`}
                  >
                    {publicado ? "Publicado" : "Em criação"}
                  </span>
                </div>

                {/* INFOS + AÇÕES */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-[16px] font-bold tracking-[-0.01em]">{ev.title}</div>
                  <div className="mt-1 line-clamp-2 text-[13px] text-[#6e6e76]">
                    {local ? `${local} · ` : ""}
                    {DATA_LONGA.format(ev.eventDate)}
                  </div>

                  <div className="mt-4 flex items-center gap-2.5 pt-1">
                    <Link
                      href={`/painel/${ev.id}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-[11px] bg-[#7C3AED] px-4 py-2.5 text-[13.5px] font-semibold !text-white transition-colors hover:bg-[#6D28D9]"
                    >
                      <Ic d={IC.edit} size={14} stroke="#fff" width={2} />
                      Editar
                    </Link>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 rounded-[11px] border border-[#ececf0] bg-white px-4 py-2.5 text-[13.5px] font-semibold text-[#17171b] transition-colors hover:bg-[#f4f4f6]"
                    >
                      <Ic d={IC.eye} size={14} stroke="#17171b" />
                      Ver
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
