import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Testes unitarios dos helpers puros (sem banco, sem DOM).
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
