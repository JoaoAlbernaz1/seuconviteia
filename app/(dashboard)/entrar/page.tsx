// Entrar — tela escura de duas colunas, só com Google.
//
// Desenho pedido pelo dono (21/08/2026), no molde da referência que ele mandou:
// fundo #080808, metade esquerda emocional (imagem, assinatura no topo, promessa
// no pé, UM detalhe gráfico), metade direita limpa com um único botão. Sem card
// flutuante, sem glassmorphism, sem outros provedores, sem formulário de e-mail
// e senha, sem botão de cadastro separado — o mesmo botão entra e cria a conta.
//
// DINÂMICA (`force-dynamic`) porque lê `process.env` para saber se o Google está
// configurado. Estática, a decisão ficaria congelada no ambiente do BUILD — e na
// Vercel adicionar env var não refaz o build, então o botão nunca apareceria
// depois de configurar tudo certo.
//
// A IMAGEM é a arte do próprio modelo de 15 anos (`public/templates-demo`):
// fundo profundo, bokeh quente, rosa e violeta, desfoque cinematográfico — a
// descrição do brief, com asset nosso e sem host de terceiro. Trocar por foto de
// festa de verdade é uma linha (`FOTO`).
//
// SOBRE O E-MAIL E SENHA: o brief manda esconder, e ele está escondido — mas
// SOMENTE enquanto o Google existir. Sem `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`
// esta tela não teria NENHUMA porta, e as contas que hoje entram por senha
// (inclusive a do dono e a `demo`, que os testes usam) ficariam trancadas fora do
// painel. Então, e só nesse caso, a tela mostra o caminho antigo. No dia em que
// as credenciais entrarem, ele some sozinho e a tela vira exatamente o brief.
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { googleConfigurado } from "@/lib/contaGoogle";
import { entrarComGoogle } from "../actions";
import { Assinatura, Curvas, IconeGoogle } from "./_Marca";
import { EntrarPorSenha } from "./_EntrarPorSenha";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entrar · seuconvite" };

// A fonte do brief. `variable` para valer só nesta tela, sem mexer no resto.
const inter = Inter({ subsets: ["latin"], variable: "--font-entrar", display: "swap" });

const FOTO = "/templates-demo/quinze-anos/capa-desktop.jpg";

export default function EntrarPage() {
  const googleAtivo = googleConfigurado();

  return (
    <div
      className={`${inter.variable} grid min-h-[100dvh] bg-[#080808] font-[family-name:var(--font-entrar)] lg:grid-cols-2`}
    >
      {/* ═════════ ESQUERDA — área visual (só no desktop) ═════════ */}
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src={FOTO}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 1px"
          className="scale-105 object-cover"
        />
        {/* Escurece o bastante para o texto ter contraste sobre qualquer imagem
            — e mantém o preto profundo do brief. */}
        <div className="absolute inset-0 bg-[#080808]/28" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/20 to-[#080808]/55" />
        <Curvas className="absolute inset-x-0 top-[14%] h-[42%] w-full" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-14">
          <Assinatura />
          <div>
            <p className="max-w-[440px] text-[27px] font-semibold leading-[1.25] tracking-[-0.02em] text-white xl:text-[29px]">
              Transforme momentos especiais em experiências inesquecíveis.
            </p>
            <p className="mt-4 max-w-[400px] text-[15px] leading-relaxed text-white/55">
              Crie, personalize e publique seu convite em poucos passos.
            </p>
          </div>
        </div>
      </div>

      {/* ═════════ DIREITA — login ═════════ */}
      <div className="relative flex items-center justify-center px-6 py-14 sm:px-10">
        {/* O detalhe de fundo do CELULAR, onde a coluna da imagem não existe: um
            brilho único e discreto, em vez de mancha neon. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[320px] opacity-[0.16] lg:hidden"
          style={{
            background:
              "radial-gradient(60% 100% at 50% 0%, #7C3AED 0%, #FF2D8D 45%, transparent 72%)",
          }}
        />

        <div className="relative w-full max-w-[420px]">
          {/* No celular a assinatura vem para cá: sem ela a tela abriria sem
              dizer onde a pessoa está. */}
          <Assinatura className="mb-10 lg:hidden" />

          <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-[38px]">
            Bem-vindo ao seuconvite
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-white/60">
            Entre para continuar criando experiências únicas para seus clientes.
          </p>
          <p className="mt-2.5 text-[13.5px] text-white/40">
            Use sua conta Google para acessar a plataforma.
          </p>

          {googleAtivo ? (
            <form action={entrarComGoogle} className="mt-9">
              <button
                type="submit"
                className="flex h-[54px] w-full cursor-pointer items-center justify-center gap-3 rounded-[11px] bg-white text-[15.5px] font-semibold text-[#0B0B0D] transition-colors duration-200 hover:bg-[#ECECEC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4B5FD]"
              >
                <IconeGoogle className="size-[19px]" />
                Continuar com Google
              </button>
            </form>
          ) : (
            <EntrarPorSenha />
          )}

          <p className="mt-5 text-[12.5px] leading-relaxed text-white/35">
            Ao continuar, você concorda com os{" "}
            <Link href="/termos" className="!text-[#C4B5FD] hover:!underline">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="!text-[#C4B5FD] hover:!underline">
              Política de Privacidade
            </Link>
            .
          </p>

          <div className="mt-12 border-t border-white/[0.07] pt-6">
            <p className="text-[13.5px] font-medium text-white/55">Ainda não tem uma conta?</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/35">
              {googleAtivo
                ? "Ao entrar com o Google, sua conta será criada automaticamente."
                : "Assim que o Google estiver ligado, o mesmo botão entra e cria a conta."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
