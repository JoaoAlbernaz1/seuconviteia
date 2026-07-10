"use client";

// Preview AO VIVO das telas do painel — o SITE DE VERDADE (`/preview-evento`,
// mesmos componentes do site publicado) dentro de uma MOLDURA REALISTA de
// aparelho, com um seletor iPhone <-> Mac.
//
// - iPhone: bezel escuro, Dynamic Island, botoes laterais e barra de "home".
//   O site aparece em tela cheia (layout de CELULAR, viewport 390px).
// - Mac: MacBook (bezel + notch + base de aluminio) com uma janela do Safari
//   (bolinhas de transito + endereco). O site cai no layout de COMPUTADOR
//   (viewport 1280px) — o que o preview de celular nunca mostra.
//
// Tecnica:
// - `rascunhoJson` muda -> debounce -> iframe com DOUBLE-BUFFER (o novo carrega
//   invisivel e so aparece pronto; nunca pisca em branco).
// - O APARELHO INTEIRO (moldura + tela) e desenhado em px "de projeto" e
//   escalado por um unico `transform: scale(fit)` para caber na coluna, entao
//   as proporcoes ficam perfeitas em qualquer largura. Trocar de aparelho so
//   muda o tamanho do iframe (mesmo `src`): o conteudo reflui, sem recarregar.
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

type Device = "iphone" | "mac";

const VIEWPORT_PHONE = 390; // celular real — o site responde como mobile
const PHONE_SCREEN_H = 844; // tela do iPhone (390x844 ~ 19.5:9) — ALTO e FINO
const PHONE_BEZEL = 12; // bezel fino e uniforme
const VIEWPORT_MAC = 1280; // desktop real — o site cai no layout de computador
// MacBook (px de projeto) — usados no frame E no cálculo de escala do pai.
const MAC_BAR = 44; // barra do Safari (bolinhas + endereço)
const MAC_SITE_H = 764; // altura útil do site (a tela 16:10 = BAR + SITE_H)
const MAC_BEZEL = 10; // aro preto ao redor da tela
const MAC_BEZEL_BOT = 12; // "queixo" um tico maior
const MAC_HINGE = 8; // dobradiça
const MAC_BASE = 18; // base de alumínio (vista de frente)
const MAC_OVERHANG = 120; // a base é mais larga que a tela

/**
 * Tela com DOUBLE-BUFFER: dois iframes empilhados; quando o `src` muda, o novo
 * carrega no slot de tras (invisivel) e so vira frente quando termina. Assim a
 * previa nunca pisca em branco enquanto o profissional digita.
 * Preenche 100% do pai — quem define tamanho e cantos e a moldura.
 */
function ScreenBuffer({ src }: { src: string }) {
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

  return (
    <>
      {srcA ? (
        <iframe
          title="Prévia do site do evento"
          src={srcA}
          className={`absolute inset-0 size-full border-0 ${front === "a" ? "" : "invisible"}`}
          onLoad={front !== "a" ? aoCarregarTras : undefined}
        />
      ) : null}
      {srcB ? (
        <iframe
          title="Prévia do site do evento (carregando)"
          src={srcB}
          className={`absolute inset-0 size-full border-0 ${front === "b" ? "" : "invisible"}`}
          onLoad={front !== "b" ? aoCarregarTras : undefined}
        />
      ) : null}
    </>
  );
}

