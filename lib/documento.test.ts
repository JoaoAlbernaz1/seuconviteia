import { describe, expect, it } from "vitest";
import {
  cnpjValido,
  documentoValido,
  formatarDocumento,
  formatarTelefone,
  telefoneValido,
} from "./documento";

describe("cnpjValido", () => {
  it("aceita CNPJ com dígitos verificadores certos", () => {
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
    expect(cnpjValido("11222333000181")).toBe(true);
  });

  it("recusa dígito verificador errado, tamanho errado e sequência repetida", () => {
    expect(cnpjValido("11.222.333/0001-82")).toBe(false);
    expect(cnpjValido("1122233300018")).toBe(false);
    expect(cnpjValido("11111111111111")).toBe(false);
  });
});

describe("documentoValido — a pessoa digita CPF ou CNPJ no mesmo campo", () => {
  it("reconhece os dois pelo tamanho", () => {
    expect(documentoValido("529.982.247-25")).toBe(true); // CPF
    expect(documentoValido("11.222.333/0001-81")).toBe(true); // CNPJ
  });

  it("recusa número inventado e campo vazio", () => {
    expect(documentoValido("123.456.789-00")).toBe(false);
    expect(documentoValido("")).toBe(false);
    expect(documentoValido("12345")).toBe(false);
  });
});

describe("formatarDocumento — máscara enquanto digita", () => {
  it("põe pontuação de CPF até 11 dígitos e de CNPJ a partir daí", () => {
    expect(formatarDocumento("529")).toBe("529");
    expect(formatarDocumento("52998224")).toBe("529.982.24");
    expect(formatarDocumento("52998224725")).toBe("529.982.247-25");
    expect(formatarDocumento("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("ignora o que não é número e não passa do tamanho do CNPJ", () => {
    expect(formatarDocumento("abc529")).toBe("529");
    expect(formatarDocumento("112223330001810000")).toBe("11.222.333/0001-81");
  });
});

describe("telefone", () => {
  it("valida celular com DDD (10 ou 11 dígitos)", () => {
    expect(telefoneValido("(61) 99999-8888")).toBe(true);
    expect(telefoneValido("6133334444")).toBe(true);
    expect(telefoneValido("999998888")).toBe(false);
  });

  it("formata enquanto digita", () => {
    expect(formatarTelefone("61")).toBe("(61");
    expect(formatarTelefone("6199999")).toBe("(61) 99999");
    expect(formatarTelefone("61999998888")).toBe("(61) 99999-8888");
    expect(formatarTelefone("6133334444")).toBe("(61) 3333-4444");
  });
});
