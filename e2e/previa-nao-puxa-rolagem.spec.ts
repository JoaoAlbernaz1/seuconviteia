// A PRÉVIA NÃO PODE PUXAR A ROLAGEM DO EDITOR.
//
// O sintoma (João, 24/08): "quando vou subir a tela na programação está
// bugando" — a tela sobe um pouco e volta sozinha, repetidamente.
//
// O mecanismo, medido no navegador:
//  1. rolando, o editor troca a seção em foco (`secaoEmLeitura`) e manda a nova
//     para a prévia;
//  2. dentro do iframe, o destaque chamava `el.scrollIntoView()` para mostrar a
//     seção nova;
//  3. `scrollIntoView` NÃO para no documento do iframe: o browser rola também os
//     ANCESTRAIS para deixar o iframe visível — ou seja, o `<main>` do painel;
//  4. essa rolagem forçada dispara de novo o passo 1. O resultado é a tela
//     subindo e sendo puxada de volta a cada passo da roda.
//
// O teste mede o `scrollTop` do scroller de verdade (`main.dash-scroll`) a cada
// passo de roda para CIMA: subir é monotônico, e qualquer volta para baixo é o
// bug. `pnpm dev` não hidrata direito no Playwright daqui: rode contra o build.
//
//   pnpm build && PORT=3100 AUTH_TRUST_HOST=true pnpm start
//   E2E_DATABASE_READY=1 E2E_BASE_URL=http://127.0.0.1:3100 \
//     npx playwright test e2e/previa-nao-puxa-rolagem.spec.ts
import { expect, test, type Page } from "@playwright/test";
import { Prisma, PrismaClient } from "@prisma/client";
import { createDefaultEventDocument } from "@/lib/event-editor/document";

const databaseReady = process.env.E2E_DATABASE_READY === "1";
const email = process.env.E2E_EMAIL ?? "demo@seuconviteia.com";
const password = process.env.E2E_PASSWORD ?? "demo12345";
const prisma = databaseReady ? new PrismaClient() : null;
const slug = "e2e-rolagem";
/** Volta para baixo maior que isto é o bug (não arredondamento de subpixel). */
const TOLERANCIA = 4;


/**
 * Convite com CONTEÚDO. O bug depende disso: seção vazia não é desenhada na
 * prévia, e o que não está desenhado nunca é alvo do destaque. Convite recém
 * criado, em branco, não reproduz nada.
 */
function documentoCheio() {
  const doc = createDefaultEventDocument({
    basic: { name: "Rolagem E2E" },
    content: {
      opening: { title: "Vem comemorar comigo!", text: "Um dia que eu sonhei a vida inteira." },
      parents: { enabled: true, father: "Pai da E2E", mother: "Mãe da E2E" },
      dressCode: { enabled: true, text: "Esporte fino" },
    },
    schedule: {
      date: "2031-05-20",
      time: "20:30",
      program: {
        enabled: true,
        items: [
          { time: "20h30", title: "Recepção" },
          { time: "21h00", title: "Entrada da debutante" },
          { time: "21h30", title: "Jantar" },
          { time: "23h00", title: "Balada" },
        ],
      },
    },
    location: { enabled: true, venue: "Esplendor Hall", address: "SIA Trecho 1", city: "Brasília", state: "DF" },
  });
  return doc as unknown as Prisma.InputJsonValue;
}

async function login(page: Page) {
  await page.goto("/entrar");
  await page.getByPlaceholder("E-mail").fill(email);
  await page.getByPlaceholder("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel/, { timeout: 20_000 });
}

/** O painel não rola na janela: quem rola é o `<main>`. */
function scrollTop(page: Page) {
  return page.evaluate(() => Math.round(document.querySelector("main.dash-scroll")!.scrollTop));
}

test.describe("a prévia não puxa a rolagem do editor", () => {
  test.skip(!databaseReady, "precisa de E2E_DATABASE_READY=1 e do banco de dev");

  test.afterAll(async () => {
    if (!prisma) return;
    await prisma.event.deleteMany({ where: { subdomain: { startsWith: slug } } });
    await prisma.$disconnect();
  });

  test("subir a tela na Programação não é desfeito pela prévia", async ({ page }) => {
    const dono = await prisma!.professional.findUniqueOrThrow({ where: { email }, select: { id: true } });
    const evento = await prisma!.event.create({
      data: {
        professionalId: dono.id,
        type: "QUINZE_ANOS",
        subdomain: `${slug}-${Date.now()}`,
        title: "Rolagem E2E",
        eventDate: new Date(Date.now() + 30 * 86_400_000),
        expiresAt: new Date(Date.now() + 60 * 86_400_000),
        status: "DRAFT",
        plan: "PREMIUM",
        draftData: documentoCheio(),
        draftVersion: 1,
      },
    });

    await login(page);
    await page.goto(`/painel/criar?id=${evento.id}`);
    await page.getByRole("button", { name: "Continuar" }).click(); // passo 2: Conteúdo
    await page.getByText("Programação da festa").click();
    await page.waitForTimeout(1_500);

    // Desce até o fim e deixa a prévia assentar — é de onde a pessoa sobe.
    await page.mouse.move(400, 400);
    for (let i = 0; i < 15; i += 1) await page.mouse.wheel(0, 200);
    await page.waitForTimeout(1_000);

    // Sobe com a roda, medindo passo a passo.
    const passos: number[] = [await scrollTop(page)];
    for (let i = 0; i < 12; i += 1) {
      await page.mouse.wheel(0, -120);
      await page.waitForTimeout(150);
      passos.push(await scrollTop(page));
    }

    console.log("ROLAGEM:", passos.join(" -> "));
    const voltas = passos
      .map((v, i) => (i === 0 ? 0 : v - passos[i - 1]))
      .filter((delta) => delta > TOLERANCIA);
    expect(voltas, `rolagem: ${passos.join(" -> ")}`).toEqual([]);
  });

  // NÃO existe teste separado para "digitar arrasta a tela". Foi medido: digitar
  // num campo que está fora da vista move a página ~58px, e isso é o NAVEGADOR
  // trazendo o cursor de volta para a tela — comportamento nativo de qualquer
  // <input>, com ou sem prévia (verificado com a rolagem instrumentada: nenhuma
  // chamada nossa aparece). O que era nosso, e sumiu com o conserto, era a
  // segunda metade daquele movimento: antes o mesmo gesto pulava 117px.
});
