import { z } from "zod";
import { EventEditorDocumentSchema } from "./schema";

/**
 * Contract between the editor and its preview iframe.
 *
 * The preview renders in its own document so the invitation media queries
 * measure a real phone (390px) or desktop (1024px) viewport instead of the
 * browser window. The canonical document travels by postMessage on every
 * keystroke, so the frame is never reloaded and the preview stays live.
 */
export const EDITOR_PREVIEW_CHANNEL = "sc-editor-preview";

export const editorPreviewPageSchema = z.enum([
  "inicio",
  "evento",
  "confirmar",
  "presentes",
  "galeria",
  "recados",
  "obrigada",
]);

// The section name is used in a `[data-sec="..."]` selector inside the frame, so
// it is restricted to the shape the invitation sections actually use.
const focusSchema = z.string().regex(/^[a-z-]{1,40}$/);

const readyMessageSchema = z.object({
  channel: z.literal(EDITOR_PREVIEW_CHANNEL),
  type: z.literal("ready"),
});

const stateMessageSchema = z.object({
  channel: z.literal(EDITOR_PREVIEW_CHANNEL),
  type: z.literal("state"),
  document: EventEditorDocumentSchema,
  page: editorPreviewPageSchema,
  focus: focusSchema.optional(),
});

export type EditorPreviewPage = z.infer<typeof editorPreviewPageSchema>;
export type EditorPreviewState = z.infer<typeof stateMessageSchema>;
export type EditorPreviewReady = z.infer<typeof readyMessageSchema>;

/** The frame announces itself once mounted; the editor answers with the state. */
export const editorPreviewReadyMessage: EditorPreviewReady = {
  channel: EDITOR_PREVIEW_CHANNEL,
  type: "ready",
};

export function editorPreviewStateMessage(state: Omit<EditorPreviewState, "channel" | "type">): EditorPreviewState {
  return { channel: EDITOR_PREVIEW_CHANNEL, type: "state", ...state };
}

export function isEditorPreviewReady(data: unknown): boolean {
  return readyMessageSchema.safeParse(data).success;
}

/**
 * Reads a message posted into the preview frame. Anything that is not a valid
 * state message returns `null` and the frame keeps the last valid render — a
 * document the schema rejects would fail to save anyway, and freezing is better
 * than blanking the preview mid-typing.
 */
export function readEditorPreviewState(data: unknown): EditorPreviewState | null {
  const parsed = stateMessageSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
