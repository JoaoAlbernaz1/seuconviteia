"use client";

// Entrar / Criar conta — a tela da REFERENCIA que o dono mandou: cartao unico de
// duas colunas (max-w-5xl, 700px de altura), slider de fotos na esquerda,
// formulario na direita, borda fina e sombra funda.
//
// Fiel de proposito, inclusive nas medidas: `max-w-5xl`, `h-[700px]`,
// `rounded-2xl`, `grid-cols-2` a partir de `lg`, titulo em sans bold (nao na
// serifa do painel), rotulos VISIVEIS acima dos campos, divisor com texto no
// meio e "Esqueci minha senha" na altura do rotulo da senha.
//
// As tres unicas diferencas, e o motivo de cada uma:
//
//  1. Sem framer-motion / radix / cva / lucide. A referencia traz quatro
//     dependencias que este projeto nao usa; o movimento do slider esta em CSS
//     (`_SliderImagens.tsx`) e o resultado na tela e o mesmo.
//  2. No lugar dos botoes "Google / Apple" ficam as abas Entrar / Criar conta.
//     Este app loga por e-mail e senha (Auth.js com Credentials) — botao social
//     aqui nao entraria em conta nenhuma, e as abas ocupam o mesmo par de
//     pilulas lado a lado que a referencia tem naquele lugar.
//  3. "Esqueci minha senha" LEVA a algum lugar: `/entrar/senha`, que explica o
//     caminho de destravar a conta. Recuperacao automatica por e-mail ainda nao
//     existe (depende do e-mail configurado em producao) — mas link que nao leva
//     a nada, na porta de entrada, e pior do que a ausencia dele.
//
// A LOGICA NAO MUDOU: mesmas server actions (`entrarComCredenciais` /
// `cadastrarProfissional`), mesmo `?plano=` vindo da landing, mesmo aviso de
// LGPD, mesmo `perfilUso`.
import Link from "next/link";
import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  cadastrarProfissional,
  entrarComCredenciais,
  type LoginState,
  type SignupState,
} from "../actions";
import { INPUT, LABEL, BTN_PRIMARIO } from "../painel/_ui/estilos";
import { PLANOS_INFO } from "@/lib/plans";
import { formatarTelefone } from "@/lib/documento";
import { SliderImagens } from "./_SliderImagens";

