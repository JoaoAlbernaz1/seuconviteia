"use client";

// Conteúdo do iframe da prévia do editor: o MESMO `InvitationRenderer` que o
// editor usava embutido, só que num documento próprio — assim as media queries
// do convite medem a moldura (390px no celular, 1024px no computador) e não a
// janela do painel.
//
// O documento canônico chega por postMessage a cada tecla (nunca por reload):
// avisamos "pronto" ao montar, o editor responde com o estado e continua
// mandando as atualizações. Como o React só re-renderiza o que mudou, digitar
// reflete na hora, sem piscar e sem perder a rolagem.
import { useEffect, useState } from "react";
import { InvitationRenderer } from "@/components/invitation-renderer/InvitationRenderer";
import { PreviewFoco } from "@/components/evt/PreviewFoco";
import {
  editorPreviewReadyMessage,
  isEditorPreviewReady,
  readEditorPreviewState,
  type EditorPreviewState,
} from "@/lib/event-editor/preview-bridge";

export function PreviaConvite() {
  const [estado, setEstado] = useState<EditorPreviewState | null>(null);

  useEffect(() => {
    const aoReceber = (evento: MessageEvent) => {
      // Mesma origem só: o editor e a prévia moram no mesmo app.
      if (evento.origin !== window.location.origin) return;
      if (isEditorPreviewReady(evento.data)) return; // eco do nosso próprio aviso
      const proximo = readEditorPreviewState(evento.data);
      if (proximo) setEstado(proximo);
    };
    window.addEventListener("message", aoReceber);
    window.parent?.postMessage(editorPreviewReadyMessage, window.location.origin);
    return () => window.removeEventListener("message", aoReceber);
  }, []);

  if (!estado) return null;

  return (
    <>
      <InvitationRenderer document={estado.document} mode="preview" page={estado.page} />
      {/* Destaque da seção em edição (anel + etiqueta), o mesmo do preview antigo. */}
      <PreviewFoco sec={estado.focus} />
    </>
  );
}
