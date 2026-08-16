import { describe, expect, it } from "vitest";
import { createDefaultEventDocument } from "./document";
import {
  editorPreviewReadyMessage,
  editorPreviewStateMessage,
  isEditorPreviewReady,
  readEditorPreviewState,
} from "./preview-bridge";

describe("ponte entre o editor e o iframe da prévia", () => {
  const document = createDefaultEventDocument({ basic: { name: "Ana Clara" } });

  it("entrega o documento canônico e a página pedida", () => {
    const message = editorPreviewStateMessage({ document, page: "presentes", focus: "capa-nome" });
    const state = readEditorPreviewState(message);
    expect(state?.document.basic.name).toBe("Ana Clara");
    expect(state?.page).toBe("presentes");
    expect(state?.focus).toBe("capa-nome");
  });

  it("reconhece o aviso de pronto sem confundi-lo com estado", () => {
    expect(isEditorPreviewReady(editorPreviewReadyMessage)).toBe(true);
    expect(readEditorPreviewState(editorPreviewReadyMessage)).toBeNull();
    expect(isEditorPreviewReady(editorPreviewStateMessage({ document, page: "inicio" }))).toBe(false);
  });

  it("ignora mensagem de outro canal, documento inválido e foco fora do formato", () => {
    expect(readEditorPreviewState({ channel: "outro", type: "state", document, page: "inicio" })).toBeNull();
    expect(readEditorPreviewState(editorPreviewStateMessage({ document, page: "nao-existe" as never }))).toBeNull();
    expect(readEditorPreviewState({ ...editorPreviewStateMessage({ document, page: "inicio" }), document: { basic: {} } })).toBeNull();
    // O foco vira um seletor `[data-sec="..."]` dentro do iframe.
    expect(readEditorPreviewState(editorPreviewStateMessage({ document, page: "inicio", focus: '"] , *' }))).toBeNull();
    expect(readEditorPreviewState("mensagem qualquer")).toBeNull();
  });
});
