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
  // Horario fixo (20:30 local) para a demo nao herdar o relogio atual.
  const eventDate = new Date(Date.now() + 60 * DAY_MS);
  eventDate.setHours(20, 30, 0, 0);
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
    mapsEmbedUrl:
      "https://www.google.com/maps?q=Espa%C3%A7o%20Esplendor%20Park%20Way%20Bras%C3%ADlia&output=embed",
    traje: "Esporte fino",
    programacao: [
      { hora: "20h30", titulo: "Recepção" },
      { hora: "21h30", titulo: "Entrada da debutante" },
      { hora: "22h00", titulo: "Jantar" },
      { hora: "23h30", titulo: "Valsa" },
      { hora: "00h30", titulo: "Pista" },
    ],
    fotoUrl: "/exemplo/aniversariante.jpg",
    fotoDesktopUrl: "/exemplo/retrato.jpg",
    pixNome: "Maria Clara Martins Albernaz",
    pixChave: "maria.clara@email.com",
    // Preset de cor do site (porta a HOME "festa"; "rose" = paleta original).
    tema: "rose",
  };

  const event = await prisma.event.upsert({
    where: { subdomain: "maria-clara" },
    update: {
      title: "Maria Clara",
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
      title: "Maria Clara",
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

  // 5) Itens de presente (Pix) — keyed por id deterministico. A lista da pagina
  //    /presentes vem daqui (gifts do evento); mais itens deixam a pagina "cheia".
  const giftSeeds: {
    id: string;
    title: string;
    description: string;
    priceCents: number;
  }[] = [
    {
      id: "gift-demo-pix",
      title: "Cota da festa",
      description: "Contribua com a celebracao via Pix.",
      priceCents: 15000,
    },
    {
      id: "gift-demo-vale-look",
      title: "Vale look",
      description: "Uma graninha pro look perfeito da noite.",
      priceCents: 12000,
    },
    {
      id: "gift-demo-perfume",
      title: "Perfume favorito",
      description: "Aquele que ela ama de paixao.",
      priceCents: 25000,
    },
    {
      id: "gift-demo-dia-princesa",
      title: "Dia de princesa",
      description: "Spa, cabelo e maquiagem antes da festa.",
      priceCents: 30000,
    },
  ];
  for (const g of giftSeeds) {
    await prisma.giftItem.upsert({
      where: { id: g.id },
      update: {
        eventId: event.id,
        title: g.title,
        description: g.description,
        priceCents: g.priceCents,
        mode: GiftMode.PIX,
      },
      create: {
        id: g.id,
        eventId: event.id,
        title: g.title,
        description: g.description,
        priceCents: g.priceCents,
        mode: GiftMode.PIX,
      },
    });
  }

  // 6) Album de exemplo (carrossel/galeria da home "festa") — keyed por id
  //    deterministico, ordenado. Fotos copiadas em public/exemplo/.
  const fotosDemo = [
    "/exemplo/sel-05305.jpg",
    "/exemplo/sel-05758.jpg",
    "/exemplo/sel-05112.jpg",
    "/exemplo/sel-05446.jpg",
    "/exemplo/sel-05556.jpg",
    "/exemplo/sel-05377.jpg",
    "/exemplo/sel-05100.jpg",
    "/exemplo/sel-05150.jpg",
    "/exemplo/sel-05191.jpg",
    "/exemplo/sel-05214.jpg",
    "/exemplo/sel-05269.jpg",
    "/exemplo/sel-05290.jpg",
  ];
  for (let i = 0; i < fotosDemo.length; i++) {
    const id = `photo-demo-${i + 1}`;
    await prisma.photo.upsert({
      where: { id },
      update: { eventId: event.id, url: fotosDemo[i], order: i },
      create: { id, eventId: event.id, url: fotosDemo[i], order: i },
    });
  }

  // 7) Recados de exemplo (mural /recados) — keyed por id deterministico, para
  //    o mural ja nascer "cheio". Auto-aprovados (approved default true).
  const recadoSeeds: { id: string; name: string; message: string }[] = [
    {
      id: "recado-demo-1",
      name: "Vovó Lourdes",
      message:
        "Minha princesa, que esses 15 anos sejam só o começo de uma vida cheia de luz. Te amo infinito!",
    },
    {
      id: "recado-demo-2",
      name: "Tio Rafael e Tia Bia",
      message:
        "Parabéns, Maria Clara! Mal podemos esperar para dançar a valsa com você. Vai ser inesquecível.",
    },
    {
      id: "recado-demo-3",
      name: "Sofia",
      message:
        "Amiga, 15 anos e já com esse coração gigante. Conta comigo sempre. Te amo demais!",
    },
    {
      id: "recado-demo-4",
      name: "Professora Helena",
      message:
        "Acompanhei seu crescimento de pertinho. Que orgulho da mulher que você está se tornando!",
    },
  ];
  for (const r of recadoSeeds) {
    await prisma.recado.upsert({
      where: { id: r.id },
      update: { eventId: event.id, name: r.name, message: r.message, approved: true },
      create: {
        id: r.id,
        eventId: event.id,
        name: r.name,
        message: r.message,
        approved: true,
      },
    });
  }

  // Resumo.
  const [professionals, templates, events, guests, gifts, recados] = await Promise.all([
    prisma.professional.count(),
    prisma.template.count(),
    prisma.event.count(),
    prisma.guest.count(),
    prisma.giftItem.count(),
    prisma.recado.count(),
  ]);

  console.log("Seed concluido:");
  console.log(`  Professionals: ${professionals}`);
  console.log(`  Templates:     ${templates}`);
  console.log(`  Events:        ${events}`);
  console.log(`  Guests:        ${guests}`);
  console.log(`  GiftItems:     ${gifts}`);
  console.log(`  Recados:       ${recados}`);
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
