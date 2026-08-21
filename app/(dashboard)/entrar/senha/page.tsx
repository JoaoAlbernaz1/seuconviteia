// Esqueci minha senha.
//
// A tela de entrar (referência do dono) tem o link "Esqueci minha senha" ao lado
// do rótulo da senha. Recuperação AUTOMÁTICA por e-mail ainda não existe neste
// app: depende do envio de e-mail em produção, que hoje cai num stub e não sai.
//
// Esta página existe para o link não ser morto. Ela diz a verdade e entrega o
// caminho que funciona HOJE (falar com o suporte, que destrava a conta na mão),
// em vez de um formulário que promete um e-mail que nunca chega — que é
// exatamente o pior resultado possível para quem está trancado fora da conta.
//
// Quando o envio de e-mail entrar, o formulário de link mágico nasce AQUI, e a
// tela de entrar não precisa mudar.
import Link from "next/link";
import { EMPRESA } from "@/app/(marketing)/legal/dados-da-empresa";
import { CARD } from "../../painel/_ui/estilos";

export const metadata = { title: "Esqueci minha senha · seuconvite" };

export default function SenhaPage() {
  const assunto = encodeURIComponent("Destravar minha conta — seuconvite");
  const corpo = encodeURIComponent(
    "Olá! Perdi o acesso à minha conta do seuconvite.\n\n" +
      "E-mail da conta: \n" +
      "Nome no cadastro: \n",
  );

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-4">
      <div className={`${CARD} w-full max-w-[440px] p-8`}>
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-scv-ink">
          Esqueci minha senha
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-scv-muted">
          Ainda não temos a redefinição automática por e-mail. Para destravar sua conta,
          escreva para o suporte com o e-mail que você usou no cadastro — a gente responde
          e libera o acesso.
        </p>

        <a
          href={`mailto:${EMPRESA.email}?subject=${assunto}&body=${corpo}`}
          className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-violeta px-6 text-[14.5px] font-semibold !text-white shadow-[0_10px_24px_-12px_rgba(109,40,217,0.45)] transition-[filter] duration-200 hover:brightness-110"
        >
          <i className="bi bi-envelope" aria-hidden />
          Escrever para o suporte
        </a>

        <p className="mt-4 text-[12.5px] text-scv-faint">
          Suporte: <span className="font-semibold text-scv-muted">{EMPRESA.email}</span>
        </p>

        <Link
          href="/entrar"
          className="mt-6 inline-flex min-h-[44px] items-center gap-1.5 text-[13.5px] font-semibold !text-scv-muted hover:!text-scv-ink"
        >
          <i className="bi bi-chevron-left text-[12px]" aria-hidden />
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
