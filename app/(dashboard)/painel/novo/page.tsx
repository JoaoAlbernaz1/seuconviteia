// Rota ANTIGA de criacao (assistente de 4 passos). Aposentada a pedido do Joao
// (12/08/2026): criar convite acontece SO no editor guiado `/painel/criar`, que
// tem previa ao vivo. Esta rota fica de pe apenas para nao quebrar link velho,
// favorito ou historico do navegador — e manda direto pro editor.
//
// O limite de convites do plano continua valendo: quem grava e a action
// `salvarDocumentoConvite` (`../criar/acoes.ts`), que barra com mensagem propria.
import { redirect } from "next/navigation";

export default function NovoEventoPage() {
  redirect("/painel/criar");
}
