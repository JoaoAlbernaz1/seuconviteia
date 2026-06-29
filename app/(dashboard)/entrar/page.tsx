"use client";

// Login do profissional. Form client com `useActionState` -> server action
// `entrarComCredenciais`, que chama `signIn("credentials", { redirectTo: "/painel" })`.
import { useActionState } from "react";
import Link from "next/link";
import { entrarComCredenciais, type LoginState } from "../actions";

const INITIAL: LoginState = {};

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-violeta focus:ring-2 focus:ring-violeta/20";

export default function EntrarPage() {
  const [state, formAction, pending] = useActionState(
    entrarComCredenciais,
    INITIAL,
  );

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-semibold text-ink">
          Entrar
        </h1>
        <p className="mt-2 text-sm text-texto-suave">
          Acesse o painel para gerenciar os seus eventos.
        </p>

        <form action={formAction} className="mt-8 flex flex-col gap-4">
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
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
              placeholder="••••••••"
            />
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
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-texto-suave">
          Ainda nao tem conta?{" "}
          <Link href="/cadastrar" className="font-medium text-violeta hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}
