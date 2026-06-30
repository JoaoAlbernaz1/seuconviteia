// Layout do painel do profissional (servido em app.seuconviteia.com e nas rotas
// /entrar, /cadastrar, /painel, /painel/novo, /painel/perfil). UI clara sobre a
// marca (nevoa/ink). A protecao de rota e feita em cada pagina com `auth()`.
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

function Wordmark() {
  return (
    <span className="font-sans text-lg font-semibold tracking-tight text-ink">
      seuconvite<span className="text-gradient">ia</span>
      <span className="text-texto-suave">.com</span>
    </span>
  );
}

/** Iniciais do nome (até 2 letras) para o avatar sem foto. */
function iniciais(nome: string): string {
  return (
    nome
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

/**
 * Lado direito do header: quando logado, o AVATAR (foto ou iniciais) com o nome,
 * que leva para o perfil. Sem sessao (/entrar, /cadastrar), so o rotulo "Painel".
 */
async function HeaderRight() {
  const session = await auth();
  if (!session?.user) {
    return (
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-texto-suave">
        Painel
      </span>
    );
  }

  const prof = await prisma.professional.findUnique({
    where: { id: session.user.id },
    select: { name: true, avatarUrl: true },
  });
  const nome = prof?.name ?? session.user.name ?? "";

  return (
    <Link
      href="/painel/perfil"
      aria-label="Meu perfil"
      className="flex items-center gap-2.5 rounded-full p-0.5 pl-3 transition hover:bg-black/5"
    >
      <span className="hidden text-sm font-medium text-texto-suave sm:inline">
        {nome}
      </span>
      <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-lilas text-sm font-semibold text-violeta ring-1 ring-black/5">
        {prof?.avatarUrl ? (
          <Image src={prof.avatarUrl} alt="" fill sizes="36px" className="object-cover" />
        ) : (
          iniciais(nome)
        )}
      </span>
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-nevoa">
      <header className="border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/" aria-label="SeuConvite IA — inicio">
            <Wordmark />
          </Link>
          <HeaderRight />
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
