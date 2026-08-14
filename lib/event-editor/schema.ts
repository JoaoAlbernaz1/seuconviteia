import { z } from "zod";
import { EVENT_EDITOR_SCHEMA_VERSION } from "./document";

const optionalSection = <T extends z.ZodRawShape>(shape: T) => z.object({ enabled: z.boolean(), ...shape });

export const EventEditorDocumentSchema = z.object({
  schemaVersion: z.literal(EVENT_EDITOR_SCHEMA_VERSION),
  basic: z.object({ name: z.string().max(120), slug: z.string().max(80), eventType: z.literal("QUINZE_ANOS") }),
  template: z.object({ id: z.string().max(80), version: z.number().int().positive() }),
  cover: z.object({
    mobileImageUrl: z.string().max(2000),
    desktopImage: optionalSection({ url: z.string().max(2000) }),
    age: z.string().max(3),
    monogram: optionalSection({ imageUrl: z.string().max(2000) }),
  }),
  content: z.object({
    opening: z.object({ title: z.string().max(140), text: z.string().max(2200) }),
    parents: optionalSection({ father: z.string().max(140), mother: z.string().max(140) }),
    dressCode: optionalSection({ text: z.string().max(140) }),
    cta: z.object({ label: z.string().max(120), href: z.enum(["/confirmar", "/evento", "/presentes"]), lead: z.string().max(200) }),
  }),
  schedule: z.object({
    date: z.string().max(10),
    time: z.string().max(5),
    program: optionalSection({ items: z.array(z.object({ time: z.string().max(20), title: z.string().max(140) })).max(30) }),
  }),
  location: optionalSection({ venue: z.string().max(220), address: z.string().max(320), city: z.string().max(140), state: z.string().max(2), zipCode: z.string().max(9) }),
  rsvp: optionalSection({
    companionsEnabled: z.boolean(), requestCompanionNames: z.boolean(), maxCompanions: z.number().int().min(0).max(20),
    requestPhone: z.boolean(), requestEmail: z.boolean(), requestDietaryRestrictions: z.boolean(), allowMessage: z.boolean(),
    deadline: z.string().max(20), buttonColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), confirmationMessage: z.string().max(400), declineMessage: z.string().max(400),
  }),
  gifts: optionalSection({
    listModel: z.enum(["painel", "vitrine"]), introduction: z.string().max(600),
    items: z.array(z.object({ id: z.string(), title: z.string().max(140), description: z.string().max(240), value: z.string().max(20), imageUrl: z.string().max(2000), pricingMode: z.enum(["FIXO", "COTAS"]), quotas: z.number().int().optional() })).max(60),
    freeContribution: optionalSection({ title: z.string().max(140), suggestedValues: z.string().max(140) }),
  }),
  pix: optionalSection({ name: z.string().max(140), key: z.string().max(200) }),
  gallery: optionalSection({ imageUrls: z.array(z.string().max(2000)).max(40) }),
  messages: optionalSection({ eyebrow: z.string().max(60), title: z.string().max(80), invitation: z.string().max(220), wallTitle: z.string().max(80) }),
  footer: optionalSection({ text: z.string().max(240) }),
  appearance: z.object({ theme: z.string().max(40), customColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), font: z.string().max(40), titleSize: z.enum(["small", "medium", "large"]), bold: z.boolean(), overlay: z.boolean(), animations: z.boolean() }),
});