/** iPhone realista — proporcao 390x844 (alto e fino, como um iPhone de verdade). */
function IphoneFrame({ src }: { src: string }) {
  const BEZEL = PHONE_BEZEL;
  const bodyW = VIEWPORT_PHONE + BEZEL * 2;
  const bodyH = PHONE_SCREEN_H + BEZEL * 2;
  return (
    <div className="relative" style={{ width: bodyW, height: bodyH }}>
      {/* botoes laterais (esquerda: silencioso + volume; direita: power) */}
      <span className="absolute -left-[3px] top-[92px] h-6 w-[3px] rounded-l bg-[#1b1b1f]" />
      <span className="absolute -left-[3px] top-[132px] h-12 w-[3px] rounded-l bg-[#2a2a2f]" />
      <span className="absolute -left-[3px] top-[196px] h-12 w-[3px] rounded-l bg-[#2a2a2f]" />
      <span className="absolute -right-[3px] top-[160px] h-16 w-[3px] rounded-r bg-[#2a2a2f]" />

      {/* corpo (titanio) */}
      <div
        className="absolute inset-0 bg-[linear-gradient(150deg,#42424a,#1c1c20_38%,#26262c)] shadow-[0_40px_80px_-28px_rgba(0,0,0,0.65)]"
        style={{ borderRadius: 56, padding: BEZEL }}
      >
        {/* tela */}
        <div
          className="relative size-full overflow-hidden bg-white"
          style={{ borderRadius: 44 }}
        >
          <ScreenBuffer src={src} />
          {/* Dynamic Island */}
          <div className="pointer-events-none absolute left-1/2 top-2 h-[30px] w-[112px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
            <span className="absolute right-3.5 top-1/2 size-2 -translate-y-1/2 rounded-full bg-[#0b0b14] shadow-[inset_0_0_0_1px_rgba(90,110,150,0.5)]" />
          </div>
          {/* barra de home */}
          <div className="pointer-events-none absolute bottom-2 left-1/2 h-[5px] w-[128px] -translate-x-1/2 rounded-full bg-black/30" />
        </div>
      </div>
    </div>
  );
}

