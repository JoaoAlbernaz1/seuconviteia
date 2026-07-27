"use client";

// SÓ NO PREVIEW DO EDITOR: aponta o ponto em edição (`sec`, vindo do `?f=`) com um
// DESTAQUE em volta de `[data-sec="<sec>"]` — anel limpo + leve escurecimento do
// resto (holofote) + etiqueta com o nome da área (estilo Figma/Framer).
//
// Antiflicker ("a tela não pode balançar enquanto digito"): a prévia RECARREGA a
// cada mudança (rede de segurança). Para não tremer, distinguimos via
// sessionStorage (persiste entre reloads no mesmo iframe):
//  · reload por DIGITAÇÃO (mesma seção) → restaura a rolagem anterior e desenha o
//    destaque ESTÁTICO (sem rolar de novo, sem re-animar).
//  · troca de CAMPO (seção diferente) → rola até a seção UMA vez + destaque animado.
// No site publicado nunca é montado; inerte lá.
import { useEffect } from "react";

const K_SEC = "evt-foco-last";
const K_Y = "evt-foco-y";

// Nome amigável de cada área (o que aparece na etiqueta do destaque).
const ROTULOS: Record<string, string> = {
  capa: "Capa",
  "capa-nome": "Nome",
  "capa-idade": "Idade",
  carta: "Mensagem",
  "carta-titulo": "Título da mensagem",
  "carta-texto": "Texto da mensagem",
  quando: "Quando e onde",
  traje: "Traje",
  programacao: "Programação",
  cta: "Botão de confirmar",
  presentes: "Presentes",
  galeria: "Galeria",
};

export function PreviewFoco({ sec }: { sec?: string }) {
  useEffect(() => {
    if (!sec) return;
    const alvos = Array.from(document.querySelectorAll<HTMLElement>(`[data-sec="${sec}"]`));
    const el = alvos.find((e) => e.getBoundingClientRect().width > 0) ?? alvos[0];
    if (!el) return;

    const reduz =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let mesmaSecao = false;
    try {
      mesmaSecao = sessionStorage.getItem(K_SEC) === sec;
    } catch {
      mesmaSecao = false;
    }

    const restauracoes: number[] = [];
    if (mesmaSecao) {
      // reload por digitação: mantém a rolagem exatamente onde estava (sem tremer).
      // Re-tenta enquanto o conteúdo assenta (fontes/imagens mudam a altura e o
      // primeiro scrollTo pode ser "cortado" antes da página ficar alta o bastante).
      const restaurar = () => {
        try {
          const y = Number(sessionStorage.getItem(K_Y) || "0");
          if (y && Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
        } catch {}
      };
      restaurar();
      restauracoes.push(
        window.setTimeout(restaurar, 0),
        window.setTimeout(restaurar, 60),
        window.setTimeout(restaurar, 180),
        window.setTimeout(restaurar, 360),
      );
    } else {
      // troca de campo: rola até a seção uma única vez.
      el.scrollIntoView({ behavior: reduz ? "auto" : "smooth", block: "center" });
      try {
        sessionStorage.setItem(K_SEC, sec);
      } catch {}
    }

    // guarda a rolagem continuamente p/ restaurar no próximo reload.
    const salvarY = () => {
      try {
        sessionStorage.setItem(K_Y, String(window.scrollY));
      } catch {}
    };
    window.addEventListener("scroll", salvarY, { passive: true });

    // destaque em volta do elemento (herda --ev-rosa do .evt).
    const mark = document.createElement("div");
    mark.className = mesmaSecao ? "evt-foco-mark evt-foco-mark--estatico" : "evt-foco-mark";
    // etiqueta com o nome da área
    const label = document.createElement("div");
    label.className = "evt-foco-label";
    label.textContent = ROTULOS[sec] ?? "Editando";
    mark.appendChild(label);
    const host = document.querySelector<HTMLElement>(".evt") ?? document.body;
    host.appendChild(mark);

    const posicionar = () => {
      const r = el.getBoundingClientRect();
      const padX = 12;
      const padY = 8;
      const vw = document.documentElement.clientWidth;
      const left = Math.max(3, r.left + window.scrollX - padX);
      const width = Math.min(vw - left - 6, r.width + padX * 2);
      mark.style.left = `${left}px`;
      mark.style.top = `${r.top + window.scrollY - padY}px`;
      mark.style.width = `${Math.max(0, width)}px`;
      mark.style.height = `${r.height + padY * 2}px`;
      // etiqueta acima do anel quando há espaço; senão, dentro do topo.
      const acima = r.top > 34;
      label.style.top = acima ? "-27px" : "8px";
    };
    posicionar();
    const t1 = setTimeout(posicionar, 420);
    window.addEventListener("resize", posicionar);
    window.addEventListener("scroll", posicionar, true);

    return () => {
      clearTimeout(t1);
      restauracoes.forEach((id) => clearTimeout(id));
      window.removeEventListener("resize", posicionar);
      window.removeEventListener("scroll", posicionar, true);
      window.removeEventListener("scroll", salvarY);
      mark.remove();
    };
  }, [sec]);

  return (
    <style>{`
      .evt-foco-mark {
        position: absolute;
        z-index: 9999;
        pointer-events: none;
        border: 2px solid var(--ev-rosa);
        border-radius: 14px;
        box-shadow:
          0 0 0 4px color-mix(in srgb, var(--ev-rosa) 22%, transparent),
          0 10px 30px color-mix(in srgb, var(--ev-rosa) 26%, transparent),
          0 0 0 9999px color-mix(in srgb, #140a12 40%, transparent);
        animation: evtFoco 0.45s cubic-bezier(0.16,1,0.3,1) both;
      }
      /* reload por digitação: destaque aparece pronto, sem re-animar (não pisca). */
      .evt-foco-mark--estatico { animation: none; }
      .evt-foco-label {
        position: absolute;
        left: -2px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        max-width: 90vw;
        padding: 4px 11px 4px 9px;
        border-radius: 999px;
        background: var(--ev-rosa);
        color: #fff;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
        font-size: 12px;
        font-weight: 600;
        line-height: 1;
        letter-spacing: 0.01em;
        white-space: nowrap;
        box-shadow: 0 4px 14px rgba(0,0,0,0.28);
      }
      .evt-foco-label::before {
        content: "";
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #fff;
        opacity: 0.95;
      }
      @keyframes evtFoco {
        0%   { opacity: 0; transform: scale(1.06); }
        100% { opacity: 1; transform: scale(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        .evt-foco-mark { animation: none; }
      }
    `}</style>
  );
}
