// Rota do editor guiado "Criar convite". A proteção de sessão vem do layout do
// painel (DashShell). Server component: busca o PLANO do dono e passa ao editor
// (para travar o modelo VITRINE fora dos planos pagos).
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { Plan } from "@/lib/plans";
import { CriarConvite } from "./CriarConvite";

export const dynamic = "force-dynamic";

export default async function CriarConvitePage() {
  const session = await auth();
  let plano: Plan = "BASICO";
  if (session?.user?.id) {
    const prof = await prisma.professional.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    if (prof) plano = prof.plan;
  }
  return <CriarConvite plano={plano} />;
}
