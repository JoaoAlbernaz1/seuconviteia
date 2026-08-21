"use client";

// O formulário da senha nova. Duas caixas (senha e confirmação) porque o campo é
// mascarado: sem a segunda, um erro de digitação tranca a pessoa fora da conta
// que ela acabou de destravar.
import Link from "next/link";
import { useActionState } from "react";
import { redefinirSenha, type NovaSenhaState } from "../acoes";
import { INPUT, LABEL, BTN_PRIMARIO } from "../../../painel/_ui/estilos";

// `minimo` vem por PROP, e nao de `lib/senhaReset`: aquele modulo usa
// `node:crypto` (o token e credencial, precisa de aleatoriedade de verdade) e
// importar dali para um componente de cliente quebra o build — o navegador nao
// tem `node:crypto`. Quem sabe a regra e o servidor; a tela so a exibe.
export function NovaSenha({ token, minimo }: { token: string; minimo: number }) {
  const SENHA_MINIMA = minimo;
  const [estado, acao, pendente] = useActionState<NovaSenhaState, FormData>(redefinirSenha, {});

  if (estado.ok) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-scv-lilac text-scv-violet">
          <i className="bi bi-shield-check text-[20px]" aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-[23px] font-semibold text-scv-ink">
          Senha trocada
        </h1>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-scv-muted">
          Pronto. Entre com a senha nova — e se você tinha outros links de redefinição no
          e-mail, eles não valem mais.
        </p>
        <Link
          href="/entrar"
          className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-violeta px-6 text-[13.5px] font-semibold !text-white transition-[filter] hover:brightness-110"
        >
          Entrar agora
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-[25px] font-semibold text-scv-ink">Criar uma senha nova</h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-scv-muted">
        Escolha uma senha de pelo menos {SENHA_MINIMA} caracteres.
      </p>

      <form action={acao} className="mt-6 text-left">
        <input type="hidden" name="token" value={token} />
        <label className={LABEL} htmlFor="senha">
          Senha nova
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={SENHA_MINIMA}
          className={INPUT}
        />
        <label className={`${LABEL} mt-4`} htmlFor="confirmacao">
          Repita a senha
        </label>
        <input
          id="confirmacao"
          name="confirmacao"
          type="password"
          autoComplete="new-password"
          required
          className={INPUT}
        />
        {estado.erro ? (
          <p role="alert" className="mt-2 text-[12.5px] font-semibold text-red-600">
            {estado.erro}
          </p>
        ) : null}
        <button type="submit" disabled={pendente} className={`${BTN_PRIMARIO} mt-5 w-full`}>
          {pendente ? "Salvando…" : "Salvar a senha nova"}
        </button>
      </form>
    </>
  );
}