/** MacBook realista com janela do Safari dentro. `host` vai na barra de endereço. */
function MacFrame({ src, host }: { src: string; host: string }) {
  const winH = MAC_BAR + MAC_SITE_H; // tela 16:10
  const lidW = VIEWPORT_MAC + MAC_BEZEL * 2;
  const lidH = winH + MAC_BEZEL + MAC_BEZEL_BOT;
  const baseW = lidW + MAC_OVERHANG;

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: baseW, height: lidH + MAC_HINGE + MAC_BASE }}
    >
      {/* tampa (tela) — vidro preto com aro fino de alumínio */}
      <div
        className="relative bg-[#050506] shadow-[0_44px_70px_-34px_rgba(0,0,0,0.7),inset_0_0_0_2px_#42454b,inset_0_0_0_3.5px_#0c0c0e]"
        style={{
          width: lidW,
          height: lidH,
          borderRadius: "22px 22px 5px 5px",
          paddingTop: MAC_BEZEL,
          paddingLeft: MAC_BEZEL,
          paddingRight: MAC_BEZEL,
          paddingBottom: MAC_BEZEL_BOT,
        }}
      >
        {/* notch da câmera */}
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 flex h-[13px] w-[124px] -translate-x-1/2 items-start justify-center rounded-b-[7px] bg-[#050506]">
          <span className="mt-[3px] size-[5px] rounded-full bg-[#0e1116] shadow-[inset_0_0_0_1px_rgba(90,110,150,0.45)]" />
        </div>
        {/* janela do Safari */}
        <div className="relative size-full overflow-hidden rounded-[6px] bg-white">
          {/* barra: bolinhas de trânsito + endereço */}
          <div
            className="flex items-center gap-2 border-b border-[#e4e6ea] bg-[linear-gradient(#f7f8fa,#eef0f2)] px-4"
            style={{ height: MAC_BAR }}
          >
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.14)]" />
              <span className="size-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.14)]" />
              <span className="size-3 rounded-full bg-[#28c840] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.14)]" />
            </span>
            <span className="mx-auto flex h-[27px] max-w-[58%] items-center gap-1.5 truncate rounded-lg bg-white px-3 text-[13px] text-[#5f6672] shadow-[inset_0_0_0_1px_#e6e8ec]">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                className="shrink-0 opacity-70"
                aria-hidden
              >
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              <span className="truncate">{host}</span>
            </span>
            <span className="w-[52px] shrink-0" aria-hidden />
          </div>
          {/* conteúdo (site em layout desktop) */}
          <div className="relative" style={{ height: MAC_SITE_H }}>
            <ScreenBuffer src={src} />
          </div>
        </div>
      </div>

      {/* dobradiça */}
      <div
        className="bg-[linear-gradient(#4a4d53,#26282c)] shadow-[inset_0_1px_0_rgba(255,255,255,0.09)]"
        style={{ width: lidW, height: MAC_HINGE }}
      />
      {/* base de alumínio (mais larga, com o recorte central) */}
      <div
        className="relative bg-[linear-gradient(180deg,#e6e8ec,#b8bcc3_58%,#989ca4)] shadow-[0_24px_34px_-20px_rgba(0,0,0,0.6)]"
        style={{
          width: baseW,
          height: MAC_BASE,
          borderRadius: "3px 3px 12px 12px",
        }}
      >
        <span className="absolute left-1/2 top-0 h-[7px] w-[118px] -translate-x-1/2 rounded-b-[9px] bg-[#9296a0]" />
      </div>
    </div>
  );
}

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
  /** Endereço mostrado na barra do Mac (ex.: maria.seuconviteia.com). */
  host: string;
  rotulo?: string;
  /** Altura útil da tela do iPhone em px de viewport (escala junto). */
  altura?: number;
}) {
  const estavel = useDebounced(rascunhoJson, 500);
  const src = `/preview-evento?p=${pagina}&s=${encodeURIComponent(estavel)}`;
  const atualizando = estavel !== rascunhoJson;
  const [device, setDevice] = useState<Device>("iphone");

  // Largura da coluna -> fator de escala do aparelho inteiro.
  const areaRef = useRef<HTMLDivElement>(null);
  const [colW, setColW] = useState(0);
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setColW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Dimensões "de projeto" do aparelho escolhido (mesmas contas dos frames).
  // `altura` é o ORÇAMENTO de altura da prévia — o aparelho escala pra caber
  // nela E na largura da coluna, mantendo a proporção real (o iPhone fica alto
  // e fino, nunca "gordo pros lados").
  const deviceW =
    device === "iphone"
      ? VIEWPORT_PHONE + PHONE_BEZEL * 2
      : VIEWPORT_MAC + MAC_BEZEL * 2 + MAC_OVERHANG;
  const deviceH =
    device === "iphone"
      ? PHONE_SCREEN_H + PHONE_BEZEL * 2
      : MAC_BAR + MAC_SITE_H + MAC_BEZEL + MAC_BEZEL_BOT + MAC_HINGE + MAC_BASE;
  const fit =
    colW > 0
      ? Math.min(1, colW / deviceW, altura / deviceH)
      : Math.min(1, altura / deviceH);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-scv-muted">
          <span
            className={`size-[7px] rounded-full ${
              atualizando
                ? "animate-pulse bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.2)]"
                : "bg-teal shadow-[0_0_0_3px_rgba(14,165,166,0.16)]"
            }`}
            aria-hidden
          />
          <span className="truncate">{atualizando ? "Atualizando…" : rotulo}</span>
        </div>
        {/* seletor Celular / Computador */}
        <div
          role="group"
          aria-label="Ver como celular ou computador"
          className="flex shrink-0 rounded-full bg-scv-soft p-0.5 text-xs font-semibold shadow-[inset_0_0_0_1px_var(--scv-line)]"
        >
          {(
            [
              ["iphone", "Celular"],
              ["mac", "Computador"],
            ] as const
          ).map(([val, label]) => {
            const on = device === val;
            return (
              <button
                key={val}
                type="button"
                aria-pressed={on}
                onClick={() => setDevice(val)}
                className={`rounded-full px-3 py-1 transition-colors ${
                  on
                    ? "bg-scv-card text-scv-ink shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                    : "text-scv-muted hover:text-scv-ink"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div ref={areaRef} className="flex w-full justify-center">
        <div style={{ width: deviceW * fit, height: deviceH * fit }}>
          <div
            style={{
              width: deviceW,
              height: deviceH,
              transform: `scale(${fit})`,
              transformOrigin: "top left",
            }}
          >
            {device === "iphone" ? (
              <IphoneFrame src={src} />
            ) : (
              <MacFrame src={src} host={host} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
