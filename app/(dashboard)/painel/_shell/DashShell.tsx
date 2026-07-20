"use client";

// Shell do PAINEL — réplica fiel do Claude Design "seuconvite - Dashboard".
// Sidebar escura (#080808) com grupos de navegação + topbar clara (busca,
// ajuda, notificações, menu do usuário). No mobile a sidebar vira drawer.
// Recebe dados reais do servidor (nome, e-mail, id do convite em destaque).
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sair } from "../../actions";
import { Ic, IC } from "./Ic";

type NavItem = { label: string; d: string; href: string; match: (p: string) => boolean };

function iniciais(nome: string): string {
  return (
    nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 1)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "S"
  );
}

export function DashShell({
  nome,
  email,
  fid,
  children,
}: {
  nome: string;
  email: string;
  fid: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const primeiro = nome.split(" ")[0] || "Você";
  const ini = iniciais(nome);
  const conviteHref = fid ? `/painel/${fid}` : "/painel/criar";

  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: "INÍCIO",
      items: [{ label: "Dashboard", d: IC.grid, href: "/painel", match: (p) => p === "/painel" }],
    },
    {
      title: "MEU CONVITE",
      items: [
        {
          label: "Meu convite",
          d: IC.mail,
          href: conviteHref,
          match: (p) =>
            p.startsWith("/painel/criar") ||
            p.startsWith("/painel/novo") ||
            (!!fid &&
              p.startsWith(`/painel/${fid}`) &&
              !p.includes("/convidados") &&
              !p.includes("/presentes")),
        },
        {
          label: "Convidados",
          d: IC.users,
          href: fid ? `/painel/${fid}/convidados` : "/painel/novo",
          match: (p) => p.includes("/convidados"),
        },
        {
          label: "Presentes",
          d: IC.gift,
          href: fid ? `/painel/${fid}/presentes` : "/painel/novo",
          match: (p) => p.includes("/presentes"),
        },
      ],
    },
    {
      title: "CONTA",
      items: [
        { label: "Minha conta", d: IC.user, href: "/painel/perfil", match: (p) => p.startsWith("/painel/perfil") },
        { label: "Plano", d: IC.card, href: "/painel/plano", match: (p) => p.startsWith("/painel/plano") },
        { label: "Ajuda", d: IC.help, href: "/painel/ajuda", match: (p) => p.startsWith("/painel/ajuda") },
      ],
    },
  ];

  const SidebarInner = (
    <>
      <div className="px-2.5 pb-[30px] pt-0.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/dash/logo-clara.png" alt="seuconvite — uma marca Orivya" className="w-[176px]" />
      </div>
      <nav className="flex flex-col gap-[22px]" aria-label="Painel">
        {groups.map((g) => (
          <div key={g.title}>
            <div className="px-3 pb-2 text-[10.5px] font-bold tracking-[0.12em] text-[#55555e]">
              {g.title}
            </div>
            <div className="flex flex-col gap-[3px]">
              {g.items.map((it) => {
                const active = it.match(pathname);
                return (
                  <Link
                    key={it.label}
                    href={it.href}
                    onClick={() => setDrawer(false)}
                    className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-[11px] transition-colors ${
                      active ? "bg-white" : "hover:bg-white/[0.06]"
                    }`}
                  >
                    <Ic d={it.d} size={17} stroke={active ? "#7C3AED" : "#8B8B93"} />
                    <span
                      className={`text-sm ${
                        active ? "font-semibold text-[#1f1f23]" : "font-medium text-[#b8b8bf]"
                      }`}
                    >
                      {it.label}
                    </span>
                    {active && (
                      <span className="absolute right-2.5 top-1/2 h-[18px] w-[3.5px] -translate-y-1/2 rounded-full bg-[#7C3AED]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <Link
        href="/painel/perfil"
        onClick={() => setDrawer(false)}
        className="mt-auto flex items-center gap-[11px] rounded-2xl p-2.5 transition-colors hover:bg-white/[0.06]"
      >
        <span className="grid size-[38px] shrink-0 place-items-center rounded-full bg-[linear-gradient(140deg,#7C3AED,#C4B5FD)] text-sm font-bold text-white">
          {ini}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-semibold text-white">{nome || "Minha conta"}</span>
          <span className="block truncate text-[11.5px] text-[#8b8b93]">{email}</span>
        </span>
        <Ic d={IC.chevronDown} size={14} stroke="#8B8B93" width={2} />
      </Link>
    </>
  );

  return (
    <div className="dash flex h-[100dvh] w-full overflow-hidden">
      {/* SIDEBAR — desktop */}
      <aside className="hidden w-[270px] flex-none flex-col bg-[#080808] px-[18px] pb-5 pt-7 lg:flex">
        {SidebarInner}
      </aside>

      {/* SIDEBAR — drawer mobile */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fechar menu"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
          />
          <aside className="dash-fade absolute inset-y-0 left-0 flex w-[274px] flex-col bg-[#080808] px-[18px] pb-5 pt-7">
            {SidebarInner}
          </aside>
        </div>
      )}

      {/* MAIN */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* TOPBAR */}
        <header className="flex h-[66px] flex-none items-center gap-3 border-b border-[#ececf0] bg-white px-4 sm:px-8">
          <button
            aria-label="Abrir menu"
            onClick={() => setDrawer(true)}
            className="grid size-[38px] place-items-center rounded-[11px] border border-[#ececf0] text-[#6e6e76] transition-colors hover:bg-[#f4f4f6] lg:hidden"
          >
            <Ic d={IC.menu} size={18} stroke="#6E6E76" width={2} />
          </button>

          <div className="hidden items-center gap-2.5 rounded-xl border border-[#ececf0] bg-[#f4f4f6] px-3.5 py-[9px] sm:flex sm:w-[300px] lg:w-[340px]">
            <Ic d={IC.search} size={15} stroke="#A6A6AE" width={2} />
            <input
              placeholder="Buscar no seu convite..."
              className="min-w-0 flex-1 border-none bg-transparent text-[13.5px] text-[#17171b]"
            />
          </div>

          <div className="flex-1" />

          <button
            aria-label="Ajuda"
            className="grid size-[38px] place-items-center rounded-[11px] border border-[#ececf0] text-[#6e6e76] transition-colors hover:bg-[#f4f4f6]"
          >
            <Ic d={IC.help} size={17} stroke="#6E6E76" />
          </button>
          <button
            aria-label="Notificações"
            className="relative grid size-[38px] place-items-center rounded-[11px] border border-[#ececf0] text-[#6e6e76] transition-colors hover:bg-[#f4f4f6]"
          >
            <Ic d={IC.bell} size={17} stroke="#6E6E76" />
            <span className="absolute right-2 top-2 size-[7px] rounded-full border-2 border-white bg-[#FF2D8D]" />
          </button>

          <div className="mx-1 h-6 w-px bg-[#ececf0]" />

          <div className="relative">
            <button
              onClick={() => setUserMenu((v) => !v)}
              className="flex items-center gap-2.5 rounded-[11px] px-2 py-[5px] transition-colors hover:bg-[#f4f4f6]"
            >
              <span className="grid size-8 place-items-center rounded-full bg-[linear-gradient(140deg,#7C3AED,#C4B5FD)] text-[12.5px] font-bold text-white">
                {ini}
              </span>
              <span className="hidden text-[13.5px] font-semibold sm:inline">{primeiro}</span>
              <Ic d={IC.chevronDown} size={13} stroke="#A6A6AE" width={2} />
            </button>
            {userMenu && (
              <>
                <button
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setUserMenu(false)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <div className="dash-fade absolute right-0 top-[52px] z-20 w-[186px] rounded-2xl border border-[#ececf0] bg-white p-1.5 shadow-[0_14px_34px_rgba(23,23,27,0.14)]">
                  <Link
                    href="/painel/perfil"
                    onClick={() => setUserMenu(false)}
                    className="block rounded-lg px-3.5 py-2.5 text-[13px] font-medium !text-[#17171b] transition-colors hover:bg-[#f4f4f6]"
                  >
                    Minha conta
                  </Link>
                  <Link
                    href="/painel/plano"
                    onClick={() => setUserMenu(false)}
                    className="block rounded-lg px-3.5 py-2.5 text-[13px] font-medium !text-[#17171b] transition-colors hover:bg-[#f4f4f6]"
                  >
                    Plano
                  </Link>
                  <form action={sair}>
                    <button
                      type="submit"
                      className="block w-full rounded-lg px-3.5 py-2.5 text-left text-[13px] font-medium text-[#d9376e] transition-colors hover:bg-[#fdf0f5]"
                    >
                      Sair
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </header>

        {/* CONTEÚDO */}
        <main className="dash-scroll flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
