// Criar a senha nova (o destino do link do e-mail).
//
// O token é conferido AQUI, no servidor, antes de a tela existir: link vencido,
// já usado ou adulterado mostra o motivo e o caminho de volta, em vez de um
// formulário que só falha depois de a pessoa digitar duas senhas.
//
// A conferência não consome o link (`usedAt` só é gravado quando a senha troca),
// então recarregar a página não queima o link de ninguém.
import Link from "next/link";
import { prisma } from "@/lib/db";
import { SENHA_MINIMA, avaliarPedido, hashDoToken, textoDaRecusa } from "@/lib/senhaReset";
import { CARD } from "../../../painel/_ui/estilos";
import { NovaSenha } from "./NovaSenha";

export const metadata = { title: "Criar uma senha nova · seuconvite" };
export const dynamic = "force-dynamic";

export default async function NovaSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const pedido = token
    ? await prisma.passwordReset.findUnique({
        where: { tokenHash: hashDoToken(token) },
        select: { expiresAt: true, usedAt: true },
      })
    : null;
  const veredito = avaliarPedido(pedido, new Date());

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-4">
      <div className={`${CARD} w-full max-w-[420px] p-8`}>
        {veredito.ok && token ? (
          <NovaSenha token={token} minimo={SENHA_MINIMA} />
        ) : (
          <div className="text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-scv-field text-scv-muted">
              <i className="bi bi-link-45deg text-[20px]" aria-hidden />
            </span>
            <h1 className="mt-4 font-display text-[23px] font-semibold text-scv-ink">
              Link inválido
            </h1>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-scv-muted">
              {textoDaRecusa(veredito.ok ? "inexistente" : veredito.motivo)}
            </p>
            <Link
              href="/entrar/senha"
              className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-violeta px-5 text-[13.5px] font-semibold !text-white transition-[filter] hover:brightness-110"
            >
              Pedir um link novo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
