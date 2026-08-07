"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type NavLink = { href: string; label: string };

/**
 * Header da landing (port do design do João no Claude Design): barra sticky
 * translúcida com o monograma + wordmark, links no centro e "Entrar" +
 * botão gradiente. Mobile: hambúrguer que vira "X" + overlay de tela cheia.
 *
 * Animação: a barra escurece/ganha borda lilás quando sai do topo — detectado
 * por IntersectionObserver num sentinela (sem listener de scroll, que causa
 * reflow contínuo).
 */
export function MarketingNav({
  links,
  entrarHref,
  cadastroHref,
}: {
  links: readonly NavLink[];
  entrarHref: string;
  cadastroHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sentinela = document.getElementById("mkt-topo-sentinela");
    if (!sentinela || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { threshold: 0 });
    io.observe(sentinela);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <span id="mkt-topo-sentinela" aria-hidden style={{ position: "absolute", top: 0, height: 1, width: 1 }} />

      <div className="nav-wrap" data-scrolled={scrolled ? "true" : "false"}>
        <nav className="nav" aria-label="Principal">
          <a className="brand" href="#topo" onClick={() => setOpen(false)}>
            <Image src="/brand/monograma.png" alt="seuconvite" width={793} height={615} priority />
            <span>seu<b>convite</b></span>
          </a>

          <div className="nav-links">
            {links.map((l) => (
              <a key={l.href} href={l.href}>{l.label}</a>
            ))}
          </div>

          <div className="nav-right">
            <a href={entrarHref} className="nav-enter">Entrar</a>
            <a href="#precos" className="btn grad nav-cta">Ver planos</a>
            <button
              type="button"
              className="burger"
              aria-expanded={open}
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span /><span />
            </button>
          </div>
        </nav>
      </div>

      <div className="m-overlay" data-open={open ? "true" : "false"} inert={!open}>
        {links.map((l) => (
          <a key={l.href} href={l.href} className="ml" onClick={() => setOpen(false)}>{l.label}</a>
        ))}
        <a href={cadastroHref} className="btn grad ma" onClick={() => setOpen(false)}>Ver planos</a>
        <a href={entrarHref} className="ml" style={{ fontSize: 16, marginTop: 10 }} onClick={() => setOpen(false)}>
          Entrar
        </a>
      </div>
    </>
  );
}
