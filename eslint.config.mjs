import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Clone aninhado acidental (checkout duplicado de 08/07) — nao faz parte do
    // projeto; so poluia o lint com o .next dele. Ver HANDOFF.
    "seuconviteia/**",
  ]),
]);

export default eslintConfig;
