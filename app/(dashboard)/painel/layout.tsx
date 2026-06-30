// Layout do PAINEL (envolve /painel, /painel/novo, /painel/[id]/editar,
// /painel/perfil) no shell com sidebar (PainelShell). Protege a área: sem sessão
// volta para /entrar. As páginas de auth (/entrar, /cadastrar) ficam FORA daqui,
// no layout do grupo (dashboard), sem sidebar.
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PainelShell } from "./PainelShell";

export const dynamic = "force-dynamic";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const prof = await prisma.professional.findUnique({
    where: { id: session.user.id },
    select: { name: true, avatarUrl: true, brandName: true, plan: true },
  });
  const nome = prof?.name ?? session.user.name ?? "";

  return (
    <PainelShell
      nome={nome}
      avatarUrl={prof?.avatarUrl ?? undefined}
      brandName={prof?.brandName ?? undefined}
      plan={prof?.plan ?? "BASICO"}
    >
      {children}
    </PainelShell>
  );
}
