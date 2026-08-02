import { describe, it, expect } from "vitest";
import { extrairMetaOg, precoParaCents, hostBloqueado, decodeEntidades } from "./linkPreview";

describe("extrairMetaOg", () => {
  it("lê og:title e og:image (ordem de atributos livre)", () => {
    const html = `
      <meta content="Fone Bluetooth XY" property="og:title">
      <meta property="og:image" content="https://loja.com/foto.jpg">
      <meta property="product:price:amount" content="199.90">
    `;
    expect(extrairMetaOg(html)).toEqual({
      titulo: "Fone Bluetooth XY",
      imagem: "https://loja.com/foto.jpg",
      precoCents: 19990,
    });
  });
  it("cai para <title> sem og:title e decodifica entidades", () => {
    const html = `<title>Panela &amp; Cia</title>`;
    expect(extrairMetaOg(html).titulo).toBe("Panela & Cia");
  });
  it("sem meta útil -> tudo undefined", () => {
    expect(extrairMetaOg("<p>oi</p>")).toEqual({ titulo: undefined, imagem: undefined, precoCents: undefined });
  });
});

describe("precoParaCents", () => {
  it("formatos BR e US", () => {
    expect(precoParaCents("R$ 1.234,56")).toBe(123456);
    expect(precoParaCents("1234.56")).toBe(123456);
    expect(precoParaCents("99,90")).toBe(9990);
  });
  it("inválido -> undefined", () => {
    expect(precoParaCents("grátis")).toBeUndefined();
    expect(precoParaCents("0")).toBeUndefined();
  });
});

describe("hostBloqueado (SSRF)", () => {
  it("bloqueia internos", () => {
    for (const h of ["localhost", "127.0.0.1", "10.0.0.5", "192.168.1.4", "172.16.0.1", "169.254.169.254", "app.local"]) {
      expect(hostBloqueado(h)).toBe(true);
    }
  });
  it("permite lojas públicas", () => {
    for (const h of ["www.amazon.com.br", "magazineluiza.com.br", "loja.com"]) {
      expect(hostBloqueado(h)).toBe(false);
    }
  });
});

describe("decodeEntidades", () => {
  it("decodifica as comuns", () => {
    expect(decodeEntidades("A &amp; B &quot;C&quot;")).toBe('A & B "C"');
  });
});
