export const EVENT_EDITOR_SCHEMA_VERSION = 1 as const;

export type EventEditorDocument = {
  schemaVersion: typeof EVENT_EDITOR_SCHEMA_VERSION;
  basic: {
    name: string;
    slug: string;
    eventType: "QUINZE_ANOS";
  };
  template: { id: string; version: number };
  cover: {
    mobileImageUrl: string;
    desktopImage: { enabled: boolean; url: string };
    age: string;
    monogram: { enabled: boolean; imageUrl: string };
  };
  content: {
    opening: { title: string; text: string };
    parents: { enabled: boolean; father: string; mother: string };
    dressCode: { enabled: boolean; text: string };
    cta: { label: string; href: "/confirmar" | "/evento" | "/presentes"; lead: string };
  };
  schedule: {
    date: string;
    time: string;
    program: { enabled: boolean; items: Array<{ time: string; title: string }> };
  };
  location: { enabled: boolean; venue: string; address: string; city: string; state: string; zipCode: string };
  rsvp: {
    enabled: boolean;
    companionsEnabled: boolean;
    requestCompanionNames: boolean;
    maxCompanions: number;
    requestPhone: boolean;
    requestEmail: boolean;
    requestDietaryRestrictions: boolean;
    allowMessage: boolean;
    deadline: string;
    buttonColor: string;
    confirmationMessage: string;
    declineMessage: string;
  };
  gifts: {
    enabled: boolean;
    listModel: "painel" | "vitrine";
    introduction: string;
    items: Array<{
      id: string;
      title: string;
      description: string;
      value: string;
      imageUrl: string;
      pricingMode: "FIXO" | "COTAS";
      quotas?: number;
    }>;
    freeContribution: { enabled: boolean; title: string; suggestedValues: string };
  };
  pix: { enabled: boolean; name: string; key: string };
  gallery: { enabled: boolean; imageUrls: string[] };
  messages: {
    enabled: boolean;
    eyebrow: string;
    title: string;
    invitation: string;
    wallTitle: string;
  };
  footer: { enabled: boolean; text: string };
  appearance: {
    theme: string;
    customColor: string;
    font: string;
    titleSize: "small" | "medium" | "large";
    bold: boolean;
    overlay: boolean;
    animations: boolean;
  };
};

export type EventEditorUIState = {
  step: number;
  focusedSection: string;
  previewDevice: "mobile" | "desktop";
  saveStatus: "saved" | "saving" | "error" | "conflict";
  published: boolean;
};

export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

const DEFAULT_DOCUMENT: EventEditorDocument = {
  schemaVersion: EVENT_EDITOR_SCHEMA_VERSION,
  basic: { name: "", slug: "", eventType: "QUINZE_ANOS" },
  template: { id: "quinze-anos-glamour-rose", version: 1 },
  cover: {
    mobileImageUrl: "",
    desktopImage: { enabled: false, url: "" },
    age: "15",
    monogram: { enabled: true, imageUrl: "" },
  },
  content: {
    opening: { title: "Vem comemorar comigo!", text: "" },
    parents: { enabled: true, father: "", mother: "" },
    dressCode: { enabled: true, text: "Esporte fino" },
    cta: { label: "Confirmar presença", href: "/confirmar", lead: "" },
  },
  schedule: { date: "", time: "", program: { enabled: true, items: [] } },
  location: { enabled: true, venue: "", address: "", city: "", state: "", zipCode: "" },
  rsvp: {
    enabled: true,
    companionsEnabled: true,
    requestCompanionNames: true,
    maxCompanions: 2,
    requestPhone: false,
    requestEmail: false,
    requestDietaryRestrictions: true,
    allowMessage: true,
    deadline: "",
    buttonColor: "#CE578B",
    confirmationMessage: "",
    declineMessage: "",
  },
  gifts: {
    enabled: true,
    listModel: "painel",
    introduction: "",
    items: [],
    freeContribution: { enabled: true, title: "Contribua com o valor que desejar", suggestedValues: "R$ 50 · R$ 100 · R$ 200" },
  },
  pix: { enabled: true, name: "", key: "" },
  gallery: { enabled: true, imageUrls: [] },
  messages: {
    enabled: true,
    eyebrow: "Mural de recados",
    title: "Deixe seu carinho",
    invitation: "Escreva um recado de carinho para {nome}. Ela vai amar ler cada palavra.",
    wallTitle: "Recados de quem ama",
  },
  footer: { enabled: true, text: "Feito com carinho." },
  appearance: { theme: "rose", customColor: "#CE578B", font: "classica", titleSize: "medium", bold: false, overlay: false, animations: false },
};

function mergeDefaults<T>(base: T, patch: DeepPartial<T> | undefined): T {
  if (patch === undefined) return structuredClone(base);
  if (Array.isArray(base) || Array.isArray(patch)) return structuredClone(patch) as T;
  if (base === null || typeof base !== "object" || typeof patch !== "object" || patch === null) {
    return patch as T;
  }
  const result = structuredClone(base) as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      result[key] = mergeDefaults((base as Record<string, unknown>)[key], value);
    }
  }
  return result as T;
}

export function createDefaultEventDocument(overrides?: DeepPartial<EventEditorDocument>): EventEditorDocument {
  return mergeDefaults<EventEditorDocument>(DEFAULT_DOCUMENT, overrides);
}

export function withFreshGiftIds(document: EventEditorDocument, createId = () => crypto.randomUUID()): EventEditorDocument {
  return {
    ...document,
    gifts: {
      ...document.gifts,
      items: document.gifts.items.map((gift) => ({ ...gift, id: createId() })),
    },
  };
}
