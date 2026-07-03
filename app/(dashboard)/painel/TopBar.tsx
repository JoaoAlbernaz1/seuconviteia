"use client";

// TopBar do painel: wordmark · abas centrais (Meus eventos / Perfil / Plano) ·
// Sair · pill do profissional. Substitui a sidebar antiga — o painel inteiro
// vive em colunas centradas de 1080px, em tema claro.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sair } from "../actions";

const TABS: { href: string; label: string; raiz?: boolean }[] = [
  { href: "/painel", label: "Meus eventos", raiz: true },
  { href: "/painel/perfil", label: "Perfil" },
  { href: "/painel/plano", label: "Plano" },
];

function tabAtiva(pathname: string, tab: { href: string; raiz?: boolean }): boolean {
  if (!tab.raiz) return pathname.startsWith(tab.href);
  // "Meus eventos" cobre a home e tudo que e de evento (wizard, acompanhar...).
  return (
    pathname === "/painel" ||
    (pathname.startsWith("/painel/") &&
      !TABS.some((t) => !t.raiz && pathname.startsWith(t.href)))
  );
}

export function TopBar({ nome }: { nome: string }) {
  const pathname = usePathname();
  const primeiro = nome.split(" ")[0] || "Você";
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="sticky top-0 z-40 border-b border-black/5 bg-[var(--scv-topbar)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-3 px-4 py-3 sm:gap-5 sm:px-7">
        <Link href="/painel" className="flex shrink-0 items-center gap-2.5">
          <span
            className="grid size-8 place-items-center rounded-[9px] text-[13px] font-bold text-white"
            style={{ background: "var(--grad-faisca)" }}
            aria-hidden
          >
            sc
          </span>
          <span className="hidden text-[16.5px] font-bold tracking-tight text-scv-ink min-[440px]:inline">
            seuconvite
            <span className="text-gradient">ia</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Painel">
          {TABS.map((t) => {
            const ativa = tabAtiva(pathname, t);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-semibold transition-colors duration-200 sm:px-3.5 ${
                  ativa
                    ? "bg-scv-btn text-scv-btn-ink"
                    : "text-scv-muted hover:text-scv-ink"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <form action={sair}>
            <button
              type="submit"
              className="hidden cursor-pointer text-[13px] font-medium text-scv-muted transition-colors duration-200 hover:text-scv-ink sm:inline"
            >
              Sair
            </button>
          </form>
          <Link
            href="/painel/perfil"
            className="flex items-center gap-2 rounded-full border border-scv-line bg-scv-card py-[5px] pl-[5px] pr-3 transition-colors duration-200 hover:border-scv-dash"
          >
            <span
              className="grid size-7 place-items-center rounded-full text-[11.5px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#0EA5A6,#6D28D9)" }}
              aria-hidden
            >
              {iniciais || "SC"}
            </span>
            <span className="hidden text-[13px] font-semibold text-scv-ink sm:inline">
              {primeiro}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
