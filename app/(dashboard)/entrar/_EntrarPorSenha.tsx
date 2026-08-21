"use client";

// A PORTA DE EMERGÊNCIA da tela de entrar.
//
// O desenho pedido tem só "Continuar com Google". Este formulário existe para um
// caso e um só: as credenciais do Google ainda NÃO estarem configuradas. Sem ele,
// nessa janela a tela ficaria sem nenhuma porta — e as contas que hoje entram por
// senha (a do dono e a `demo`, que os testes usam) ficariam trancadas fora do
// painel, com o site no ar.
//
// Some sozinho no instante em que `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`
// existirem: quem decide é o servidor, em `page.tsx`.
//
// Vestido com o mesmo escuro da tela (o `INPUT` do painel é claro e brigaria com
// o fundo), e discreto de propósito — ele não é o caminho principal.
import Link from "next/link";
import { useActionState } from "react";
import { entrarComCredenciais, type LoginState } from "../actions";

const CAMPO =
  "h-[50px] w-full rounded-[11px] border border-white/10 bg-white/[0.04] px-4 text-[15px] text-white outline-none transition placeholder:text-white/30 focus:border-[#7C3AED] focus:bg-white/[0.06]";

export function EntrarPorSenha() {
  const [estado, acao, pendente] = useActionState<LoginState, FormData>(entrarComCredenciais, {});

  return (
    <div className="mt-9">
      <p className="mb-4 rounded-[11px] border border-[#7C3AED]/25 bg-[#7C3AED]/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#C4B5FD]">
        O acesso com Google entra em serviço assim que as credenciais forem
        configuradas. Até lá, entre com e-mail e senha.
      </p>

      <form action={acao} className="flex flex-col gap-3">
        <input
          name="email"
          type="email"
          placeholder="E-mail"
          autoComplete="email"
          required
          className={CAMPO}
        />
        <input
          name="password"
          type="password"
          placeholder="Senha"
          autoComplete="current-password"
          required
          className={CAMPO}
        />
        {estado.error ? (
          <p role="alert" className="text-[12.5px] font-semibold text-[#FF2D8D]">
            {estado.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pendente}
          className="mt-1 flex h-[54px] w-full cursor-pointer items-center justify-center rounded-[11px] bg-white text-[15.5px] font-semibold text-[#0B0B0D] transition-colors duration-200 hover:bg-[#ECECEC] disabled:opacity-60"
        >
          {pendente ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <div className="mt-3 flex items-center justify-between text-[12.5px]">
        <Link href="/entrar/senha" className="!text-[#C4B5FD] hover:!underline">
          Esqueci minha senha
        </Link>
        <Link href="/cadastrar" className="!text-white/40 hover:!text-white/70">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
