// /cadastrar — cadastro por e-mail e senha.
//
// Ate 21/08/2026 esta rota so REDIRECIONAVA para `/entrar?criar=1`, onde vivia a
// aba "Criar conta". A `/entrar` virou a tela nova (so Google), e o redirect
// deixaria quem clica em "Criar conta" na landing numa tela SEM cadastro
// nenhum. Entao o cartao com as abas passou a morar aqui.
//
// Quando o Google estiver ligado, a `/entrar` cria a conta sozinha no primeiro
// login e esta rota vira o caminho de quem prefere senha — continua valendo, e o
// `?plano=` da landing segue viajando ate o checkout.
import { Suspense } from "react";
import { googleConfigurado } from "@/lib/contaGoogle";
import { CardEntrar } from "../entrar/_CardEntrar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Criar conta · seuconvite" };

export default function CadastrarPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Suspense fallback={null}>
        <CardEntrar googleAtivo={googleConfigurado()} />
      </Suspense>
    </div>
  );
}
