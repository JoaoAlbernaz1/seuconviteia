// Criar evento — assistente de 4 passos (mockup DARK). Os passos 1–3 vivem no
// cliente (Wizard); o passo 4 é a rota /painel/[id]/publicar (o rascunho já
// existe no banco a essa altura).
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EVT_FONTS_CLASS } from "@/app/evt-fonts";
import { Wizard } from "./Wizard";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export default async function NovoEventoPage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");

  // Fontes das duplas para as capas dos estilos e o preview.
  return (
    <div className={EVT_FONTS_CLASS}>
      <Wizard rootDomain={ROOT_DOMAIN} />
    </div>
  );
}
