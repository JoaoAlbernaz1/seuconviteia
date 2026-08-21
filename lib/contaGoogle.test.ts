import { describe, it, expect } from "vitest";
import { googleConfigurado, normalizarEmail } from "./contaGoogle";

describe("googleConfigurado", () => {
  it("exige as DUAS credenciais", () => {
    // Meia credencial nao loga ninguem: o botao so pode aparecer quando o
    // caminho inteiro existe, senao e botao morto na porta de entrada.
    expect(googleConfigurado({ AUTH_GOOGLE_ID: "id", AUTH_GOOGLE_SECRET: "segredo" })).toBe(true);
    expect(googleConfigurado({ AUTH_GOOGLE_ID: "id" })).toBe(false);
    expect(googleConfigurado({ AUTH_GOOGLE_SECRET: "segredo" })).toBe(false);
    expect(googleConfigurado({})).toBe(false);
    expect(googleConfigurado({ AUTH_GOOGLE_ID: "  ", AUTH_GOOGLE_SECRET: "  " })).toBe(false);
  });
});

describe("normalizarEmail", () => {
  it("baixa a caixa e apara — senao o Google cria uma SEGUNDA conta", () => {
    // `Joao@Gmail.com` e `joao@gmail.com` sao a mesma caixa; sem normalizar, o
    // `findUnique` nao acharia a conta existente e nasceria uma conta duplicada,
    // com os convites divididos entre as duas.
    expect(normalizarEmail("  Joao@Gmail.com ")).toBe("joao@gmail.com");
    expect(normalizarEmail("ja@minusculo.com")).toBe("ja@minusculo.com");
  });
});
