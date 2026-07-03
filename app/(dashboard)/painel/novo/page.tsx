// Criar evento — assistente de 4 passos. Os passos 1–3 vivem no cliente
// (Wizard); o passo 4 é a rota /painel/[id]/publicar. Se o plano já atingiu o
// limite de eventos, mostra o aviso com upgrade em vez do assistente.
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { limiteEventos, rotuloPlano } from "@/lib/plans";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { Wizard } from "./Wizard";
import { BTN_CARD, BTN_PRIMARIO, CARD, COLUNA_ESTREITA } from "../_ui/estilos";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export default async function NovoEventoPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const prof = await prisma.professional.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  const plan = prof?.plan ?? "BASICO";
  const limite = limiteEventos(plan);
  if (limite !== null) {
    const existentes = await prisma.event.count({
      where: { professionalId: session.user.id },
    });
    if (existentes >= limite) {
      return (
        <div className={`${COLUNA_ESTREITA} scv-fade py-16 text-center`}>
          <div className={`${CARD} p-8`}>
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-scv-lilac text-scv-violet">
              <i className="bi bi-collection text-xl" aria-hidden />
            </span>
            <h1 className="mt-4 font-display text-[26px] font-semibold text-scv-ink">
              Seu plano está cheio de festa
            </h1>
            <p className="mx-auto mt-2.5 max-w-[400px] text-[13.5px] leading-relaxed text-scv-muted">
              O plano {rotuloPlano(plan)} inclui até {limite} eventos — e você já
              usou todos. Para criar um novo site, exclua um que não usa mais ou
              faça upgrade (eventos ilimitados no Clássico).
            </p>
            <div className="mt-6 flex justify-center gap-2.5">
              <Link href="/painel" className={BTN_CARD}>
                Ver meus eventos
              </Link>
              <Link href="/painel/plano" className={`${BTN_PRIMARIO} px-7 py-2.5 text-[13px]`}>
                Ver planos
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  // Fontes das duplas para as capas dos estilos e o preview.
  return (
    <div className={EVT_FONTS_CLASS}>
      <Wizard rootDomain={ROOT_DOMAIN} />
    </div>
  );
}
