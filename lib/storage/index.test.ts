import { describe, it, expect, vi, afterEach } from "vitest";

// `put` do Vercel Blob mockado: o teste garante COMO chamamos o serviço, sem
// rede e sem token de verdade.
const put = vi.hoisted(() => vi.fn());
vi.mock("@vercel/blob", () => ({ put }));

import { extDeImagem, dirSeguro, getStorageProvider } from "./index";

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

/**
 * A escolha do provider não tinha teste — e o de produção era um TODO que
 * lançava erro, então TODO upload no ar devolvia 500 (o token está setado na
 * Vercel). Estes testes prendem os dois lados da escolha.
 */
describe("getStorageProvider", () => {
  const tokenOriginal = process.env.BLOB_READ_WRITE_TOKEN;
  afterEach(() => {
    if (tokenOriginal === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = tokenOriginal;
    put.mockReset();
  });

  it("com o token, grava no Vercel Blob e devolve a URL que ele responde", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_teste";
    put.mockResolvedValue({ url: "https://blob.vercel-storage.com/eventos/abc/x.png" });

    const file = new File([new Uint8Array([1, 2, 3])], "capa.PNG", { type: "image/png" });
    const r = await getStorageProvider().salvar(file, "eventos/../abc");

    expect(put).toHaveBeenCalledTimes(1);
    const [caminho, enviado, opts] = put.mock.calls[0];
    // `dirSeguro` comeu o "..": não dá para escapar da pasta do evento.
    expect(caminho).toMatch(/^eventos\/abc\/[0-9a-f-]{36}\.png$/);
    expect(enviado).toBe(file);
    expect(opts).toMatchObject({ access: "public", addRandomSuffix: false });
    expect(r.url).toBe("https://blob.vercel-storage.com/eventos/abc/x.png");
  });

  it("sem o token, escolhe o outro provider e não toca no Blob", () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    const local = getStorageProvider();
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_teste";
    const blob = getStorageProvider();

    expect(local.constructor).not.toBe(blob.constructor);
    expect(put).not.toHaveBeenCalled();
  });
});
