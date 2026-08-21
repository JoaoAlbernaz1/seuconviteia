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
import { PLANOS_INFO } from "@/lib/plans";
import { formatarTelefone } from "@/lib/documento";

function Erro({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

function CardEntrar() {
  const params = useSearchParams();
  const [aba, setAba] = useState<"entrar" | "criar">(
    params.get("criar") != null ? "criar" : "entrar",
  );
  // `?plano=classico` (da landing) → CLASSICO. Valor invalido é ignorado; quem
  // valida de verdade é o servidor.
  const planoEscolhido = PLANOS_INFO.find(
    (p) => p.key === (params.get("plano") ?? "").toUpperCase() && p.mensalidadeCents > 0,
  )?.key;
  const [telefone, setTelefone] = useState("");
  const [perfilUso, setPerfilUso] = useState<"proprio" | "profissional">("proprio");
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
    <div className="scv-fade w-full max-w-[400px] rounded-[22px] border border-scv-line bg-scv-card p-8 text-center shadow-[0_28px_60px_-34px_rgba(15,23,42,0.14)]">
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
        {criar && planoEscolhido ? (
          <>
            Teste o{" "}
            <strong className="font-semibold text-scv-ink">
              {PLANOS_INFO.find((p) => p.key === planoEscolhido)?.label}
            </strong>{" "}
            por 7 dias grátis.
            <br />
            Crie sua conta — o cartão vem na próxima tela.
          </>
        ) : (
          <>
            Crie o site da sua festa em minutos —<br />
            para você ou para seus clientes.
          </>
        )}
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
          {/* Plano escolhido na landing. Viaja escondido para que, logo depois
              de criar a conta, a pessoa caia no checkout do plano que ela
              clicou — e não numa tela pedindo para escolher de novo. */}
          {planoEscolhido ? <input type="hidden" name="plan" value={planoEscolhido} /> : null}
          <div>
            <input name="name" placeholder="Seu nome completo" autoComplete="name" className={INPUT} />
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
              name="telefone"
              inputMode="tel"
              placeholder="WhatsApp com DDD"
              autoComplete="tel"
              className={INPUT}
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            />
            <Erro msg={signupState.fieldErrors?.telefone} />
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

          {/* Para quem estamos vendendo. Muda a linguagem do painel e é a
              pergunta que todo SaaS faz no cadastro — em uma linha, não num
              questionário. */}
          <div>
            <p className="mb-1.5 text-[12.5px] font-semibold text-scv-muted">Você vai usar para</p>
            <input type="hidden" name="perfilUso" value={perfilUso} />
            <div className="flex gap-2">
              {(
                [
                  ["proprio", "Minha própria festa"],
                  ["profissional", "Festas de clientes"],
                ] as const
              ).map(([valor, rotulo]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setPerfilUso(valor)}
                  className={`flex-1 rounded-[11px] border px-3 py-2.5 text-[12.5px] font-semibold transition ${
                    perfilUso === valor
                      ? "border-scv-violet bg-scv-lilac text-scv-violet"
                      : "border-scv-line text-scv-muted hover:text-scv-ink"
                  }`}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </div>
          {signupState.error ? (
            <p role="alert" className="text-sm text-red-600">
              {signupState.error}
            </p>
          ) : null}
          <button type="submit" disabled={signupPending} className={`${BTN_PRIMARIO} mt-1 w-full`}>
            {signupPending ? "Criando…" : "Criar minha conta"}
          </button>
          {/* LGPD: a conta passou a guardar telefone (e o checkout guarda
              CPF/CNPJ). Consentimento tem de estar à vista de quem envia. */}
          <p className="text-center text-[11.5px] leading-relaxed text-scv-faint">
            Ao criar a conta você aceita os{" "}
            <a href="/termos" className="underline hover:text-scv-ink">
              Termos de uso
            </a>{" "}
            e a{" "}
            <a href="/privacidade" className="underline hover:text-scv-ink">
              Política de Privacidade
            </a>
            .
          </p>
        </form>
      ) : (
        <form action={loginAction} className="flex flex-col gap-3 text-left">
          {/* Mesmo plano da aba de cadastro: quem ja tem conta tambem tem de
              terminar no checkout, e nao no painel. */}
          {planoEscolhido ? <input type="hidden" name="plan" value={planoEscolhido} /> : null}
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
          {/* A porta de saida de quem esqueceu a senha. Ate 21/08/2026 ela nao
              existia em lugar nenhum do sistema: quem perdia o acesso dependia
              de alguem mexer no banco. */}
          <a
            href="/entrar/senha"
            className="-mt-1 self-end text-[12.5px] font-semibold !text-scv-violet hover:!underline"
          >
            Esqueci minha senha
          </a>
          {loginState.error ? (
            <p role="alert" className="text-sm text-red-600">
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
