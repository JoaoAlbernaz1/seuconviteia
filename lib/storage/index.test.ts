import { describe, it, expect } from "vitest";
import { extDeImagem, dirSeguro } from "./index";

describe("extDeImagem", () => {
  it("deriva a extensao do content-type", () => {
    expect(extDeImagem("image/jpeg")).toBe("jpg");
    expect(extDeImagem("image/png")).toBe("png");
    expect(extDeImagem("image/webp")).toBe("webp");
    expect(extDeImagem("IMAGE/JPEG")).toBe("jpg");
  });

  it("cai para a extensao do nome quando o tipo nao ajuda", () => {
    expect(extDeImagem(undefined, "foto.PNG")).toBe("png");
    expect(extDeImagem("", "foto.jpeg")).toBe("jpg");
    expect(extDeImagem(null, "foto.webp")).toBe("webp");
  });

  it("cai para jpg quando nao ha info confiavel", () => {
    expect(extDeImagem()).toBe("jpg");
    expect(extDeImagem("application/pdf", "doc.pdf")).toBe("jpg");
    expect(extDeImagem(undefined, "semextensao")).toBe("jpg");
  });
});

describe("dirSeguro", () => {
  it("mantem caminhos validos e tira barras das pontas", () => {
    expect(dirSeguro("eventos/abc123")).toBe("eventos/abc123");
    expect(dirSeguro("/eventos/abc/")).toBe("eventos/abc");
  });

  it("remove path traversal e caracteres perigosos", () => {
    // O ponto e removido, entao "../" nao sobrevive.
    expect(dirSeguro("../../etc/passwd")).toBe("etc/passwd");
    expect(dirSeguro("evento s/a b c")).toBe("eventos/abc");
    expect(dirSeguro("a//b///c")).toBe("a/b/c");
  });
});
