// Rota do editor guiado "Criar convite" (Claude Design). A proteção de sessão
// vem do layout do painel (DashShell); aqui só montamos o editor client.
import { CriarConvite } from "./CriarConvite";

export const dynamic = "force-dynamic";

export default function CriarConvitePage() {
  return <CriarConvite />;
}
