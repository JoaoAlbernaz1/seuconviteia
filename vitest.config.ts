import { defineConfig } from "vitest/config";

// Testes unitarios dos helpers puros (sem banco, sem DOM).
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
