import { describe, expect, it } from "vitest";
import { cpfValido, lerCarteira, mascararCpf, soDigitos } from "./carteira";

describe("cpfValido", () => {
  it("aceita CPF válido com e sem máscara", () => {
    // CPF de exemplo válido pelos dígitos verificadores (gerador padrão).
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("52998224725")).toBe(true);
  });
  it("rejeita dígito verificador errado", () => {
    expect(cpfValido("529.982.247-26")).toBe(false);
  });
  it("rejeita sequências e tamanhos errados", () => {
    expect(cpfValido("111.111.111-11")).toBe(false);
    expect(cpfValido("123")).toBe(false);
    expect(cpfValido("")).toBe(false);
  });
});

describe("mascararCpf", () => {
  it("esconde os 3 primeiros dígitos", () => {
    expect(mascararCpf("529.982.247-25")).toBe("•••.982.247-25");
  });
  it("cai para '•••' quando inválido", () => {
    expect(mascararCpf("12")).toBe("•••");
  });
});

describe("soDigitos", () => {
  it("remove tudo que não é dígito", () => {
    expect(soDigitos("(61) 99999-0000")).toBe("61999990000");
  });
});

describe("lerCarteira", () => {
  it("inativa quando ausente ou malformada", () => {
    expect(lerCarteira(null).ativa).toBe(false);
    expect(lerCarteira({}).ativa).toBe(false);
    expect(lerCarteira({ carteira: { ativa: "sim" } }).ativa).toBe(false);
  });
  it("lê a carteira ativa com os campos", () => {
    const c = lerCarteira({
      carteira: { ativa: true, titular: "Ana Souza", cpf: "52998224725", celular: "61999990000" },
    });
    expect(c.ativa).toBe(true);
    expect(c.titular).toBe("Ana Souza");
    expect(c.cpf).toBe("52998224725");
  });
});
