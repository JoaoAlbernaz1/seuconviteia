"use client";

// Shell do painel — referência fiel ao mockup do João: SIDEBAR ESCURA (ink) com
// marca + navegação (grupos "Painel" e "Conta") + card de plano gradiente, e
// TOPBAR clara (busca + "Criar evento" + identidade do profissional). No mobile a
// sidebar vira drawer. O conteúdo de cada página entra em `children`.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { sair } from "../actions";
import { rotuloPlano, type Plan } from "@/lib/plans";

const ROOT_CRIAR = "/painel/novo";

const NAV_PAINEL = [
  { href: "/painel", label: "Visão geral", icon: "bi-grid-1x2" },
  { href: "/painel/eventos", label: "Eventos", icon: "bi-calendar2-event" },
  { href: "/painel/convidados", label: "Convidados", icon: "bi-people" },
  { href: "/painel/presentes", label: "Lista de presentes", icon: "bi-gift" },
] as const;

const NAV_CONTA = [
  { href: "/painel/perfil", label: "Meu perfil", icon: "bi-person" },
  { href: "/painel/plano", label: "Plano", icon: "bi-gem" },
] as const;

function Wordmark() {
  return (
    <span className="font-sans text-lg font-semibold tracking-tight text-white">
      seuconvite
      <span className="bg-gradient-to-r from-turquesa to-violeta bg-clip-text text-transparent">
        ia
      </span>
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

/** Um item de navegação da sidebar escura. Ativo = pílula em gradiente. */
function NavItem({
  href,
  label,
  icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-gradient-to-r from-violeta to-teal text-white shadow-sm"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="grid w-5 place-items-center">
        <i className={`bi ${icon} text-base`} aria-hidden />
      </span>
      {label}
    </Link>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 pb-1.5 pt-3 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
      {children}
    </span>
  );
}

/** Conteúdo da sidebar (compartilhado entre o aside fixo e o drawer mobile). */
function SidebarContent({
  plan,
  onNavigate,
}: {
  plan: Plan;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/painel"
      ? pathname === "/painel"
      : pathname === href || pathname.startsWith(`${href}/`);
  // O editor (/painel/<id>/editar e /painel/novo) conta como "Eventos".
  const eventosActive =
    isActive("/painel/eventos") ||
    pathname === ROOT_CRIAR ||
    /^\/painel\/[^/]+\/editar$/.test(pathname);

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-4 py-5"
      >
        <span
          className="grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold text-white"
          style={{ background: "var(--grad-faisca)" }}
          aria-hidden
        >
          sc
        </span>
        <Wordmark />
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        <GroupLabel>Painel</GroupLabel>
        {NAV_PAINEL.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={
              item.href === "/painel/eventos" ? eventosActive : isActive(item.href)
            }
            onNavigate={onNavigate}
          />
        ))}
        <GroupLabel>Conta</GroupLabel>
        {NAV_CONTA.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={isActive(item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Card de plano (gradiente) */}
      <div className="m-3 rounded-2xl bg-gradient-to-br from-violeta via-teal to-turquesa p-4">
        <p className="font-sans text-sm font-semibold text-white">
          Plano {rotuloPlano(plan)}
        </p>
        <p className="mt-0.5 text-xs text-white/85">
          {plan === "BASICO"
            ? "Comece a criar os seus eventos"
            : "Eventos ilimitados inclusos"}
        </p>
        <Link
          href="/painel/plano"
          onClick={onNavigate}
          className="mt-3 block rounded-lg bg-white/95 py-2 text-center text-xs font-semibold text-violeta transition hover:bg-white"
        >
          Gerenciar plano
        </Link>
      </div>
    </div>
  );
}

export function PainelShell({
  nome,
  avatarUrl,
  brandName,
  plan,
  children,
}: {
  nome: string;
  avatarUrl?: string | null;
  brandName?: string | null;
  plan: Plan;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    const q = busca.trim();
    router.push(q ? `/painel/eventos?q=${encodeURIComponent(q)}` : "/painel/eventos");
    setAberto(false);
  }

  const papel = brandName?.trim() || "Profissional de eventos";

  return (
    <div className="min-h-full">
      {/* ── Sidebar (desktop) ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-ink lg:block">
        <SidebarContent plan={plan} />
      </aside>

      {/* ── Drawer (mobile) ── */}
      {aberto ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setAberto(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[82%] bg-ink shadow-2xl">
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar menu"
              className="absolute right-3 top-4 z-10 grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <i className="bi bi-x-lg" aria-hidden />
            </button>
            <SidebarContent plan={plan} onNavigate={() => setAberto(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        {/* ── Topbar ── */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-black/5 bg-nevoa/85 px-4 py-3 backdrop-blur sm:gap-5 sm:px-7">
          <button
            type="button"
            onClick={() => setAberto(true)}
            aria-label="Abrir menu"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-ink transition hover:bg-black/5 lg:hidden"
          >
            <i className="bi bi-list text-xl" aria-hidden />
          </button>

          <form onSubmit={buscar} className="relative hidden flex-1 sm:block sm:max-w-md">
            <i
              className="bi bi-search pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-texto-suave"
              aria-hidden
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar eventos, convidados…"
              aria-label="Buscar"
              className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition focus:border-violeta focus:ring-2 focus:ring-violeta/15"
            />
          </form>

          <div className="flex flex-1 items-center justify-end gap-3 sm:flex-none sm:gap-5">
            <Link
              href={ROOT_CRIAR}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violeta to-teal px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violeta/20 transition hover:brightness-105"
            >
              <i className="bi bi-plus-lg" aria-hidden />
              <span className="hidden sm:inline">Criar evento</span>
            </Link>

            <span className="hidden h-7 w-px bg-black/10 sm:block" />

            <div className="flex items-center gap-2.5">
              <span className="hidden text-right leading-tight sm:block">
                <span className="block text-sm font-semibold text-ink">{nome}</span>
                <span className="block text-xs text-texto-suave">{papel}</span>
              </span>
              <Link
                href="/painel/perfil"
                aria-label="Meu perfil"
                className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-teal to-turquesa text-sm font-bold text-ink ring-1 ring-black/5"
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="" fill sizes="36px" className="object-cover" />
                ) : (
                  iniciais(nome)
                )}
              </Link>
              <form action={sair}>
                <button
                  type="submit"
                  aria-label="Sair"
                  className="grid size-9 place-items-center rounded-lg text-texto-suave transition hover:bg-black/5 hover:text-ink"
                >
                  <i className="bi bi-box-arrow-right" aria-hidden />
                </button>
              </form>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
