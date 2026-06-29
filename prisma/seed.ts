/**
 * Seed idempotente do SeuConvite IA.
 *
 * Roda em Node (via `tsx`), entao `new Date()` / `Date.now()` SAO permitidos aqui
 * (ao contrario de codigo de runtime/workflows). Datas do evento sao calculadas
 * relativas a agora.
 *
 * Idempotencia: usa `upsert` keyed por campo unico quando existe (email do
 * Professional, subdomain do Event) e por id deterministico quando nao ha outro
 * campo unico (Templates, Guests, GiftItem).
 *
 * Uso: `pnpm db:seed` (precisa de DATABASE_URL apontando para um MySQL ja
 * migrado com `pnpm db:push`).
 */
import {
  PrismaClient,
  Plan,
  EventType,
  EventStatus,
  GuestStatus,
  GiftMode,
} from "@prisma/client";

const prisma = new PrismaClient();

const DAY_MS = 24 * 60 * 60 * 1000;

type TemplateSeed = {
  id: string;
  name: string;
  nicho: EventType;
  accent: string;
};

const TEMPLATE_SEEDS: TemplateSeed[] = [
  { id: "tmpl-casamento", name: "Casamento Classico", nicho: EventType.CASAMENTO, accent: "#6D28D9" },
  { id: "tmpl-quinze-anos", name: "15 Anos Encantado", nicho: EventType.QUINZE_ANOS, accent: "#DB2777" },
  { id: "tmpl-sessenta-anos", name: "60 Anos Celebracao", nicho: EventType.SESSENTA_ANOS, accent: "#0891B2" },
  { id: "tmpl-bodas", name: "Bodas Douradas", nicho: EventType.BODAS, accent: "#CA8A04" },
  { id: "tmpl-aniversario", name: "Aniversario Festivo", nicho: EventType.ANIVERSARIO, accent: "#16A34A" },
];

function templateConfig(accent: string) {
  return {
    accent,
    sections: ["capa", "rsvp", "presentes", "album"],
  };
}

async function main() {
  // 1) Professional (tenant) — keyed por email unico.
  const professional = await prisma.professional.upsert({
    where: { email: "demo@seuconviteia.com" },
    update: {
      name: "Estudio Demo Eventos",
      plan: Plan.PREMIUM,
    },
    create: {
      name: "Estudio Demo Eventos",
      email: "demo@seuconviteia.com",
      plan: Plan.PREMIUM,
      brandName: "Estudio Demo Eventos",
    },
  });

  // 2) Templates — um por nicho (EventType). Keyed por id deterministico.
  const templatesByNicho = new Map<EventType, string>();
  for (const seed of TEMPLATE_SEEDS) {
    const tmpl = await prisma.template.upsert({
      where: { id: seed.id },
      update: {
        name: seed.name,
        nicho: seed.nicho,
        config: templateConfig(seed.accent),
      },
      create: {
        id: seed.id,
        name: seed.name,
        nicho: seed.nicho,
        config: templateConfig(seed.accent),
      },
    });
    templatesByNicho.set(seed.nicho, tmpl.id);
  }

  // 3) Evento de exemplo — keyed por subdomain unico.
  const eventDate = new Date(Date.now() + 60 * DAY_MS);
  const expiresAt = new Date(eventDate.getTime() + 30 * DAY_MS);
  const quinzeTemplateId = templatesByNicho.get(EventType.QUINZE_ANOS)!;

  // Customization rica para a demo ficar "cheia" (alimenta `lerConteudo`).
  const mariaClaraCustomization = {
    accent: "#8C4A63",
    mensagem:
      "É com imensa alegria que convidamos você para celebrar os 15 anos da Maria Clara. Será uma noite inesquecível, e a sua presença vai tornar tudo ainda mais especial.",
    local: "Espaço Esplendor",
    endereco: "Park Way, Brasília – DF",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Espa%C3%A7o%20Esplendor%20Park%20Way%20Bras%C3%ADlia",
    traje: "Esporte fino",
    programacao: [
      { hora: "20h30", titulo: "Recepção" },
      { hora: "21h30", titulo: "Entrada da debutante" },
      { hora: "22h00", titulo: "Jantar" },
      { hora: "23h30", titulo: "Valsa" },
      { hora: "00h30", titulo: "Pista" },
    ],
    fotoUrl: "/exemplo/aniversariante.jpg",
    pixNome: "Maria Clara Martins Albernaz",
    pixChave: "maria.clara@email.com",
  };

  const event = await prisma.event.upsert({
    where: { subdomain: "maria-clara" },
    update: {
      title: "15 anos da Maria Clara",
      professionalId: professional.id,
      templateId: quinzeTemplateId,
      type: EventType.QUINZE_ANOS,
      eventDate,
      expiresAt,
      status: EventStatus.PUBLISHED,
      plan: Plan.CLASSICO,
      customization: mariaClaraCustomization,
    },
    create: {
      professionalId: professional.id,
      templateId: quinzeTemplateId,
      type: EventType.QUINZE_ANOS,
      subdomain: "maria-clara",
      title: "15 anos da Maria Clara",
      eventDate,
      expiresAt,
      status: EventStatus.PUBLISHED,
      plan: Plan.CLASSICO,
      customization: mariaClaraCustomization,
    },
  });

  // 4) Convidados de exemplo — keyed por id deterministico.
  await prisma.guest.upsert({
    where: { id: "guest-demo-confirmed" },
    update: {
      eventId: event.id,
      name: "Ana Souza",
      status: GuestStatus.CONFIRMED,
      companions: 1,
      message: "Nao perco por nada!",
    },
    create: {
      id: "guest-demo-confirmed",
      eventId: event.id,
      name: "Ana Souza",
      status: GuestStatus.CONFIRMED,
      companions: 1,
      message: "Nao perco por nada!",
    },
  });

  await prisma.guest.upsert({
    where: { id: "guest-demo-pending" },
    update: {
      eventId: event.id,
      name: "Carlos Lima",
      status: GuestStatus.PENDING,
      companions: 0,
    },
    create: {
      id: "guest-demo-pending",
      eventId: event.id,
      name: "Carlos Lima",
      status: GuestStatus.PENDING,
      companions: 0,
    },
  });

  // 5) Item de presente (Pix) — keyed por id deterministico.
  await prisma.giftItem.upsert({
    where: { id: "gift-demo-pix" },
    update: {
      eventId: event.id,
      title: "Cota da festa",
      description: "Contribua com a celebracao via Pix.",
      priceCents: 15000,
      mode: GiftMode.PIX,
    },
    create: {
      id: "gift-demo-pix",
      eventId: event.id,
      title: "Cota da festa",
      description: "Contribua com a celebracao via Pix.",
      priceCents: 15000,
      mode: GiftMode.PIX,
    },
  });

  // Resumo.
  const [professionals, templates, events, guests, gifts] = await Promise.all([
    prisma.professional.count(),
    prisma.template.count(),
    prisma.event.count(),
    prisma.guest.count(),
    prisma.giftItem.count(),
  ]);

  console.log("Seed concluido:");
  console.log(`  Professionals: ${professionals}`);
  console.log(`  Templates:     ${templates}`);
  console.log(`  Events:        ${events}`);
  console.log(`  Guests:        ${guests}`);
  console.log(`  GiftItems:     ${gifts}`);
  console.log(`  Evento demo:   ${event.subdomain} (${event.title})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
