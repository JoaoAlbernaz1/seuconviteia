// Entrar / Criar conta — a casca (SERVIDOR).
//
// Serve para uma coisa só, mas ela é importante: só o servidor sabe se as
// credenciais do Google existem (`googleConfigurado`), e é isso que decide se o
// botão "Continuar com Google" é desenhado. Botão social sem credencial leva a
// uma página de erro do Auth.js — na porta de entrada, isso é pior do que não
// ter o botão.
import { Suspense } from "react";
import { googleConfigurado } from "@/lib/contaGoogle";
import { CardEntrar } from "./_CardEntrar";

// DINÂMICA de propósito. Esta página lê `process.env` para decidir se desenha o
// botão do Google — e página estática é renderizada no BUILD, com o ambiente
// daquele momento. Na Vercel, adicionar uma env var NÃO refaz o build: a decisão
// ficaria congelada em "não tem Google" até o próximo deploy, e ninguém
// entenderia por que o botão não aparece depois de configurar tudo certo.
export const dynamic = "force-dynamic";

export default function EntrarPage() {
  const googleAtivo = googleConfigurado();
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Suspense fallback={null}>
        <CardEntrar googleAtivo={googleAtivo} />
      </Suspense>
    </div>
  );
}
