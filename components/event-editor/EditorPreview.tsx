"use client";

// Prévia do editor: o convite dentro de uma MOLDURA DE APARELHO (iPhone /
// MacBook), num iframe de mesma origem (`/previa-convite`).
//
// O iframe não é enfeite: é ele que dá ao convite um viewport de verdade — 390px
// no celular, 1024px no computador. Renderizado embutido no painel, o convite
// media a janela do navegador (1440px) e o modo "Celular" mostrava o menu de
// desktop espremido.
//
// AO VIVO sem recarregar: o documento canônico vai por postMessage a cada tecla
// (ver `lib/event-editor/preview-bridge`) e o React lá dentro re-renderiza só o
// que mudou. O `src` do iframe nunca muda.
import { useEffect, useRef, useState } from "react";
import { dimensoesDoAparelho, IphoneFrame, MacFrame } from "@/components/device-frame/DeviceFrame";
import type { EventEditorDocument } from "@/lib/event-editor/document";
import {
  editorPreviewStateMessage,
  isEditorPreviewReady,
  type EditorPreviewPage,
} from "@/lib/event-editor/preview-bridge";

/** Título do iframe — é por ele que o e2e entra na prévia. */
export const TITULO_IFRAME_PREVIA = "Prévia do convite";

/** Orçamento de altura da coluna da prévia (o aparelho escala pra caber). */
const ALTURA = 700;
/** O celular fica no tamanho aprovado, alinhado ao topo; só o Mac usa a altura cheia. */
const ALTURA_CELULAR = 560;

export function EditorPreview({
  document: documento,
  page,
  focus,
  host,
  device,
  onDeviceChange,
}: {
  document: EventEditorDocument;
  page: EditorPreviewPage;
  focus?: string;
  /** Endereço mostrado na barra do Safari do MacBook. */
  host: string;
  device: "mobile" | "desktop";
  onDeviceChange: (device: "mobile" | "desktop") => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  // Estado MAIS novo para responder ao "pronto" do iframe (que chega depois de
  // montar e a cada troca de aparelho, que remonta a moldura e o iframe).
  const estadoRef = useRef({ document: documento, page, focus });
  useEffect(() => {
    estadoRef.current = { document: documento, page, focus };
  });

  useEffect(() => {
    const aoReceber = (evento: MessageEvent) => {
      if (evento.origin !== window.location.origin) return;
      if (evento.source !== frameRef.current?.contentWindow) return;
      if (!isEditorPreviewReady(evento.data)) return;
      frameRef.current?.contentWindow?.postMessage(
        editorPreviewStateMessage(estadoRef.current),
        window.location.origin,
      );
    };
    window.addEventListener("message", aoReceber);
    return () => window.removeEventListener("message", aoReceber);
  }, []);

  // Cada alteração do documento (ou da página/seção em foco) vai para a prévia.
  // Antes do "pronto" a mensagem se perde — o handshake acima cobre esse caso.
  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage(
      editorPreviewStateMessage({ document: documento, page, focus }),
      window.location.origin,
    );
  }, [documento, page, focus]);

  // Largura da coluna -> fator de escala do aparelho inteiro (mesma conta do
  // PreviewSite das telas do painel).
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

  const isMac = device === "desktop";
  const { largura: deviceW, altura: deviceH } = dimensoesDoAparelho(isMac ? "mac" : "iphone");
  const budgetH = isMac ? ALTURA : ALTURA_CELULAR;
  const fit =
    colW > 0
      ? Math.min(1, colW / deviceW, budgetH / deviceH)
      : Math.min(1, budgetH / deviceH);

  const tela = (
    <iframe
      ref={frameRef}
      title={TITULO_IFRAME_PREVIA}
      src="/previa-convite"
      className="absolute inset-0 size-full border-0"
    />
  );

  return (
    <section aria-label="Pré-visualização do convite" className="flex min-h-0 flex-col rounded-2xl border border-[#E4E4EA] bg-[#F6F6F8] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[#6E6E76]">É assim que os convidados vão ver</span>
        <div className="flex rounded-lg border border-[#E4E4EA] bg-white p-1" role="group" aria-label="Dispositivo da prévia">
          {(["mobile", "desktop"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={device === option}
              onClick={() => onDeviceChange(option)}
              className={`rounded-md px-2.5 py-1 text-xs ${device === option ? "bg-[#7C3AED] text-white" : "text-[#6E6E76]"}`}
            >
              {option === "mobile" ? "Celular" : "Computador"}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={areaRef}
        className={`flex w-full justify-center ${isMac ? "items-center" : ""}`}
        style={isMac ? { minHeight: ALTURA } : undefined}
      >
        <div style={{ width: deviceW * fit, height: deviceH * fit }}>
          <div
            style={{
              width: deviceW,
              height: deviceH,
              transform: `scale(${fit})`,
              transformOrigin: "top left",
            }}
          >
            {isMac ? <MacFrame host={host}>{tela}</MacFrame> : <IphoneFrame>{tela}</IphoneFrame>}
          </div>
        </div>
      </div>
    </section>
  );
}
