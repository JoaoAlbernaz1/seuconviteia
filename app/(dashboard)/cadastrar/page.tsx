"use client";

// Cadastro do profissional. Form client com `useActionState` -> server action
// `cadastrarProfissional` (Zod + bcrypt + cria Professional BASICO + auto-login).
import { useActionState } from "react";
import Link from "next/link";
import { cadastrarProfissional, type SignupState } from "../actions";

const INITIAL: SignupState = {};

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-violeta focus:ring-2 focus:ring-violeta/20";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-700">{msg}</p>;
}

export default function CadastrarPage() {
  const [state, formAction, pending] = useActionState(
    cadastrarProfissional,
    INITIAL,
  );

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold text-ink">
          Criar conta
        </h1>
        <p className="mt-2 text-sm text-texto-suave">
          Comece gratis e publique o primeiro site de evento.
        </p>

        <form action={formAction} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-ink">
              Nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className={inputClass}
              placeholder="Seu nome ou do estudio"
            />
            <FieldError msg={state.fieldErrors?.name} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ink">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputClass}
              placeholder="voce@estudio.com"
            />
            <FieldError msg={state.fieldErrors?.email} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className={inputClass}
              placeholder="Ao menos 8 caracteres"
            />
            <FieldError msg={state.fieldErrors?.password} />
          </div>

          {state.error ? (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-lg bg-violeta px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violeta/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Criando…" : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-texto-suave">
          Ja tem conta?{" "}
          <Link href="/entrar" className="font-medium text-violeta hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
