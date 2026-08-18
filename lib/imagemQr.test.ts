import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import sharp from "sharp";
import { contemQrCode } from "./imagemQr";

/** QR de verdade (o mesmo que um app de banco geraria) como PNG. */
async function pngComQr(texto: string, largura = 400): Promise<Buffer> {
  return QRCode.toBuffer(texto, { type: "png", width: largura, margin: 2 });
}

describe("contemQrCode", () => {
  it("acha o QR de uma chave Pix", async () => {
    const png = await pngComQr("00020126580014BR.GOV.BCB.PIX0136chave-pix-pessoal-do-profissional");
    expect(await contemQrCode(png)).toBe(true);
  });

  it("acha o QR mesmo colado dentro de uma foto maior", async () => {
    const qr = await pngComQr("pix-copia-e-cola", 420);
    const foto = await sharp({
      create: { width: 1200, height: 1600, channels: 3, background: "#c9a227" },
    })
      .composite([{ input: qr, top: 500, left: 380 }])
      .jpeg()
      .toBuffer();
    expect(await contemQrCode(foto)).toBe(true);
  });

  it("deixa passar foto sem QR nenhum", async () => {
    const foto = await sharp({
      create: { width: 900, height: 1200, channels: 3, background: "#e8c9d2" },
    })
      .jpeg()
      .toBuffer();
    expect(await contemQrCode(foto)).toBe(false);
  });

  it("FALHA ABERTA: arquivo ilegível não bloqueia o upload", async () => {
    expect(await contemQrCode(Buffer.from("isto não é imagem"))).toBe(false);
  });
});
