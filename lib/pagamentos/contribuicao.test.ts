import { describe, it, expect } from "vitest";
import { valorDaContribuicao, saldoDoEvento } from "./contribuicao";

describe("valorDaContribuicao", () => {
  it("FIXO usa o preco do item", () => {
    const r = valorDaContribuicao({ pricingMode: "FIXO", priceCents: 15_000 }, {});
    expect(r).toEqual({ ok: true, brutoCents: 15_000, quotas: undefined });
  });
  it("COTAS: 2 cotas de R$100 (item R$1000 / 10) = R$200", () => {
    const r = valorDaContribuicao(
      { pricingMode: "COTAS", priceCents: 100_000, quotaCount: 10 },
      { quotas: 2 },
    );
    expect(r).toEqual({ ok: true, brutoCents: 20_000, quotas: 2 });
  });
  it("COTAS exige quotas >= 1 e <= total", () => {
    expect(valorDaContribuicao({ pricingMode: "COTAS", priceCents: 100_000, quotaCount: 10 }, { quotas: 0 }).ok).toBe(false);
    expect(valorDaContribuicao({ pricingMode: "COTAS", priceCents: 100_000, quotaCount: 10 }, { quotas: 11 }).ok).toBe(false);
  });
  it("LIVRE: valor custom respeitando o minimo (= priceCents)", () => {
    expect(valorDaContribuicao({ pricingMode: "LIVRE", priceCents: 5_000 }, { valorCustomCents: 8_000 }))
      .toEqual({ ok: true, brutoCents: 8_000, quotas: undefined });
    expect(valorDaContribuicao({ pricingMode: "LIVRE", priceCents: 5_000 }, { valorCustomCents: 3_000 }).ok)
      .toBe(false);
  });
  it("LIVRE sem minimo (contribuicao de valor livre) NAO aceita zero", () => {
    // priceCents 0 = "de graca" para a regra antiga; um Pix de R$ 0,00 nao existe.
    expect(valorDaContribuicao({ pricingMode: "LIVRE", priceCents: 0 }, { valorCustomCents: 0 }).ok)
      .toBe(false);
    expect(valorDaContribuicao({ pricingMode: "LIVRE", priceCents: 0 }, {}).ok)
      .toBe(false);
    expect(valorDaContribuicao({ pricingMode: "LIVRE", priceCents: 0 }, { valorCustomCents: -100 }).ok)
      .toBe(false);
  });
  it("COTAS que arredondam para zero sao recusadas", () => {
    // R$ 0,01 em 3 cotas: cada cota vale 0 e a cobranca seria de R$ 0,00.
    expect(valorDaContribuicao({ pricingMode: "COTAS", priceCents: 1, quotaCount: 3 }, { quotas: 1 }).ok)
      .toBe(false);
    expect(valorDaContribuicao({ pricingMode: "COTAS", priceCents: 0, quotaCount: 4 }, { quotas: 2 }).ok)
      .toBe(false);
  });
  it("LIVRE sem minimo aceita qualquer valor positivo", () => {
    expect(valorDaContribuicao({ pricingMode: "LIVRE", priceCents: 0 }, { valorCustomCents: 1 }))
      .toEqual({ ok: true, brutoCents: 1, quotas: undefined });
  });
});

describe("saldoDoEvento", () => {
  it("soma liquidos PAGOS menos payouts (PAGO/PENDENTE)", () => {
    const saldo = saldoDoEvento(
      [
        { netCents: 9_500, status: "PAID" },
        { netCents: 9_500, status: "PENDING" }, // ignora (nao pago)
      ],
      [{ amountCents: 4_000, status: "PENDING" }],
    );
    expect(saldo).toBe(5_500);
  });
});
