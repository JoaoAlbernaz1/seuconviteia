// Compatibilidade com links antigos: a configuração específica de domínio fica
// para a próxima feature. Por enquanto, tudo abre o editor guiado em uso.
import { redirect } from "next/navigation";
import { hrefDoEditorDominio } from "@/lib/navPainel";

export default async function ConfiguracoesConvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(hrefDoEditorDominio(id));
}
