import { createDefaultEventDocument, type EventEditorDocument } from "./document";
import { ESCALA_CAPA, tamanhoDaChave } from "../fontes";

type LegacyGift = {
  id: string;
  title: string;
  description?: string | null;
  priceCents?: number | null;
  pricingMode?: string | null;
  quotaCount?: number | null;
  imageUrl?: string | null;
};

export type LegacyEditorEvent = {
  title: string;
  type: string;
  subdomain: string;
  eventDate: Date;
  customization?: unknown;
  gifts?: LegacyGift[];
  photos?: Array<{ url: string }>;
};

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function string(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function boolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function number(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function enabled(resources: Record<string, unknown>, key: string): boolean {
  return resources[key] !== false;
}

function dateParts(date: Date): { date: string; time: string } {
  const brasilia = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return { date: brasilia.toISOString().slice(0, 10), time: brasilia.toISOString().slice(11, 16) };
}

function centsLabel(cents: number | null | undefined): string {
  return cents && cents > 0 ? (cents / 100).toFixed(2).replace(".", ",") : "";
}

/** `customization.tamanhoTexto` -> a chave que o documento usa. */
function chaveDoTamanho(valor: unknown): EventEditorDocument["appearance"]["titleSize"] {
  const t = tamanhoDaChave(typeof valor === "string" ? valor : undefined);
  return t === "pequeno" ? "small" : t === "grande" ? "large" : "medium";
}

export function legacyEventToDocument(event: LegacyEditorEvent): EventEditorDocument {
  const customization = object(event.customization);
  const resources = object(customization.recursos);
  const parents = object(customization.pais);
  const rsvp = object(customization.rsvpConfig);
  const sections = object(customization.secoes);
  const messages = object(sections.recados);
  const { date, time } = dateParts(event.eventDate);
  const giftEnabled = enabled(resources, "presentes");

  return createDefaultEventDocument({
    basic: { name: event.title, slug: event.subdomain, eventType: "QUINZE_ANOS" },
    template: {
      id: string(customization.template, "quinze-anos-glamour-rose"),
      version: number(customization.templateVersion, 1),
    },
    cover: {
      mobileImageUrl: string(customization.fotoUrl),
      desktopImage: { enabled: Boolean(string(customization.fotoDesktopUrl)), url: string(customization.fotoDesktopUrl) },
      age: String(number(customization.idade, 15)),
      monogram: { enabled: boolean(customization.monograma, true), imageUrl: string(customization.logoUrl) },
    },
    content: {
      opening: { title: string(object(sections.abertura).titulo, "Vem comemorar comigo!"), text: string(customization.mensagem) },
      parents: {
        enabled: Boolean(string(parents.pai) || string(parents.mae)),
        father: string(parents.pai),
        mother: string(parents.mae),
      },
      dressCode: { enabled: Boolean(string(customization.traje)), text: string(customization.traje) },
      cta: {
        label: string(customization.ctaLabel, "Confirmar presença"),
        href: (["/confirmar", "/evento", "/presentes"].includes(string(customization.ctaHref))
          ? customization.ctaHref
          : "/confirmar") as EventEditorDocument["content"]["cta"]["href"],
        lead: string(customization.ctaLead),
      },
    },
    schedule: {
      date,
      time,
      program: {
        enabled: enabled(resources, "programacao"),
        items: Array.isArray(customization.programacao)
          ? customization.programacao.map((item) => ({ time: string(object(item).hora), title: string(object(item).titulo) }))
          : [],
      },
    },
    location: { enabled: true, venue: string(customization.local), address: string(customization.endereco), city: "", state: "", zipCode: "" },
    rsvp: {
      enabled: enabled(resources, "rsvp"),
      companionsEnabled: boolean(rsvp.permitirAcompanhantes, false),
      requestCompanionNames: boolean(rsvp.pedirNomeAcompanhantes, false),
      maxCompanions: number(rsvp.maxAcompanhantes, 0),
      requestPhone: boolean(rsvp.pedirTelefone, false),
      requestEmail: boolean(rsvp.pedirEmail, false),
      requestDietaryRestrictions: boolean(rsvp.pedirRestricao, false),
      allowMessage: boolean(rsvp.permitirRecado, false),
      deadline: string(rsvp.dataLimite),
      buttonColor: /^#[0-9a-fA-F]{6}$/.test(string(rsvp.corBotao)) ? string(rsvp.corBotao) : "#CE578B",
      confirmationMessage: string(rsvp.msgConfirma),
      declineMessage: string(rsvp.msgRecusa),
    },
    gifts: {
      enabled: giftEnabled,
      listModel: customization.listaModelo === "vitrine" ? "vitrine" : "painel",
      introduction: string(customization.presentesTexto),
      items: (event.gifts ?? []).map((gift) => ({
        id: gift.id,
        title: gift.title,
        description: gift.description ?? "",
        value: centsLabel(gift.priceCents),
        imageUrl: gift.imageUrl ?? "",
        pricingMode: gift.pricingMode === "COTAS" ? "COTAS" : "FIXO",
        quotas: gift.quotaCount ?? undefined,
      })),
      freeContribution: { enabled: false, title: "Contribua com o valor que desejar", suggestedValues: "R$ 50 · R$ 100 · R$ 200" },
    },
    pix: { enabled: giftEnabled, name: string(customization.pixNome), key: string(customization.pixChave) },
    gallery: { enabled: enabled(resources, "galeria"), imageUrls: (event.photos ?? []).map((photo) => photo.url) },
    messages: {
      enabled: enabled(resources, "recados"),
      eyebrow: string(messages.eyebrow, "Mural de recados"),
      title: string(messages.titulo, "Deixe seu carinho"),
      invitation: string(messages.convite, "Escreva um recado de carinho para {nome}. Ela vai amar ler cada palavra."),
      wallTitle: string(messages.muralTitulo, "Recados de quem ama"),
    },
    footer: { enabled: true, text: string(customization.rodapeMsg, "Feito com carinho.") },
    appearance: {
      theme: string(customization.tema, "rose"),
      customColor: /^#[0-9a-fA-F]{6}$/.test(string(customization.temaCor)) ? string(customization.temaCor) : "#CE578B",
      font: string(customization.fontes, "classica"),
      titleSize: chaveDoTamanho(customization.tamanhoTexto),
      bold: boolean(customization.negrito, false),
      overlay: boolean(customization.capaOverlay, false),
      animations: boolean(customization.animacoes, false),
    },
  });
}

export function documentToLegacyCustomization(document: EventEditorDocument): Record<string, unknown> {
  const resources: Record<string, false> = {};
  if (!document.rsvp.enabled) resources.rsvp = false;
  if (!document.gifts.enabled) resources.presentes = false;
  if (!document.gallery.enabled) resources.galeria = false;
  if (!document.messages.enabled) resources.recados = false;
  if (!document.schedule.program.enabled) resources.programacao = false;

  return {
    template: document.template.id,
    templateVersion: document.template.version,
    tema: document.appearance.theme,
    temaCor: document.appearance.customColor,
    fontes: document.appearance.font,
    // Tamanho dos textos: `tamanhoTexto` multiplica os fatores da fonte no site
    // inteiro e `capaEscala` escala o lockup da capa (nome + idade juntos).
    tamanhoTexto: tamanhoDaChave(document.appearance.titleSize),
    capaEscala: ESCALA_CAPA[tamanhoDaChave(document.appearance.titleSize)],
    negrito: document.appearance.bold,
    capaOverlay: document.appearance.overlay,
    animacoes: document.appearance.animations,
    fotoUrl: document.cover.mobileImageUrl,
    // Seções com liga/desliga saem VAZIAS quando desligadas. O texto continua
    // guardado no documento (o contrato de toggle garante isso), mas não pode
    // vazar para o convite — copiar sem olhar o `enabled` era o que fazia o
    // botão não ter efeito nenhum na prévia. `texto()` lê vazio como ausente.
    fotoDesktopUrl: document.cover.desktopImage.enabled ? document.cover.desktopImage.url : "",
    idade: Number(document.cover.age) || 15,
    monograma: document.cover.monogram.enabled,
    logoUrl: document.cover.monogram.imageUrl,
    mensagem: document.content.opening.text,
    secoes: {
      abertura: { titulo: document.content.opening.title },
      recados: {
        eyebrow: document.messages.eyebrow,
        titulo: document.messages.title,
        convite: document.messages.invitation,
        muralTitulo: document.messages.wallTitle,
      },
    },
    pais: document.content.parents.enabled
      ? { pai: document.content.parents.father, mae: document.content.parents.mother }
      : { pai: "", mae: "" },
    traje: document.content.dressCode.enabled ? document.content.dressCode.text : "",
    ctaLabel: document.content.cta.label,
    ctaHref: document.content.cta.href,
    ctaLead: document.content.cta.lead,
    local: document.location.venue,
    endereco: [document.location.address, document.location.city, document.location.state].filter(Boolean).join(", "),
    programacao: document.schedule.program.items.map((item) => ({ hora: item.time, titulo: item.title })),
    rsvpConfig: {
      permitirAcompanhantes: document.rsvp.companionsEnabled,
      pedirNomeAcompanhantes: document.rsvp.requestCompanionNames,
      maxAcompanhantes: document.rsvp.maxCompanions,
      pedirTelefone: document.rsvp.requestPhone,
      pedirEmail: document.rsvp.requestEmail,
      pedirRestricao: document.rsvp.requestDietaryRestrictions,
      permitirRecado: document.rsvp.allowMessage,
      corBotao: document.rsvp.buttonColor,
      dataLimite: document.rsvp.deadline,
      msgConfirma: document.rsvp.confirmationMessage,
      msgRecusa: document.rsvp.declineMessage,
    },
    presentesTexto: document.gifts.introduction,
    listaModelo: document.gifts.listModel,
    pixNome: document.pix.name,
    pixChave: document.pix.key,
    rodapeMsg: document.footer.text,
    recursos: Object.keys(resources).length ? resources : undefined,
  };
}
