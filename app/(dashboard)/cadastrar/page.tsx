"use client";

// Cadastro do profissional. Form client com `useActionState` -> server action
// `cadastrarProfissional` (Zod + bcrypt + cria Professional + auto-login). Sem
// plano: a monetizacao e por evento (valor unico + upsells), nao por conta.
import { useActionState, useState } from "react";
import Link from "next/link";
import { cadastrarProfissional, type SignupState } from "../actions";
import { PLANOS_INFO, type Plan } from "@/lib/plans";

const INITIAL: SignupState = {};

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-violeta focus:ring-2 focus:ring-violeta/20";

const submitClass =
  "mt-2 w-full rounded-lg bg-gradient-to-r from-teal to-violeta px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-700">{msg}</p>;
}

export default function CadastrarPage() {
  const [state, formAction, pending] = useActionState(
    cadastrarProfissional,
    INITIAL,
  );
  const [plan, setPlan] = useState<Plan>("CLASSICO");

  return (
    <main className="relative flex flex-1 items-center justify-center px-5 py-12 sm:px-6">
      {/* Glow decorativo da marca (turquesa + violeta). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[20%] h-72 w-72 -translate-x-1/2 rounded-full bg-turquesa/15 blur-3xl" />
        <div className="absolute left-[58%] top-[58%] h-72 w-72 -translate-x-1/2 rounded-full bg-violeta/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <p className="mb-6 text-center font-sans text-lg font-semibold tracking-tight text-ink">
          seuconvite<span className="text-gradient">ia</span>
          <span className="text-texto-suave">.com</span>
        </p>
        <div className="rounded-2xl border border-black/5 bg-white/90 p-7 shadow-[0_18px_60px_-24px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:p-8">
          <p className="mb-3 inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-teal">
            <span aria-hidden>✦</span> Comece grátis
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Criar conta
          </h1>
          <p className="mt-2 text-sm text-texto-suave">
            Crie sua conta e monte o primeiro site de evento — de graça.
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

          {/* Plano da assinatura — herdado por todos os eventos. */}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-ink">Seu plano</legend>
            {PLANOS_INFO.map((p) => {
              const selected = plan === p.key;
              return (
                <label
                  key={p.key}
                  className={`flex cursor-pointer flex-col rounded-xl border p-3.5 transition ${
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
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-display text-base font-semibold text-ink">
                      {p.label}
                      {p.destaque ? (
                        <span className="rounded-full bg-violeta/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-violeta">
                          Popular
                        </span>
                      ) : null}
                    </span>
                    {selected ? (
                      <i className="bi bi-check-circle-fill text-violeta" aria-hidden />
                    ) : null}
                  </span>
                  <span className="mt-1 text-xs leading-snug text-texto-suave">
                    {p.descricaoCurta}
                  </span>
                </label>
              );
            })}
          </fieldset>

          {state.error ? (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {state.error}
            </p>
          ) : null}

          <button type="submit" disabled={pending} className={submitClass}>
            {pending ? "Criando…" : "Criar conta"}
          </button>
          </form>
        </div>

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
