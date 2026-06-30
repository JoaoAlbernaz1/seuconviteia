"use client";

// Cadastro do profissional. Form client com `useActionState` -> server action
// `cadastrarProfissional` (Zod + bcrypt + cria Professional com o PLANO escolhido
// no signup + auto-login). O plano e ESCOLHIDO NA CONTA (aqui) e herdado por todos
// os eventos do profissional — nao se escolhe plano por evento.
import { useActionState, useState } from "react";
import Link from "next/link";
import { cadastrarProfissional, type SignupState } from "../actions";
import { PLANOS_INFO, RECURSOS, RECURSO_LABEL, type Plan } from "@/lib/plans";

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
  const [plan, setPlan] = useState<Plan>("BASICO");

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-6">
      <div className="w-full max-w-md">
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

          {/* Plano da CONTA — todos os eventos herdam este plano. */}
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-1 text-sm font-medium text-ink">
              Plano da conta
            </legend>
            <p className="-mt-1 mb-1 text-xs text-texto-suave">
              Define o que fica liberado nos sites que voce criar. Voce pode
              comecar no Basico e fazer upgrade depois.
            </p>
            {PLANOS_INFO.map((p) => {
              const selected = plan === p.key;
              return (
                <label
                  key={p.key}
                  className={`flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                    selected
                      ? "border-violeta ring-2 ring-violeta/25"
                      : "border-black/10 hover:border-violeta/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={p.key}
                    checked={selected}
                    onChange={() => setPlan(p.key)}
                    className="sr-only"
                  />
                  <span className="flex items-center justify-between">
                    <span className="font-display text-base font-semibold text-ink">
                      {p.label}
                    </span>
                    {selected ? (
                      <span className="text-xs font-semibold text-violeta">✓</span>
                    ) : null}
                  </span>
                  <span className="mt-1 text-xs leading-snug text-texto-suave">
                    {p.descricaoCurta}
                  </span>
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {RECURSOS.map((r) => {
                      const incluso = p.recursos.includes(r);
                      return (
                        <li
                          key={r}
                          className={`flex items-center gap-1.5 text-xs ${
                            incluso ? "text-ink" : "text-texto-suave/60"
                          }`}
                        >
                          <span aria-hidden>{incluso ? "✅" : "🔒"}</span>
                          <span className={incluso ? "" : "line-through"}>
                            {RECURSO_LABEL[r]}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </label>
              );
            })}
            <FieldError msg={state.fieldErrors?.plan} />
          </fieldset>

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
