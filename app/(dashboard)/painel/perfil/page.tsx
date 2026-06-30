// Pagina de PERFIL do profissional — protegida e isolada por sessao. Carrega o
// Professional logado e reusa o `PerfilForm` (client) com a action `atualizarPerfil`.
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PerfilForm } from "./PerfilForm";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const prof = await prisma.professional.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, brandName: true, avatarUrl: true },
  });
  if (!prof) redirect("/entrar");

  return (
    <PerfilForm
      initial={{
        name: prof.name,
        email: prof.email,
        brandName: prof.brandName ?? "",
        avatarUrl: prof.avatarUrl ?? "",
      }}
    />
  );
}
