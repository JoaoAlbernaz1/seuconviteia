import { defineConfig, devices } from "@playwright/test";

// O processo do Playwright NAO herda o `.env`: o Next carrega o dele sozinho, mas o
// `@prisma/client` usado direto nos specs nao carrega nada. Sem isto, um spec que fala
// com o banco morre em "Environment variable not found: DATABASE_URL".
try {
  process.loadEnvFile(".env");
} catch {
  // sem .env (CI com variaveis ja exportadas): segue com o que estiver no ambiente
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 360_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: process.env.E2E_WEB_SERVER_COMMAND ?? "pnpm dev --hostname 127.0.0.1",
        url: "http://127.0.0.1:3000/entrar",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
