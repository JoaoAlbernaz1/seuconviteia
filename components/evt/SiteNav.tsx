"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Recurso, RecursosPlano } from "@/lib/plans";

// Cada link da nav. `recurso` = upsell que precisa estar destravado para o link
// aparecer; `null` = sempre visivel (base do convite).
const LINKS: { href: string; label: string; recurso: Recurso | null }[] = [
  { href: "/", label: "Início", recurso: null },
  { href: "/evento", label: "Evento", recurso: null },
  { href: "/confirmar", label: "Confirmar", recurso: "rsvp" },
  { href: "/presentes", label: "Presentes", recurso: null },
  { href: "/galeria", label: "Galeria", recurso: "galeria" },
  { href: "/recados", label: "Recados", recurso: "recados" },
];

/**
 * SiteNav — barra fixa em TODAS as paginas (inclusive a capa).
 * Sobre o hero ESCURO da capa (topo da home) ela e transparente com texto marfim;
 * ao rolar pro interior claro — ou nas paginas claras — vira branca com texto ink.
 * A marca e o NOME do evento (wordmark de texto), escondido sobre a capa.
 *
 * GATING: `recursos` (upsells do evento) filtra os links — Confirmar/Galeria/
 * Recados so aparecem se o upsell esta destravado; Início/Evento/Presentes sao
 * sempre base.
 */
export function SiteNav({
  nome,
  recursos,
}: {
  nome: string;
  recursos: RecursosPlano;
}) {
  const pathname = usePathname();
  const links = LINKS.filter((l) => l.recurso === null || recursos[l.recurso]);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Na home (capa escura full-bleed), so fica solida depois de passar o hero.
    const onScroll = () => {
      const limite = pathname === "/" ? window.innerHeight * 0.8 : 24;
      setScrolled(window.scrollY > limite);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // Trava o scroll do body enquanto o drawer esta aberto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || open;
  // Sobre a capa escura (home, antes de rolar) -> texto claro/transparente.
  const overHero = pathname === "/" && !solid;

  const wordmark = overHero ? "text-white" : "text-evt-ink";
  const linkIdle = overHero ? "text-white/90" : "text-evt-ink-soft";
  const linkActive = overHero ? "text-white" : "text-evt-rosa-ink";
  const linkHover = overHero ? "hover:text-white" : "hover:text-evt-rosa-ink";
  const ringClr = overHero ? "focus-visible:ring-white" : "focus-visible:ring-evt-rosa-ink";
  const ringOff = overHero ? "focus-visible:ring-offset-[#160C12]" : "focus-visible:ring-offset-white";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid
          ? "border-b border-[var(--line)] bg-white/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-[clamp(1.25rem,5vw,2rem)]"
      >
        {/* Marca — wordmark de texto (nome do evento) */}
        <Link
          href="/"
          aria-label={`${nome} — início`}
          className={`flex cursor-pointer items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 ${ringClr} focus-visible:ring-offset-2 ${ringOff}`}
        >
          {/* Wordmark escondido NA CAPA — aparece nas paginas internas. */}
          <span className={`font-evt-util text-[0.7rem] uppercase tracking-[0.28em] transition-colors ${overHero ? "hidden" : "hidden sm:inline-block"} ${wordmark}`}>
            {nome}
          </span>
        </Link>

        {/* Links — desktop */}
        <ul className="hidden items-center gap-7 md:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`link-underline font-evt-util text-[0.66rem] uppercase tracking-[0.24em] transition-colors ${linkHover} focus-visible:outline-none focus-visible:ring-2 ${ringClr} focus-visible:ring-offset-2 ${ringOff} ${
                    active ? linkActive : linkIdle
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Botao hamburguer — mobile */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-drawer"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 ${ringClr} focus-visible:ring-offset-2 ${ringOff} md:hidden ${wordmark}`}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {/* Drawer mobile — sempre claro */}
      {open && (
        <div id="mobile-drawer" className="border-t border-[var(--line)] bg-white md:hidden">
          <ul className="mx-auto flex max-w-[1100px] flex-col px-[clamp(1.25rem,5vw,2rem)] py-3">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-md px-1 py-3.5 font-evt-util text-[0.72rem] uppercase tracking-[0.24em] transition-colors hover:text-evt-rosa-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink ${
                      active ? "text-evt-rosa-ink" : "text-evt-ink-soft"
                    }`}
                  >
                    {active && <span className="text-evt-rosa text-[0.6rem]" aria-hidden>◆</span>}
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
