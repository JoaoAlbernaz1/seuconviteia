import { describe, it, expect } from "vitest";
import { brlParaCents, montarMapsUrls, semUndefined } from "./eventoForm";

describe("brlParaCents", () => {
  it.each([
    ["R$ 10", 1000],
    ["R$ 10,50", 1050],
    ["R$ 1.200", 120000],
    ["R$ 1.200,50", 120050],
    ["1200", 120000],
    ["1200,50", 120050],
  ])("converte %s exatamente para %i centavos", (input, cents) => {
    expect(brlParaCents(input)).toBe(cents);
  });

  it("converte formato pt-BR com virgula decimal", () => {
    expect(brlParaCents("150,00")).toBe(15000);
    expect(brlParaCents("90,50")).toBe(9050);
  });

  it("trata ponto como milhar quando ha virgula decimal", () => {
    expect(brlParaCents("1.250,50")).toBe(125050);
    expect(brlParaCents("1.000,00")).toBe(100000);
  });

  it("aceita inteiro sem separadores", () => {
    expect(brlParaCents("150")).toBe(15000);
    expect(brlParaCents("0")).toBe(0);
  });

  it("trata ponto sozinho como decimal", () => {
    expect(brlParaCents("150.5")).toBe(15050);
  });

  it("ignora prefixo R$ e espacos", () => {
    expect(brlParaCents("R$ 90,00")).toBe(9000);
    expect(brlParaCents("  120,00  ")).toBe(12000);
  });

  it("retorna null para vazio / invalido / negativo", () => {
    expect(brlParaCents("")).toBeNull();
    expect(brlParaCents("   ")).toBeNull();
    expect(brlParaCents(null)).toBeNull();
    expect(brlParaCents(undefined)).toBeNull();
    expect(brlParaCents("abc")).toBeNull();
    expect(brlParaCents("-5")).toBeNull();
  });
});

describe("montarMapsUrls", () => {
  it("deriva os dois links do local + endereco", () => {
    const { mapsUrl, mapsEmbedUrl } = montarMapsUrls(
      "Espaço Esplendor",
      "Park Way, Brasília",
    );
    const enc = encodeURIComponent("Espaço Esplendor, Park Way, Brasília");
    expect(mapsUrl).toBe(
      `https://www.google.com/maps/search/?api=1&query=${enc}`,
    );
    expect(mapsEmbedUrl).toBe(
      `https://www.google.com/maps?q=${enc}&output=embed`,
    );
  });

  it("usa so o campo preenchido quando o outro esta vazio", () => {
    const { mapsUrl } = montarMapsUrls("Espaço Esplendor", "");
    expect(mapsUrl).toContain(encodeURIComponent("Espaço Esplendor"));
  });

  it("retorna objeto vazio sem local nem endereco", () => {
    expect(montarMapsUrls("", "")).toEqual({});
    expect(montarMapsUrls(undefined, null)).toEqual({});
  });
});

describe("semUndefined", () => {
  it("remove apenas as chaves undefined", () => {
    expect(semUndefined({ a: 1, b: undefined, c: "", d: null })).toEqual({
      a: 1,
      c: "",
      d: null,
    });
  });
});
