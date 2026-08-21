// "Esqueci minha senha" — pedir o link.
//
// Mora em `(dashboard)` porque é a mesma casca clara do painel (tokens `.scv`) e
// vizinha de `/entrar`, que é de onde a pessoa chega.
import { CARD } from "../../painel/_ui/estilos";
import { Pedir } from "./Pedir";

export const metadata = { title: "Esqueci minha senha · seuconvite" };

export default function SenhaPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-4">
      <div className={`${CARD} w-full max-w-[420px] p-8`}>
        <Pedir />
      </div>
    </div>
  );
}
