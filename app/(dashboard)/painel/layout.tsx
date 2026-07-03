// Layout do PAINEL (mockup DARK): topbar centrada + conteudo em coluna de
// 1080px. Protege a area: sem sessao volta para /entrar. As paginas de auth
// (/entrar) ficam FORA daqui, no layout do grupo (dashboard), sem topbar.
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { TopBar } from "./TopBar";

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
    select: { name: true },
  });
  const nome = prof?.name ?? session.user.name ?? "";

  return (
    <>
      <TopBar nome={nome} />
      <main className="flex-1">{children}</main>
    </>
  );
}
