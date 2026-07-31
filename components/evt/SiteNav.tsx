"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RecursoSite, TogglesSite } from "@/lib/recursos";

// Cada link da nav. `recurso` = recurso do site que precisa estar ATIVO (plano
// permite ∩ toggle do evento — lib/recursos) para o link aparecer; `null` =
// sempre visivel (Início/Evento).
const LINKS: { href: string; label: string; recurso: RecursoSite | null }[] = [
  { href: "/", label: "Início", recurso: null },
  { href: "/evento", label: "Evento", recurso: null },
  { href: "/confirmar", label: "Confirmar", recurso: "rsvp" },
  { href: "/presentes", label: "Presentes", recurso: "presentes" },
  { href: "/galeria", label: "Galeria", recurso: "galeria" },
  { href: "/recados", label: "Recados", recurso: "recados" },
];

/**
 * SiteNav — barra fixa em TODAS as paginas (inclusive a capa).
 * Sobre o hero ESCURO da capa (topo da home) ela e transparente com texto marfim;
 * ao rolar pro interior claro — ou nas paginas claras — vira branca com texto ink.
 * A marca e o NOME do evento (wordmark de texto), escondido sobre a capa.
 *
 * GATING: `recursos` (recursos ATIVOS do site) filtra os links — Confirmar/
 * Presentes/Galeria/Recados so aparecem se o recurso esta ativo.
 */
/** Mapeia o href real da nav -> página do preview (`/preview-evento?p=`). */
const PREVIEW_PAGE: Record<string, string> = {
  "/": "inicio",
  "/evento": "evento",
  "/presentes": "presentes",
  "/galeria": "galeria",
  "/confirmar": "confirmar",
  "/recados": "recados",
};

export function SiteNav({
  nome,
  logoUrl,
  monograma = true,
  recursos,
  preview,
}: {
  nome: string;
  /** Monograma/logo do evento (ex.: mc.png). Ausente ⇒ iniciais do nome. */
  logoUrl?: string;
  /** Mostrar o monograma na barra (default: sim). Off ⇒ só o nome. */
  monograma?: boolean;
  recursos: TogglesSite;
  /**
   * Modo PREVIEW (dentro do iframe do editor): links navegam a própria prévia
   * (`/preview-evento?p=&s=`) em vez das rotas reais, e os estados ativo/hero
   * vêm da `pagina` mostrada, não do pathname (que é sempre `/preview-evento`).
   */
  preview?: { s: string; pagina: string };
}) {
  const pathname = usePathname();
  const links = LINKS.filter((l) => l.recurso === null || recursos[l.recurso]);
  // No preview, cada link aponta pra própria prévia (mantendo o rascunho `s`).
  const hrefDe = (href: string) =>
    preview
      ? `/preview-evento?p=${PREVIEW_PAGE[href] ?? "inicio"}&s=${encodeURIComponent(preview.s)}`
      : href;
  const ehAtivo = (href: string) =>
    preview ? PREVIEW_PAGE[href] === preview.pagina : pathname === href;
  const naHome = preview ? preview.pagina === "inicio" : pathname === "/";
  // Iniciais do nome p/ o monograma-fallback (ex.: "Maria Clara" -> "MC").
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Na home (capa escura full-bleed), so fica solida depois de passar o hero.
    const onScroll = () => {
      const limite = naHome ? window.innerHeight * 0.8 : 24;
      setScrolled(window.scrollY > limite);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname, naHome]);

  // Trava o scroll do body enquanto o drawer esta aberto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const solid = scrolled || open;
  // Sobre a capa escura (home, antes de rolar) -> texto claro/transparente.
  const overHero = naHome && !solid;
  const claro = overHero;

  const wordmark = claro ? "text-white" : "text-evt-ink";
  const linkIdle = claro ? "text-white/85" : "text-evt-ink-soft";
  const linkActive = claro ? "text-white" : "text-evt-rosa-ink";
  const linkHover = claro ? "hover:text-white" : "hover:text-evt-rosa-ink";
  const ringClr = claro ? "focus-visible:ring-white" : "focus-visible:ring-evt-rosa-ink";
  const ringOff = claro ? "focus-visible:ring-offset-[#160C12]" : "focus-visible:ring-offset-white";
  const solidBg = "border-b border-[var(--line)] bg-white/90 backdrop-blur-md";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? solidBg : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-[clamp(1.25rem,5vw,2rem)]"
      >
        {/* Marca — monograma do evento (logo) ou iniciais. SEMPRE visível,
            inclusive sobre a capa (igual ao site da festa). */}
        <Link
          href={hrefDe("/")}
          aria-label={`${nome} — início`}
          className={`flex cursor-pointer items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 ${ringClr} focus-visible:ring-offset-2 ${ringOff}`}
        >
          {monograma && (
            <span data-sec="monograma" className="inline-flex items-center">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={nome}
                  width={84}
                  height={84}
                  priority
                  className="h-[42px] w-[42px] object-contain"
                />
              ) : (
                <span className={`font-evt-display text-[1.6rem] leading-none tracking-[0.06em] transition-colors ${claro ? "text-white" : "text-evt-rosa-ink"}`}>
                  {iniciais}
                </span>
              )}
            </span>
          )}
          {/* Wordmark (nome do evento) — escondido SOBRE a capa, aparece nas páginas
              internas. Se o monograma está OFF, o nome vira a marca (sempre visível). */}
          <span className={`font-evt-util text-[0.7rem] uppercase tracking-[0.28em] transition-colors ${!monograma ? "inline-block" : overHero ? "hidden" : "hidden sm:inline-block"} ${wordmark}`}>
            {nome}
          </span>
        </Link>

        {/* Links — desktop */}
        <ul className="hidden items-center gap-7 md:flex">
          {links.map((l) => {
            const active = ehAtivo(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={hrefDe(l.href)}
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

      {/* Drawer mobile */}
      {open && (
        <div
          id="mobile-drawer"
          className="border-t border-[var(--line)] bg-white md:hidden"
        >
          <ul className="mx-auto flex max-w-[1100px] flex-col px-[clamp(1.25rem,5vw,2rem)] py-3">
            {links.map((l) => {
              const active = ehAtivo(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={hrefDe(l.href)}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-md px-1 py-3.5 font-evt-util text-[0.72rem] uppercase tracking-[0.24em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-evt-rosa-ink ${
                      active ? "text-evt-rosa-ink" : "text-evt-ink-soft hover:text-evt-rosa-ink"
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
