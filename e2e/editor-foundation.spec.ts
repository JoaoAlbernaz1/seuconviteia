import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const databaseReady = process.env.E2E_DATABASE_READY === "1";
const email = process.env.E2E_EMAIL ?? "demo@seuconviteia.com";
const password = process.env.E2E_PASSWORD ?? "demo12345";
const draftKey = "sc-editor-rascunho";

async function login(page: Page) {
  await page.goto("/entrar");
  await page.getByPlaceholder("E-mail").fill(email);
  await page.getByPlaceholder("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/painel/);
}

async function toggleBeside(page: Page, label: string) {
  const row = page.getByText(label, { exact: true }).locator("..");
  await row.locator("span").last().click();
}

async function loginContext(context: BrowserContext) {
  const page = await context.newPage();
  await login(page);
  return page;
}

test.describe("fundação do editor", () => {
  test.skip(!databaseReady, "Requer MySQL com schema expandido e seed demo (E2E_DATABASE_READY=1)." );

  test("editar → preview → autosave → reload → conflito → publicar", async ({ browser, page }) => {
    await login(page);
    await page.goto("/painel/criar");

    const name = `E2E ${Date.now()}`;
    await page.getByText("Nome da debutante", { exact: true }).locator("..").locator("input").fill(name);
    await expect(page.locator('[data-invitation-renderer="preview"]')).toContainText(name);

    for (let cycle = 0; cycle < 3; cycle += 1) {
      await toggleBeside(page, "Monograma na barra");
      await toggleBeside(page, "Monograma na barra");
    }

    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByText("Data e local", { exact: true }).click();
    await page.getByText("Data da festa", { exact: true }).locator("..").locator("input").fill("2026-12-20");
    await page.getByText("Horário de início", { exact: true }).locator("..").locator("input").fill("20:00");
    await page.getByText("Nome do local", { exact: true }).locator("..").locator("input").fill("Salão E2E");
    await page.getByText("Cidade", { exact: true }).locator("..").locator("input").fill("Brasília");
    await page.getByText("UF", { exact: true }).locator("..").locator("input").fill("DF");

    await page.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(page.getByText("Alterações salvas")).toBeVisible();
    const stored = await page.evaluate((key) => localStorage.getItem(key), draftKey);
    expect(stored).toBeTruthy();

    await page.reload();
    await expect(page.getByText("Nome da debutante", { exact: true }).locator("..").locator("input")).toHaveValue(name);
    await expect(page.locator('[data-invitation-renderer="preview"]')).toContainText(name);

    const secondContext = await browser.newContext();
    const second = await loginContext(secondContext);
    await second.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: draftKey, value: stored! });
    await second.goto("/painel/criar");
    await expect(second.getByText("Nome da debutante", { exact: true }).locator("..").locator("input")).toHaveValue(name);

    await page.getByText("Nome da debutante", { exact: true }).locator("..").locator("input").fill(`${name} A`);
    await second.getByText("Nome da debutante", { exact: true }).locator("..").locator("input").fill(`${name} B`);
    await page.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(page.getByText("Alterações salvas")).toBeVisible();
    await second.getByRole("button", { name: "Salvar rascunho" }).click();
    await expect(second.getByRole("alert")).toContainText("outra aba");
    await secondContext.close();

    for (let step = 2; step < 6; step += 1) await page.getByRole("button", { name: "Continuar" }).click();
    const slug = `e2e-${Date.now()}`;
    await page.locator('input[value$="15anos"]').fill(slug).catch(async () => {
      await page.getByText("Endereço do seu convite").locator("..").locator("input").fill(slug);
    });
    await page.getByRole("button", { name: "Publicar convite" }).click();
    await expect(page.getByText(/convite.*publicado/i)).toBeVisible();

    await page.goto(`http://${slug}.localhost:3000`);
    await expect(page.locator('[data-invitation-renderer="published"], body')).toContainText(`${name} A`);
  });
});
