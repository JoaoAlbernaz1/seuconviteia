"use client";

// Entrar / Criar conta — porta de entrada em DUAS METADES: vitrine do produto à
// esquerda, formulário à direita.
//
// Era um cartão de 400px centralizado num fundo vazio: o desenho que todo SaaS
// gerado por IA tem. O problema não era só estética — a primeira tela do produto
// não dizia o que o produto faz. Agora a metade esquerda mostra o convite pronto
// (ver `_Vitrine.tsx`) e a direita cuida do que a pessoa vem fazer aqui.
//
// A LÓGICA NÃO MUDOU: as mesmas abas, as mesmas server actions
// (`entrarComCredenciais` / `cadastrarProfissional`), o mesmo `?plano=` vindo da
// landing e o mesmo aviso de LGPD. Só o invólucro é novo.
//
// O que eu deliberadamente NÃO copiei da referência que o dono mandou:
//  - Botões "Entrar com Google / Apple": este app só tem login por e-mail e
//    senha (Auth.js com Credentials). Botão que não loga é mentira na tela.
//  - Link "Esqueci minha senha": não existe recuperação em lugar nenhum do
//    sistema, e link morto na porta de entrada é pior do que a ausência dele.
//    Quando a recuperação existir (precisa de e-mail configurado), o lugar dele
//    é ao lado do rótulo da senha.
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
import { Vitrine } from "./_Vitrine";

function Erro({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

function Formulario() {
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
    `flex-1 cursor-pointer rounded-full py-2.5 text-[13px] font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
      ativa
        ? "bg-scv-card text-scv-ink shadow-[0_6px_16px_-10px_rgba(15,23,42,0.4)]"
        : "text-scv-muted hover:text-scv-ink"
    }`;

  return (
    <div className="w-full max-w-[404px]">
      {/* Identidade também na metade do formulário: abaixo de 1024px a vitrine
          não é renderizada, e sem isto o celular abriria num formulário sem
          marca nenhuma. */}
      <span
        className="grid size-10 place-items-center rounded-xl text-[14px] font-bold text-white lg:hidden"
        style={{ background: "var(--grad-faisca)" }}
        aria-hidden
      >
        sc
      </span>

      <p className="mt-6 inline-flex items-center rounded-full bg-scv-lilac px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-scv-violet lg:mt-0">
        {criar ? "Criar conta" : "Entrar"}
      </p>
      <h1 className="mt-3 font-display text-[30px] font-semibold leading-[1.1] tracking-tight text-scv-ink">
        {criar ? "Vamos criar o convite" : "Que bom ter você de volta"}
      </h1>
      <p className="mt-2.5 text-[14px] leading-relaxed text-scv-muted">
        {criar && planoEscolhido ? (
          <>
            Teste o{" "}
            <strong className="font-semibold text-scv-ink">
              {PLANOS_INFO.find((p) => p.key === planoEscolhido)?.label}
            </strong>{" "}
            por 7 dias grátis. O cartão vem na próxima tela.
          </>
        ) : criar ? (
          <>Em minutos, para a sua festa ou para a festa do seu cliente.</>
        ) : (
          <>Entre para continuar cuidando dos seus convites.</>
        )}
      </p>

      <div className="my-6 flex rounded-full bg-scv-soft p-1" role="tablist">
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
          <div className="mt-0.5">
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
                  className={`flex-1 cursor-pointer rounded-[11px] border px-3 py-2.5 text-[12.5px] font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    perfilUso === valor
                      ? "border-scv-violet bg-scv-lilac text-scv-violet"
                      : "border-scv-line text-scv-muted hover:border-scv-violet/40 hover:text-scv-ink"
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
          <button
            type="submit"
            disabled={signupPending}
            className={`${BTN_PRIMARIO} mt-1.5 w-full active:scale-[0.99]`}
          >
            {signupPending ? "Criando…" : "Criar minha conta"}
          </button>
          {/* LGPD: a conta passou a guardar telefone (e o checkout guarda
              CPF/CNPJ). Consentimento tem de estar à vista de quem envia. */}
          <p className="text-[11.5px] leading-relaxed text-scv-faint">
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
          {loginState.error ? (
            <p role="alert" className="text-sm text-red-600">
              {loginState.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loginPending}
            className={`${BTN_PRIMARIO} mt-1.5 w-full active:scale-[0.99]`}
          >
            {loginPending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      )}

      <div className="mt-6 flex items-center gap-2 text-[11.5px] text-scv-faint">
        <span className="h-px flex-1 bg-scv-line" />
        Grátis para começar · sem cartão
        <span className="h-px flex-1 bg-scv-line" />
      </div>
    </div>
  );
}

export default function EntrarPage() {
  return (
    // `100dvh` e não `100vh`: no Safari do iPhone a barra de endereço muda de
    // tamanho no meio da rolagem e o `vh` faz a tela pular.
    <div className="grid min-h-[100dvh] place-items-center p-4 sm:p-6">
      {/* Moldura dupla: a casca de fora com fio de cabelo e respiro de 6px, o
          miolo com o raio calculado para as curvas ficarem concêntricas. É o que
          separa "cartão colado no fundo" de peça assentada. */}
      <div className="w-full max-w-[1120px] rounded-[34px] bg-scv-soft/60 p-1.5 ring-1 ring-black/[0.06] shadow-[0_50px_100px_-60px_rgba(15,23,42,0.45)]">
        <div className="grid overflow-hidden rounded-[28px] bg-scv-card lg:min-h-[660px] lg:grid-cols-[1.05fr_1fr]">
          <Vitrine />
          <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
            <Suspense fallback={null}>
              <Formulario />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
