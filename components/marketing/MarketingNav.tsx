"use client";

import { useEffect, useState } from "react";

type NavLink = { href: string; label: string };

/** Marca seuconvite.ia — wordmark minúsculo com ".ia" em roxo. */
function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <a className="brand" href="#topo" aria-label="seuconvite.ia — início" onClick={onClick}>
      seuconvite<span className="ia">.ia</span>
    </a>
  );
}

/**
 * Nav da landing (tema dark tech): pílula de vidro flutuante fixa no topo.
 * Mobile: hambúrguer que faz morph para "X" + overlay de tela cheia. Trava o
 * scroll enquanto aberto e fecha no Esc / ao navegar.
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
      <div className="nav-wrap">
        <nav className="nav reveal d1" aria-label="Principal">
          <Brand onClick={() => setOpen(false)} />

          <div className="nav-links">
            {links.map((l) => (
              <a key={l.href} href={l.href}>{l.label}</a>
            ))}
          </div>

          <div className="nav-right">
            <a href={entrarHref} className="nav-enter">Entrar</a>
            <a href={cadastroHref} className="btn nav-cta">Criar meu convite</a>
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
        <a href={cadastroHref} className="btn primary block ma" onClick={() => setOpen(false)}>
          Criar meu convite
        </a>
        <a href={entrarHref} className="ml" style={{ fontSize: 16, marginTop: 8 }} onClick={() => setOpen(false)}>Entrar</a>
      </div>
    </>
  );
}
