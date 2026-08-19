import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const databaseReady = process.env.E2E_DATABASE_READY === "1";
const emailA = process.env.E2E_EMAIL ?? "demo@seuconviteia.com";
const passwordA = process.env.E2E_PASSWORD ?? "demo12345";
const emailB = "editor-e2e-b@seuconviteia.test";
const passwordB = "editor-e2e-password";
const prisma = databaseReady ? new PrismaClient() : null;
// Prefixo dos convites criados direto no banco por este arquivo (limpeza no fim).
const slugFechado = "e2e-fechado";

// A porta vem da baseURL: o site do tenant mora num subdominio, entao nao da para
// usar o `page.goto` relativo — e fixar 3000 quebra quando o app sobe noutra porta.
function urlDoTenant(slug: string, baseURL: string | undefined) {
  const base = new URL(baseURL ?? "http://127.0.0.1:3000");
  return `${base.protocol}//${slug}.localhost:${base.port || (base.protocol === "https:" ? "443" : "80")}`;
}

async function login(page: Page, email = emailA, password = passwordA) {
  await page.goto("/entrar");
  await page.getByPlaceholder("E-mail").fill(email);
  await page.getByPlaceholder("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel/, { timeout: 20_000 });
}

async function loginContext(context: BrowserContext, email = emailA, password = passwordA) {
  const page = await context.newPage();
  await login(page, email, password);
  return page;
}

async function cycle(page: Page, switchName: string) {
  const toggle = page.getByRole("switch", { name: switchName });
  const initial = await toggle.getAttribute("aria-checked");
  for (let count = 0; count < 3; count += 1) {
    // A prévia sticky pode sobrepor o painel durante o scroll automático do
    // Playwright; o alvo já foi resolvido e está habilitado, então disparamos o
    // controle diretamente para testar a transição de estado.
    await toggle.click({ force: true });
    await toggle.click({ force: true });
  }
  await expect(toggle).toHaveAttribute("aria-checked", initial ?? "true");
}

// Convite NOVO (sem `id` do dono) abre na tela de escolha do modelo — hoje um so.
// O editor so aparece depois do "Usar este modelo" (tela de 17/08).
async function escolherModelo(page: Page) {
  await page.getByRole("button", { name: "Usar este modelo" }).click();
}

function nameInput(page: Page) {
  return page.getByText("Nome da debutante", { exact: true }).locator("..").locator("input");
}

// A previa mora num iframe (`/previa-convite`) dentro da moldura do aparelho: e o
// documento proprio dele que da ao convite um viewport real de 390px / 1024px.
function previa(page: Page) {
  return page.frameLocator('iframe[title="Prévia do convite"]');
}

function continueStep(page: Page) {
  return page.getByRole("button", { name: "Continuar", exact: true }).last();
}

test.describe("fundação do editor", () => {
  test.skip(!databaseReady, "Requer Postgres local com as migrations aplicadas (E2E_DATABASE_READY=1)." );

  test.beforeAll(async () => {
    await prisma!.professional.deleteMany({ where: { email: emailB } });
    await prisma!.professional.create({
      data: { name: "Usuário B E2E", email: emailB, passwordHash: await bcrypt.hash(passwordB, 10), plan: "PREMIUM" },
    });
  });

  test.afterAll(async () => {
    await prisma?.event.deleteMany({ where: { subdomain: { startsWith: slugFechado } } });
    await prisma?.$disconnect();
  });

  test("editar, autosave em rajada, conflito, autorização e publicação isolada", async ({ browser, page, baseURL }) => {
    let saveRequests = 0;
    page.on("request", (request) => {
      if (request.method() === "POST" && request.url().includes("/painel/criar")) saveRequests += 1;
    });

    await login(page);
    await page.goto("/painel/criar");
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage)) if (key.startsWith("sc-editor-")) localStorage.removeItem(key);
    });
    await page.reload();
    // `networkidle` nunca ocorre no `next dev` por causa do websocket de HMR.
    await page.waitForTimeout(500);
    await escolherModelo(page);

    const prefix = `E2E-${Date.now()}`;
    const input = nameInput(page);
    await expect(input).toBeEditable();
    await input.fill(`${prefix}-inicial`);
    await expect(previa(page).locator('[data-invitation-renderer="preview"]')).toContainText(`${prefix}-inicial`);

    // Sem iframe as media queries do convite mediam a JANELA (1440px) e o modo
    // "Celular" mostrava o menu de desktop espremido. Cada aparelho tem que cair
    // no seu layout: hamburguer no celular, os seis links no computador.
    await expect(previa(page).getByRole("button", { name: "Abrir menu" })).toBeVisible();
    await expect(previa(page).locator("header nav ul")).toBeHidden();
    const aparelho = page.getByRole("group", { name: "Dispositivo da prévia" });
    await aparelho.getByRole("button", { name: "Computador" }).click();
    await expect(previa(page).locator("header nav ul")).toBeVisible();
    await expect(previa(page).getByRole("button", { name: "Abrir menu" })).toBeHidden();
    await aparelho.getByRole("button", { name: "Celular" }).click();
    await expect(previa(page).getByRole("button", { name: "Abrir menu" })).toBeVisible();
    await expect(previa(page).locator('[data-invitation-renderer="preview"]')).toContainText(`${prefix}-inicial`);

    let createdEventId: string | undefined;
    await expect.poll(async () => {
      const saved = await prisma!.event.findFirst({ where: { title: `${prefix}-inicial` }, select: { id: true } });
      createdEventId = saved?.id;
      return createdEventId;
    }, { timeout: 15_000 }).toBeTruthy();
    await expect.poll(() => page.evaluate(() => Object.keys(localStorage).some((key) => key.startsWith("sc-editor-active:")))).toBe(true);

    // A → AB → ABC → ABCD em menos de 200 ms entre mudanças, cinco vezes.
    for (let round = 1; round <= 5; round += 1) {
      const before = saveRequests;
      for (const suffix of ["A", "AB", "ABC", "ABCD"]) {
        await input.fill(`${prefix}-${round}-${suffix}`);
        await page.waitForTimeout(50);
      }
      const expected = `${prefix}-${round}-ABCD`;
      await expect.poll(async () => {
        const saved = await prisma!.event.findUnique({ where: { id: createdEventId! }, select: { title: true } });
        return saved?.title;
      }, { timeout: 15_000 }).toBe(expected);
      expect(saveRequests - before).toBeGreaterThanOrEqual(1);
      // Um debounce + no máximo duas drenagens quando a edição cruza um save em voo.
      // O limite finito detecta o antigo loop de autosave sem assumir timing ideal.
      expect(saveRequests - before).toBeLessThanOrEqual(3);
    }
    const publishedName = `${prefix}-5-ABCD`;

    await continueStep(page).click();
    await page.locator('[data-foco="assinatura"]').filter({ hasText: "Pais e família" }).first().click();
    await cycle(page, "Mostrar pais");
    await page.locator('[data-foco="quando"]').filter({ hasText: "Data e local" }).first().click();
    await page.getByText("Data da festa", { exact: true }).locator("..").locator("input").fill("2026-12-20");
    await page.getByText("Horário de início", { exact: true }).locator("..").locator("input").fill("20:00");
    await page.getByText("Nome do local", { exact: true }).locator("..").locator("input").fill("Salão E2E");
    await page.getByText("Cidade", { exact: true }).locator("..").locator("input").fill("Brasília");
    await page.getByText("UF", { exact: true }).locator("..").locator("input").fill("DF");

    await continueStep(page).click();
    await cycle(page, "Ativar RSVP");
    await continueStep(page).click();
    await cycle(page, "Mostrar Pix");
    await continueStep(page).click();
    await cycle(page, "Ativar galeria");

    await page.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(page.getByText("Alterações salvas")).toBeVisible();
    const event = await prisma!.event.findUniqueOrThrow({ where: { id: createdEventId! }, select: { id: true } });

    await page.reload();
    await page.getByText("Capa", { exact: true }).click();
    await expect(nameInput(page)).toHaveValue(publishedName);
    await expect(previa(page).locator('[data-invitation-renderer="preview"]')).toContainText(publishedName);

    // Duas sessões autenticadas abrem exatamente a mesma versão do banco.
    const secondContext = await browser.newContext();
    const second = await loginContext(secondContext);
    await page.goto(`/painel/criar?id=${event.id}`);
    await second.goto(`/painel/criar?id=${event.id}`);
    await nameInput(page).fill(`${publishedName}-A`);
    await nameInput(second).fill(`${publishedName}-B`);
    await page.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(page.getByText("Alterações salvas")).toBeVisible();
    await second.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(second.getByText(/outra aba/i)).toBeVisible();
    await expect.poll(async () => (await prisma!.event.findUnique({ where: { id: event.id }, select: { title: true } }))?.title).toBe(`${publishedName}-A`);
    await secondContext.close();

    // Usuário B não carrega dados de A e a action rejeita o id de A.
    const unauthorizedContext = await browser.newContext();
    const unauthorized = await loginContext(unauthorizedContext, emailB, passwordB);
    await unauthorized.goto(`/painel/criar?id=${event.id}`);
    await escolherModelo(unauthorized);
    await expect(nameInput(unauthorized)).not.toHaveValue(`${publishedName}-A`);
    await nameInput(unauthorized).fill("Documento do usuário B");
    await unauthorized.waitForFunction(() => Object.keys(localStorage).some((key) => key.startsWith("sc-editor-rascunho:new:")));
    const recovery = await unauthorized.evaluate(() => {
      const key = Object.keys(localStorage).find((candidate) => candidate.startsWith("sc-editor-rascunho:new:"));
      return key ? { key, value: localStorage.getItem(key) } : null;
    });
    expect(recovery?.value).toBeTruthy();
    await unauthorized.evaluate(({ recovery, eventId }) => {
      const parsed = JSON.parse(recovery!.value!);
      parsed.eventId = eventId;
      localStorage.setItem(`sc-editor-rascunho:${eventId}`, JSON.stringify(parsed));
      const scope = recovery!.key.replace("sc-editor-rascunho:new:", "");
      localStorage.setItem(`sc-editor-active:${scope}`, eventId);
    }, { recovery, eventId: event.id });
    await unauthorized.goto("/painel/criar");
    await escolherModelo(unauthorized);
    await unauthorized.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(unauthorized.getByText("Convite não encontrado.")).toBeVisible();
    await unauthorizedContext.close();

    // Publica A, edita B sem republicar e confirma que o site continua em A.
    await page.goto(`/painel/criar?id=${event.id}`);
    for (let step = 1; step < 6; step += 1) await continueStep(page).click();
    const slug = `e2e-${Date.now()}`;
    await page.getByText("Endereço do seu convite").locator("..").locator("input").fill(slug);
    await page.getByRole("button", { name: "Publicar convite" }).click();
    await expect(page.getByText("Seu convite está no ar")).toBeVisible();

    const publicPage = await browser.newPage();
    await publicPage.goto(urlDoTenant(slug, baseURL));
    await expect(publicPage.locator("body")).toContainText(`${publishedName}-A`);

    const editorPage = await browser.newPage();
    await login(editorPage);
    await editorPage.goto(`/painel/criar?id=${event.id}`);
    const unpublishedName = `${publishedName}-não-publicado`;
    await nameInput(editorPage).fill(unpublishedName);
    await editorPage.getByRole("button", { name: "Salvar rascunho" }).click();
    await publicPage.reload();
    await expect(publicPage.locator("body")).toContainText(`${publishedName}-A`);
    await expect(publicPage.locator("body")).not.toContainText(unpublishedName);

    for (let step = 1; step < 6; step += 1) await continueStep(editorPage).click();
    await editorPage.getByRole("button", { name: "Publicar convite" }).click();
    await expect(editorPage.getByText("Seu convite está no ar")).toBeVisible();
    await publicPage.reload();
    await expect(publicPage.locator("body")).toContainText(unpublishedName);
    await publicPage.close();
    await editorPage.close();
  });

  // A PORTA de abrir o editor. Publicou, fecha: o convite que ja esta na mao dos
  // convidados so volta a ser editavel dentro de uma janela (cortesia, cota do
  // plano ou passe pago). Fora dela, nem o link direto do editor abre — vai para
  // a tela que explica e libera (`/painel/[id]/liberar`, criada na Task 7; ate la
  // o destino responde 404, o que nao muda o que este teste prova: o redirect).
  test("convite publicado so abre o editor dentro da janela", async ({ page }) => {
    await login(page);
    const dono = await prisma!.professional.findUniqueOrThrow({ where: { email: emailA }, select: { id: true } });
    const evento = await prisma!.event.create({
      data: {
        professionalId: dono.id,
        type: "QUINZE_ANOS",
        subdomain: `${slugFechado}-${Date.now()}`,
        title: "Convite fechado E2E",
        eventDate: new Date(Date.now() + 30 * 86_400_000),
        expiresAt: new Date(Date.now() + 60 * 86_400_000),
        status: "PUBLISHED",
        plan: "PREMIUM",
        edicaoAte: new Date(Date.now() - 1_000), // a janela venceu ha um segundo
      },
    });

    await page.goto(`/painel/criar?id=${evento.id}`);
    await expect(page).toHaveURL(new RegExp(`/painel/${evento.id}/liberar`));

    // E o contrario, senao um redirect que barra TODO mundo passaria no teste:
    // com a janela aberta, o mesmo convite publicado abre para editar.
    await prisma!.event.update({ where: { id: evento.id }, data: { edicaoAte: new Date(Date.now() + 3_600_000) } });
    await page.goto(`/painel/criar?id=${evento.id}`);
    await expect(page).toHaveURL(/\/painel\/criar/);
    await expect(nameInput(page)).toBeEditable();

    // Convite LEGADO (publicado antes do editor novo, sem `draftData`) e ja
    // fechado: a porta tem que barrar DEPOIS do bootstrap. Se ela vier antes, o
    // legado nunca congela o snapshot e fica preso no unico modo em que o painel
    // antigo edita o site AO VIVO.
    const legado = await prisma!.event.create({
      data: {
        professionalId: dono.id,
        type: "QUINZE_ANOS",
        subdomain: `${slugFechado}-legado-${Date.now()}`,
        title: "Convite legado E2E",
        eventDate: new Date(Date.now() + 30 * 86_400_000),
        expiresAt: new Date(Date.now() + 60 * 86_400_000),
        status: "PUBLISHED",
        plan: "PREMIUM",
        edicaoAte: new Date(Date.now() - 1_000),
      },
    });
    await page.goto(`/painel/criar?id=${legado.id}`);
    await expect(page).toHaveURL(new RegExp(`/painel/${legado.id}/liberar`));
    const congelado = await prisma!.event.findUniqueOrThrow({
      where: { id: legado.id },
      select: { draftData: true, publishedData: true },
    });
    expect(congelado.draftData).not.toBeNull();
    expect(congelado.publishedData).not.toBeNull();
  });
});
