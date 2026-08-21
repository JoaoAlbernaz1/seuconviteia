import { describe, it, expect } from "vitest";
import { ehAdminDeRepasse, repasseEhAutomatico, rotuloDoRepasse } from "./repasse";

describe("ehAdminDeRepasse", () => {
  it("sem ADMIN_EMAILS, ninguem e admin", () => {
    // Fila inacessivel e melhor do que fila aberta: este e o unico lugar do
    // sistema que ve o dinheiro de TODOS os convites.
    expect(ehAdminDeRepasse("joao@orivya.com.br", undefined)).toBe(false);
    expect(ehAdminDeRepasse("joao@orivya.com.br", "")).toBe(false);
  });

  it("aceita a lista separada por virgula ou ponto-e-virgula", () => {
    const lista = "joao@orivya.com.br; operacao@orivya.com.br";
    expect(ehAdminDeRepasse("joao@orivya.com.br", lista)).toBe(true);
    expect(ehAdminDeRepasse("operacao@orivya.com.br", lista)).toBe(true);
    expect(ehAdminDeRepasse("estranho@gmail.com", lista)).toBe(false);
  });

  it("ignora caixa e espaco — e-mail chega do jeito que a pessoa digitou", () => {
    expect(ehAdminDeRepasse("  Joao@Orivya.com.BR ", "joao@orivya.com.br")).toBe(true);
  });

  it("sem e-mail na sessao, nao e admin", () => {
    expect(ehAdminDeRepasse(null, "joao@orivya.com.br")).toBe(false);
    expect(ehAdminDeRepasse(undefined, "joao@orivya.com.br")).toBe(false);
    expect(ehAdminDeRepasse("   ", "joao@orivya.com.br")).toBe(false);
  });
});

describe("repasseEhAutomatico", () => {
  it("segue a capacidade do provedor", () => {
    expect(repasseEhAutomatico({ podeTransferir: true })).toBe(true);
    expect(repasseEhAutomatico({ podeTransferir: false })).toBe(false);
  });
});

describe("rotuloDoRepasse", () => {
  it("no repasse humano, PENDING nao diz 'processando'", () => {
    // "Processando" sugere maquina trabalhando e questao de segundos; aqui um
    // humano vai pagar. A frase tem de caber na verdade.
    expect(rotuloDoRepasse("PENDING", false)).toBe("Pedido enviado — em até 1 dia útil");
    expect(rotuloDoRepasse("PENDING", true)).toBe("Processando");
  });

  it("falha diz para onde o dinheiro foi", () => {
    // `saldoDoEvento` conta payout PAID e PENDING como saida; FAILED volta a
    // contar como saldo — a frase precisa combinar com a conta.
    expect(rotuloDoRepasse("FAILED", false)).toBe("Não saiu — o valor voltou para o saldo");
    expect(rotuloDoRepasse("PAID", false)).toBe("Pago");
  });
});
