// Layout do painel do profissional (servido em app.seuconviteia.com e nas rotas
// /entrar, /cadastrar, /painel, /painel/novo). UI clara sobre a marca (nevoa/ink),
// menos elaborada que a landing. A protecao de rota e feita em cada pagina com `auth()`.
import Link from "next/link";

function Wordmark() {
  return (
    <span className="font-sans text-lg font-semibold tracking-tight text-ink">
      seuconvite<span className="text-gradient">ia</span>
      <span className="text-texto-suave">.com</span>
    </span>
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
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-texto-suave">
            Painel
          </span>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
