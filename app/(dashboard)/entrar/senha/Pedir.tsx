"use client";

// Formulário de "esqueci minha senha".
//
// A resposta é a MESMA para conta existente e inexistente (a action garante
// isso). Aqui a consequência de tela é que o sucesso não pode dizer "enviamos
// para você": ele diz "se existe uma conta com esse e-mail…". Parece prolixo, mas
// é o que impede este formulário de virar um verificador de quem tem conta aqui.
import Link from "next/link";
import { useActionState } from "react";
import { pedirRedefinicao, type PedidoState } from "./acoes";
import { INPUT, LABEL, BTN_PRIMARIO } from "../../painel/_ui/estilos";

export function Pedir() {
  const [estado, acao, pendente] = useActionState<PedidoState, FormData>(pedirRedefinicao, {});

  if (estado.ok) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-scv-lilac text-scv-violet">
          <i className="bi bi-envelope-check text-[20px]" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-[23px] font-semibold text-scv-ink">
          Confira seu e-mail
        </h1>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-scv-muted">{estado.aviso}</p>
        <p className="mt-2 text-[12.5px] text-scv-faint">
          O link vale por 1 hora e só pode ser usado uma vez.
        </p>

        {/* O envio não está configurado: o problema é NOSSO, e esconder isso
            deixaria a pessoa esperando um e-mail que não vem. */}
        {estado.semEmail ? (
          <p className="mt-4 rounded-[11px] bg-scv-field px-3.5 py-3 text-left text-[12.5px] leading-relaxed text-scv-warn-ink">
            <i className="bi bi-exclamation-triangle mr-1.5" aria-hidden />
            O envio de e-mail ainda não está ligado nesta instalação, então o link pode não
            chegar. Se não chegar em alguns minutos, fale com o suporte que a gente
            destrava sua conta na hora.
          </p>
        ) : null}

        <Link
          href="/entrar"
          className="mt-6 inline-flex min-h-[44px] items-center gap-1.5 text-[13.5px] font-semibold !text-scv-muted hover:!text-scv-ink"
        >
          <i className="bi bi-chevron-left text-[12px]" aria-hidden />
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-[25px] font-semibold text-scv-ink">Esqueci minha senha</h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-scv-muted">
        Informe o e-mail da sua conta. A gente manda um link para você criar uma senha nova.
      </p>

      <form action={acao} className="mt-6 text-left">
        <label className={LABEL} htmlFor="email">
          E-mail da conta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@exemplo.com"
          className={INPUT}
        />
        {estado.erro ? (
          <p role="alert" className="mt-1.5 text-[12.5px] font-semibold text-red-600">
            {estado.erro}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pendente}
          className={`${BTN_PRIMARIO} mt-4 w-full`}
        >
          {pendente ? "Enviando…" : "Enviar o link"}
        </button>
      </form>

      <Link
        href="/entrar"
        className="mt-5 inline-flex min-h-[44px] items-center gap-1.5 text-[13.5px] font-semibold !text-scv-muted hover:!text-scv-ink"
      >
        <i className="bi bi-chevron-left text-[12px]" aria-hidden />
        Voltar para o login
      </Link>
    </>
  );
}