// As quatro fotos da referencia (Unsplash: licenca permite uso comercial, e o
// guia deles pede para servir pelo proprio `images.unsplash.com`, que esta
// liberado em `next.config.ts`).
const FOTOS = [
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1504051771394-dd2e66b2e08f?w=900&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=900&auto=format&fit=crop&q=60",
];

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

  // O par de pílulas lado a lado do lugar onde a referência tem Google/Apple.
  const abaCls = (ativa: boolean) =>
    `cursor-pointer rounded-lg border px-4 py-2.5 text-[13.5px] font-semibold transition-colors duration-200 ${
      ativa
        ? "border-scv-violet bg-scv-lilac text-scv-violet"
        : "border-scv-line bg-scv-card text-scv-muted hover:bg-scv-field hover:text-scv-ink"
    }`;

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-2 text-[30px] font-bold leading-[1.15] tracking-tight text-scv-ink">
        {criar ? "Criar sua conta" : "Bem-vindo(a) de volta"}
      </h1>
      <p className="mb-8 text-[14px] leading-relaxed text-scv-muted">
        {criar && planoEscolhido ? (
          <>
            Teste o{" "}
            <strong className="font-semibold text-scv-ink">
              {PLANOS_INFO.find((p) => p.key === planoEscolhido)?.label}
            </strong>{" "}
            por 7 dias grátis. O cartão vem na próxima tela.
          </>
        ) : criar ? (
          <>Crie o site da sua festa em minutos — para você ou para seus clientes.</>
        ) : (
          <>Entre com seus dados para acessar sua conta.</>
        )}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4" role="tablist">
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

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-scv-line" />
        </div>
        <div className="relative flex justify-center text-[10.5px] uppercase tracking-[0.14em]">
          <span className="bg-scv-card px-2 text-scv-faint">
            {criar ? "seus dados" : "com e-mail e senha"}
          </span>
        </div>
      </div>

      {criar ? (
        <form action={signupAction} className="space-y-5">
          {/* Plano escolhido na landing. Viaja escondido para que, logo depois
              de criar a conta, a pessoa caia no checkout do plano que ela
              clicou — e não numa tela pedindo para escolher de novo. */}
          {planoEscolhido ? <input type="hidden" name="plan" value={planoEscolhido} /> : null}
          <div className="space-y-2">
            <label className={LABEL} htmlFor="nome">
              Nome completo
            </label>
            <input id="nome" name="name" autoComplete="name" className={INPUT} />
            <Erro msg={signupState.fieldErrors?.name} />
          </div>
          <div className="space-y-2">
            <label className={LABEL} htmlFor="email-criar">
              E-mail
            </label>
            <input
              id="email-criar"
              name="email"
              type="email"
              autoComplete="email"
              className={INPUT}
            />
            <Erro msg={signupState.fieldErrors?.email} />
          </div>
          <div className="space-y-2">
            <label className={LABEL} htmlFor="telefone">
              WhatsApp com DDD
            </label>
            <input
              id="telefone"
              name="telefone"
              inputMode="tel"
              autoComplete="tel"
              className={INPUT}
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            />
            <Erro msg={signupState.fieldErrors?.telefone} />
          </div>
          <div className="space-y-2">
            <label className={LABEL} htmlFor="senha-criar">
              Senha
            </label>
            <input
              id="senha-criar"
              name="password"
              type="password"
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              className={INPUT}
            />
            <Erro msg={signupState.fieldErrors?.password} />
          </div>

          {/* Para quem estamos vendendo. Muda a linguagem do painel e é a
              pergunta que todo SaaS faz no cadastro — em uma linha, não num
              questionário. */}
          <div className="space-y-2">
            <p className={LABEL}>Você vai usar para</p>
            <input type="hidden" name="perfilUso" value={perfilUso} />
            <div className="grid grid-cols-2 gap-3">
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
                  className={`cursor-pointer rounded-lg border px-3 py-2.5 text-[12.5px] font-semibold transition-colors duration-200 ${
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
          <button type="submit" disabled={signupPending} className={`${BTN_PRIMARIO} w-full`}>
            {signupPending ? "Criando…" : "Criar minha conta"}
          </button>
          {/* LGPD: a conta guarda telefone (e o checkout guarda CPF/CNPJ).
              Consentimento tem de estar à vista de quem envia. */}
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
        <form action={loginAction} className="space-y-6">
          {/* Mesmo plano da aba de cadastro: quem já tem conta também tem de
              terminar no checkout, e não no painel. */}
          {planoEscolhido ? <input type="hidden" name="plan" value={planoEscolhido} /> : null}
          <div className="space-y-2">
            <label className={LABEL} htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="voce@exemplo.com"
              autoComplete="email"
              className={INPUT}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`${LABEL} mb-0`} htmlFor="senha">
                Senha
              </label>
              <Link
                href="/entrar/senha"
                className="text-[13px] font-semibold !text-scv-violet hover:!underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <input
              id="senha"
              name="password"
              type="password"
              autoComplete="current-password"
              className={INPUT}
            />
          </div>
          {loginState.error ? (
            <p role="alert" className="text-sm text-red-600">
              {loginState.error}
            </p>
          ) : null}
          <button type="submit" disabled={loginPending} className={`${BTN_PRIMARIO} w-full`}>
            {loginPending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-[12.5px] text-scv-faint">
        Grátis para começar · sem cartão
      </p>
    </div>
  );
}

export default function EntrarPage() {
  return (
    // `100dvh` e não `100vh`: no Safari do iPhone a barra de endereço muda de
    // altura na rolagem e o `vh` faz a tela pular.
    <div className="flex min-h-[100dvh] items-center justify-center p-4">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-scv-line shadow-[0_25px_50px_-12px_rgba(15,23,42,0.25)] lg:min-h-[700px] lg:grid-cols-2">
        {/* Metade das fotos: só a partir de 1024px, como na referência. */}
        <div className="hidden lg:block">
          <SliderImagens imagens={FOTOS} intervalo={4000} />
        </div>

        {/* `min-h` e não `h`: os 700px da referência valem para o LOGIN, que é
            o único estado que ela tem. A aba de criar conta é mais alta — com
            altura fixa ela rolava dentro do cartão e cortava o próprio título,
            então aqui o cartão cresce e quem rola é a página. */}
        <div className="flex w-full flex-col items-center justify-center bg-scv-card p-8 md:p-12">
          <Suspense fallback={null}>
            <Formulario />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
