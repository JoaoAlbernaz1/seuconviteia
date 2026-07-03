"use client";

// Entrar / Criar conta — card central com abas (mockup DARK). As duas abas
// usam as server actions existentes (`entrarComCredenciais` / `cadastrar-
// Profissional`); o cadastro pede so nome+e-mail+senha (plano começa no
// Básico; troca depois em /painel/plano).
import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  cadastrarProfissional,
  entrarComCredenciais,
  type LoginState,
  type SignupState,
} from "../actions";
import { INPUT, BTN_PRIMARIO } from "../painel/_ui/estilos";

function Erro({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-400">{msg}</p>;
}

function CardEntrar() {
  const params = useSearchParams();
  const [aba, setAba] = useState<"entrar" | "criar">(
    params.get("criar") != null ? "criar" : "entrar",
  );
  const [loginState, loginAction, loginPending] = useActionState<LoginState, FormData>(
    entrarComCredenciais,
    {},
  );
  const [signupState, signupAction, signupPending] = useActionState<
    SignupState,
    FormData
  >(cadastrarProfissional, {});

  const criar = aba === "criar";
  const abaCls = (ativa: boolean) =>
    `flex-1 rounded-full py-2.5 text-[13px] font-semibold transition ${
      ativa ? "bg-scv-btn text-scv-btn-ink" : "text-scv-muted hover:text-scv-ink"
    }`;

  return (
    <div className="scv-fade w-full max-w-[400px] rounded-[22px] border border-scv-line bg-scv-card p-8 text-center shadow-[0_28px_60px_-34px_rgba(0,0,0,0.45)]">
      <span
        className="mx-auto grid size-11 place-items-center rounded-xl text-[15px] font-bold text-white"
        style={{ background: "var(--grad-faisca)" }}
        aria-hidden
      >
        sc
      </span>
      <h1 className="mt-3.5 font-display text-[25px] font-semibold text-scv-ink">
        Bem-vindo(a)
      </h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-scv-muted">
        Crie o site da sua festa em minutos —<br />
        para você ou para seus clientes.
      </p>

      <div className="my-5 flex rounded-full bg-scv-soft p-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={!criar}
          onClick={() => setAba("entrar")}
          className={abaCls(!criar)}
        >
          Entrar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={criar}
          onClick={() => setAba("criar")}
          className={abaCls(criar)}
        >
          Criar conta
        </button>
      </div>

      {criar ? (
        <form action={signupAction} className="flex flex-col gap-3 text-left">
          <div>
            <input name="name" placeholder="Seu nome" autoComplete="name" className={INPUT} />
            <Erro msg={signupState.fieldErrors?.name} />
          </div>
          <div>
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              autoComplete="email"
              className={INPUT}
            />
            <Erro msg={signupState.fieldErrors?.email} />
          </div>
          <div>
            <input
              name="password"
              type="password"
              placeholder="Senha (mín. 8 caracteres)"
              autoComplete="new-password"
              className={INPUT}
            />
            <Erro msg={signupState.fieldErrors?.password} />
          </div>
          {signupState.error ? (
            <p role="alert" className="text-sm text-red-400">
              {signupState.error}
            </p>
          ) : null}
          <button type="submit" disabled={signupPending} className={`${BTN_PRIMARIO} mt-1 w-full`}>
            {signupPending ? "Criando…" : "Criar minha conta"}
          </button>
        </form>
      ) : (
        <form action={loginAction} className="flex flex-col gap-3 text-left">
          <input
            name="email"
            type="email"
            placeholder="E-mail"
            autoComplete="email"
            className={INPUT}
          />
          <input
            name="password"
            type="password"
            placeholder="Senha"
            autoComplete="current-password"
            className={INPUT}
          />
          {loginState.error ? (
            <p role="alert" className="text-sm text-red-400">
              {loginState.error}
            </p>
          ) : null}
          <button type="submit" disabled={loginPending} className={`${BTN_PRIMARIO} mt-1 w-full`}>
            {loginPending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      )}

      <div className="mt-4 text-[11.5px] text-scv-faint">
        Grátis para começar · sem cartão
      </div>
    </div>
  );
}

export default function EntrarPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Suspense fallback={null}>
        <CardEntrar />
      </Suspense>
    </div>
  );
}
