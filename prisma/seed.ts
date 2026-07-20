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
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Senha do profissional demo (pra logar no painel e explorar).
// Login: demo@seuconviteia.com / demo12345
const DEMO_PASSWORD_HASH = bcrypt.hashSync("demo12345", 10);

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
      passwordHash: DEMO_PASSWORD_HASH,
    },
    create: {
      name: "Estudio Demo Eventos",
      plan: Plan.PREMIUM,
      email: "demo@seuconviteia.com",
      passwordHash: DEMO_PASSWORD_HASH,
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
  // Data REAL da festa da Maria Clara (Brasília -03:00) — o countdown bate com o
  // site real (base de fidelidade do template glamour-rose).
  const eventDate = new Date("2026-08-29T20:30:00-03:00");
  const expiresAt = new Date(eventDate.getTime() + 30 * DAY_MS);
  const quinzeTemplateId = templatesByNicho.get(EventType.QUINZE_ANOS)!;

  // Customization = conteudo REAL do site da Maria Clara (fonte de fidelidade do
  // template quinze-anos/glamour-rose). Fotos em public/demo/maria-clara/.
  // `template` explicito p/ NAO cair no template padrao (casamento).
  const mariaClaraCustomization = {
    template: "quinze-anos-glamour-rose",
    tema: "rose",
    fontes: "classica",
    accent: "#CE578B",
    logoUrl: "/demo/maria-clara/mc.png",
    mensagem:
      "Um sonho que começa a se tornar realidade. Vai ser uma alegria imensa celebrar essa noite tão especial ao seu lado.",
    local: "Espaço Esplendor",
    endereco: "SMPW Quadra 4, Conjunto 3 — Park Way, Brasília – DF",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Esplendor+Hall+SMPW+Quadra+4+Conjunto+3+Park+Way+Bras%C3%ADlia+DF",
    mapsEmbedUrl:
      "https://www.google.com/maps?q=Esplendor+Hall+SMPW+Quadra+4+Conjunto+3+Park+Way+Bras%C3%ADlia+DF&output=embed",
    traje: "Esporte fino",
    programacao: [
      { hora: "20h30", titulo: "Recepção" },
      { hora: "21h", titulo: "Abertura do buffet" },
      { hora: "22h", titulo: "Valsa e parabéns" },
      { hora: "23h", titulo: "Abertura da pista" },
      { hora: "02h", titulo: "Fim" },
    ],
    fotoUrl: "/demo/maria-clara/capa-mobile.jpg",
    fotoDesktopUrl: "/demo/maria-clara/capa-desktop.jpg",
    presentesFotoUrl: "/demo/maria-clara/g8.jpg",
    presentesTexto:
      "Sua presença já é o maior presente. Se quiser presentear, deixamos algumas ideias — e a chave Pix logo abaixo.",
    pixNome: "Maria Clara Martins Albernaz",
    pixChave: "",
    pixQrUrl: "/demo/maria-clara/pix-qr.png",
  };

  const event = await prisma.event.upsert({
    where: { subdomain: "maria-clara" },
    // Demo da MARCA D'AGUA: previa (purchased=false) com os 3 upsells de conteudo
    // ligados -> abre o site completo + marca d'agua. No painel, "Publicar" tira a
    // marca; os upsells alternam as abas/secoes.
    update: {
      title: "Maria Clara",
      professionalId: professional.id,
      templateId: quinzeTemplateId,
      type: EventType.QUINZE_ANOS,
      eventDate,
      expiresAt,
      status: EventStatus.PUBLISHED,
      plan: Plan.PREMIUM,
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
      plan: Plan.PREMIUM,
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
  // Lista REAL da Maria Clara: ideias de presente (itens com "tamanho"), sem
  // preco (o presente vem via Pix acima). Modo ITEM, priceCents 0.
  const giftSeeds: { id: string; title: string; description: string }[] = [
    { id: "gift-mc-roupas", title: "Roupas", description: "Tamanho P" },
    { id: "gift-mc-calcas", title: "Calças e shorts", description: "Tamanho M · 38" },
    { id: "gift-mc-calcados", title: "Calçados", description: "Nº 36" },
    { id: "gift-mc-joias", title: "Joias", description: "Prata · anel 14" },
    { id: "gift-mc-perfumes", title: "Perfumes", description: "" },
    { id: "gift-mc-maquiagem", title: "Maquiagem", description: "" },
  ];
  // deleteMany + createMany: remove itens de placeholder antigos (gift-demo-*) e
  // recria a lista real — idempotente e sem orfaos.
  await prisma.giftItem.deleteMany({ where: { eventId: event.id } });
  await prisma.giftItem.createMany({
    data: giftSeeds.map((g) => ({
      id: g.id,
      eventId: event.id,
      title: g.title,
      description: g.description,
      priceCents: 0,
      mode: GiftMode.ITEM,
    })),
  });

  // 6) Album de exemplo (carrossel/galeria da home "festa") — keyed por id
  //    deterministico, ordenado. Fotos copiadas em public/exemplo/.
  const fotosDemo = [
    "/demo/maria-clara/g1.jpg",
    "/demo/maria-clara/g2.jpg",
    "/demo/maria-clara/g3.jpg",
    "/demo/maria-clara/g4.jpg",
    "/demo/maria-clara/g5.jpg",
    "/demo/maria-clara/g6.jpg",
    "/demo/maria-clara/g7.jpg",
    "/demo/maria-clara/g8.jpg",
    "/demo/maria-clara/g9.jpg",
    "/demo/maria-clara/g10.jpg",
  ];
  await prisma.photo.deleteMany({ where: { eventId: event.id } });
  await prisma.photo.createMany({
    data: fotosDemo.map((url, i) => ({
      id: `photo-demo-${i + 1}`,
      eventId: event.id,
      url,
      order: i,
    })),
  });

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
