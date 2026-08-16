// Rota que mora DENTRO do iframe da prévia do editor (`/painel/criar`).
//
// Não carrega nada do banco: todo o convite vem do documento canônico que o
// editor manda por postMessage (ver `lib/event-editor/preview-bridge`). O que
// esta rota existe para dar é um DOCUMENTO PRÓPRIO — é ele que faz o convite
// enxergar um viewport de celular (390px) ou de computador (1024px) de verdade
// dentro da moldura do aparelho.
//
// Fica fora de `/painel` de propósito: o layout do painel traria o "chrome" do
// dashboard para dentro da moldura.
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PreviaConvite } from "./PreviaConvite";

export const dynamic = "force-dynamic";

export default async function PreviaConvitePage() {
  const session = await auth();
  if (!session?.user) redirect("/entrar");
  return <PreviaConvite />;
}
