// Criar evento — protegido. Carrega os templates (por nicho) no servidor e
// delega o fluxo (selecao + form) ao client component `NovoEventoForm`.
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import NovoEventoForm from "./NovoEventoForm";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export default async function NovoEventoPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  const templates = await prisma.template.findMany({
    orderBy: { name: "asc" },
  });

  const templatesData = templates.map((t) => ({
    id: t.id,
    name: t.name,
    nicho: t.nicho as string,
    accent: (t.config as { accent?: string } | null)?.accent ?? "#6D28D9",
  }));

  return <NovoEventoForm templates={templatesData} rootDomain={ROOT_DOMAIN} />;
}
