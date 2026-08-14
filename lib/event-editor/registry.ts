import type { EventEditorDocument } from "./document";

export const SECTION_REGISTRY = {
  cover: { previewId: "capa", step: 1 },
  parents: { previewId: "assinatura", step: 2, enabledPath: "content.parents.enabled" },
  schedule: { previewId: "quando", step: 2 },
  location: { previewId: "onde", step: 2, enabledPath: "location.enabled" },
  dressCode: { previewId: "traje", step: 2, enabledPath: "content.dressCode.enabled" },
  program: { previewId: "programacao", step: 2, enabledPath: "schedule.program.enabled" },
  rsvp: { previewId: "rsvp", step: 3, enabledPath: "rsvp.enabled" },
  gifts: { previewId: "presentes", step: 4, enabledPath: "gifts.enabled" },
  pix: { previewId: "pix", step: 4, enabledPath: "pix.enabled" },
  gallery: { previewId: "galeria", step: 5, enabledPath: "gallery.enabled" },
  messages: { previewId: "recados", step: 5, enabledPath: "messages.enabled" },
  footer: { previewId: "rodape", step: 2, enabledPath: "footer.enabled" },
} as const;

type Probe = { path: string; value: unknown; read: (document: EventEditorDocument) => unknown };
type ToggleDefinition = {
  id: string;
  enabledPath: string;
  configurationProbe: Probe;
  readEnabled: (document: EventEditorDocument) => boolean;
};

function pathReader(path: string) {
  return (document: EventEditorDocument): unknown =>
    path.split(".").reduce<unknown>((value, key) =>
      value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, document);
}

function toggle(id: string, enabledPath: string, probePath: string, probeValue: unknown): ToggleDefinition {
  const readEnabled = pathReader(enabledPath);
  return {
    id,
    enabledPath,
    configurationProbe: { path: probePath, value: probeValue, read: pathReader(probePath) },
    readEnabled: (document) => Boolean(readEnabled(document)),
  };
}

export const TOGGLE_REGISTRY = [
  toggle("cover.desktopImage", "cover.desktopImage.enabled", "cover.desktopImage.url", "/desktop.jpg"),
  toggle("cover.monogram", "cover.monogram.enabled", "cover.monogram.imageUrl", "/monogram.png"),
  toggle("content.parents", "content.parents.enabled", "content.parents.father", "Marcos"),
  toggle("content.dressCode", "content.dressCode.enabled", "content.dressCode.text", "Passeio completo"),
  toggle("schedule.program", "schedule.program.enabled", "schedule.program.items", [{ time: "20:00", title: "Recepção" }]),
  toggle("rsvp", "rsvp.enabled", "rsvp.deadline", "2026-11-10"),
  toggle("rsvp.companions", "rsvp.companionsEnabled", "rsvp.maxCompanions", 4),
  toggle("gifts", "gifts.enabled", "gifts.introduction", "Escolha um presente"),
  toggle("gifts.freeContribution", "gifts.freeContribution.enabled", "gifts.freeContribution.title", "Ajude com a festa"),
  toggle("pix", "pix.enabled", "pix.key", "contato@example.com"),
  toggle("gallery", "gallery.enabled", "gallery.imageUrls", ["/gallery.jpg"]),
  toggle("messages", "messages.enabled", "messages.title", "Deixe seu carinho"),
  toggle("footer", "footer.enabled", "footer.text", "Com carinho, Ana"),
  toggle("appearance.bold", "appearance.bold", "appearance.font", "romantica"),
  toggle("appearance.overlay", "appearance.overlay", "appearance.customColor", "#123456"),
  toggle("appearance.animations", "appearance.animations", "appearance.theme", "azul"),
] as const satisfies readonly ToggleDefinition[];

export type EditorToggleId = (typeof TOGGLE_REGISTRY)[number]["id"];
