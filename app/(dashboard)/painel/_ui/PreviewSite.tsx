"use client";

// Preview AO VIVO nas telas do painel DARK — a moldura simples do mockup
// (arredondada escura + faixa de endereco) com o SITE DE VERDADE dentro
// (`/preview-evento`, mesmos componentes do site publicado).
//
// - `rascunhoJson` muda -> debounce -> iframe com DOUBLE-BUFFER (o novo carrega
//   invisivel e so aparece pronto; nunca pisca em branco).
// - A largura acompanha a coluna (escala via ResizeObserver, viewport real de
//   390px — o site responde como num celular de verdade).
import { useEffect, useRef, useState } from "react";

/** Debounce simples de valor (nao recarrega o preview a cada tecla). */
export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function PreviewIframe({
  src,
  width,
  height,
  scale,
}: {
  src: string;
  width: number;
  height: number;
  scale: number;
}) {
  const [front, setFront] = useState<"a" | "b">("a");
  const [srcA, setSrcA] = useState(src);
  const [srcB, setSrcB] = useState<string | null>(null);

  const frontSrc = front === "a" ? srcA : srcB;
  const backIs: "a" | "b" = front === "a" ? "b" : "a";
  const backSrc = backIs === "a" ? srcA : srcB;

  // Padrao "ajustar estado durante o render": o src desejado mudou -> carrega
  // no slot de tras (o da frente continua visivel ate o novo terminar).
  if (src !== frontSrc && src !== backSrc) {
    if (backIs === "a") setSrcA(src);
    else setSrcB(src);
  }

  function aoCarregarTras() {
    const atras = backIs === "a" ? srcA : srcB;
    if (atras === src) setFront(backIs);
  }

  const style: React.CSSProperties = {
    width,
    height,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    border: 0,
  };

  return (
    <div
      className="relative overflow-hidden bg-white"
      style={{ width: Math.round(width * scale), height: Math.round(height * scale) }}
    >
      {srcA ? (
        <iframe
          title="Prévia do site do evento"
          src={srcA}
          style={style}
          className={`absolute left-0 top-0 ${front === "a" ? "" : "invisible"}`}
          onLoad={front !== "a" ? aoCarregarTras : undefined}
        />
      ) : null}
      {srcB ? (
        <iframe
          title="Prévia do site do evento (carregando)"
          src={srcB}
          style={style}
          className={`absolute left-0 top-0 ${front === "b" ? "" : "invisible"}`}
          onLoad={front !== "b" ? aoCarregarTras : undefined}
        />
      ) : null}
    </div>
  );
}

const VIEWPORT = 390; // largura de celular real — o site responde como mobile

export function PreviewSite({
  rascunhoJson,
  pagina = "inicio",
  host,
  rotulo = "É assim que os convidados vão ver",
  altura = 600,
}: {
  /** JSON do rascunho (string) — vira `?s=` da rota /preview-evento. */
  rascunhoJson: string;
  /** Página do site no preview: inicio | evento | presentes | galeria. */
  pagina?: string;
  /** Endereço mostrado na faixa do topo (ex.: maria.seuconviteia.com). */
  host: string;
  rotulo?: string;
  /** Altura do miolo em px de viewport (escala junto). */
  altura?: number;
}) {
  const estavel = useDebounced(rascunhoJson, 500);
  const src = `/preview-evento?p=${pagina}&s=${encodeURIComponent(estavel)}`;
  const atualizando = estavel !== rascunhoJson;

  // Escala para caber na coluna (viewport interno fixo de 390px).
  const areaRef = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setEscala(Math.min(1, w / VIEWPORT));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-scv-muted">
        <span
          className={`size-[7px] rounded-full ${
            atualizando
              ? "animate-pulse bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.2)]"
              : "bg-teal shadow-[0_0_0_3px_rgba(14,165,166,0.16)]"
          }`}
          aria-hidden
        />
        {atualizando ? "Atualizando…" : rotulo}
      </div>
      <div className="rounded-[28px] bg-[#17171B] p-2.5 shadow-[0_30px_60px_-26px_rgba(0,0,0,0.6)]">
        <div className="overflow-hidden rounded-[20px] bg-white">
          <div className="truncate bg-[#EDF0F4] py-1.5 text-center text-[10px] text-[#94A3B8]">
            {host}
          </div>
          <div ref={areaRef} className="w-full">
            <PreviewIframe
              src={src}
              width={VIEWPORT}
              height={Math.round(altura / escala)}
              scale={escala}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
