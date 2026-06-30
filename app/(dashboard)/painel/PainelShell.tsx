"use client";

// Shell do painel no estilo "dashboard com sidebar" (referência Horizon UI que o
// João mandou): barra lateral fixa no desktop (marca + navegação + conta), e no
// mobile vira top bar com menu deslizante. O conteúdo de cada página entra em
// `children`. Mantém a marca turquesa/roxo.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { sair } from "../actions";

const NAV = [
  { href: "/painel", label: "Meus eventos", icon: "bi-collection" },
  { href: "/painel/novo", label: "Criar evento", icon: "bi-plus-circle" },
  { href: "/painel/perfil", label: "Meu perfil", icon: "bi-person" },
] as const;

function Wordmark() {
  return (
    <span className="font-sans text-lg font-semibold tracking-tight text-ink">
      seuconvite<span className="text-gradient">ia</span>
    </span>
  );
}

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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-lilas text-violeta"
                : "text-texto-suave hover:bg-black/5 hover:text-ink"
            }`}
          >
            <i className={`bi ${item.icon} text-base`} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Conta({ nome, avatarUrl }: { nome: string; avatarUrl?: string | null }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-black/5 bg-nevoa/70 p-2.5">
      <Link
        href="/painel/perfil"
        aria-label="Meu perfil"
        className="flex min-w-0 flex-1 items-center gap-2.5"
      >
        <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-lilas text-sm font-semibold text-violeta ring-1 ring-black/5">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill sizes="36px" className="object-cover" />
          ) : (
            iniciais(nome)
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-ink">{nome}</span>
          <span className="block text-xs text-texto-suave">Ver perfil</span>
        </span>
      </Link>
      <form action={sair}>
        <button
          type="submit"
          aria-label="Sair"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-texto-suave transition hover:bg-black/5 hover:text-ink"
        >
          <i className="bi bi-box-arrow-right" aria-hidden />
        </button>
      </form>
    </div>
  );
}

export function PainelShell({
  nome,
  avatarUrl,
  children,
}: {
  nome: string;
  avatarUrl?: string | null;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);

  // Trava o scroll do body com o drawer aberto.
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  return (
    <div className="min-h-full">
      {/* ── Sidebar (desktop) ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-black/5 bg-white px-4 py-5 lg:flex">
        <Link href="/" className="px-2">
          <Wordmark />
        </Link>
        <div className="mt-7 flex-1">
          <NavLinks />
        </div>
        <Conta nome={nome} avatarUrl={avatarUrl} />
      </aside>

      {/* ── Top bar (mobile) ── */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          className="grid size-9 place-items-center rounded-lg text-ink transition hover:bg-black/5"
        >
          <i className="bi bi-list text-xl" aria-hidden />
        </button>
        <Link href="/">
          <Wordmark />
        </Link>
        <Link
          href="/painel/perfil"
          aria-label="Meu perfil"
          className="relative grid size-9 place-items-center overflow-hidden rounded-full bg-lilas text-sm font-semibold text-violeta ring-1 ring-black/5"
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill sizes="36px" className="object-cover" />
          ) : (
            iniciais(nome)
          )}
        </Link>
      </header>

      {/* ── Drawer (mobile) ── */}
      {aberto ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            onClick={() => setAberto(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col border-r border-black/5 bg-white px-4 py-5 shadow-xl">
            <div className="flex items-center justify-between px-2">
              <Wordmark />
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar menu"
                className="grid size-9 place-items-center rounded-lg text-texto-suave transition hover:bg-black/5"
              >
                <i className="bi bi-x-lg" aria-hidden />
              </button>
            </div>
            <div className="mt-7 flex-1">
              <NavLinks onNavigate={() => setAberto(false)} />
            </div>
            <Conta nome={nome} avatarUrl={avatarUrl} />
          </div>
        </div>
      ) : null}

      {/* ── Conteúdo ── */}
      <div className="lg:pl-60">{children}</div>
    </div>
  );
}
