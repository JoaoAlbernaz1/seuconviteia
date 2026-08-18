import { describe, expect, it } from "vitest";
import { imagemPermitida } from "./imagemPermitida";

describe("imagemPermitida", () => {
  it("aceita o que o próprio site emite", () => {
    expect(imagemPermitida("/uploads/eventos/abc/foto.jpg")).toBe(true);
    expect(imagemPermitida("/presentes-demo/festa.jpg")).toBe(true);
    expect(imagemPermitida("https://2e1n2budj16iqsse.public.blob.vercel-storage.com/eventos/a/b.jpg")).toBe(true);
  });

  it("campo vazio é ausência de imagem, não erro", () => {
    expect(imagemPermitida("")).toBe(true);
    expect(imagemPermitida("   ")).toBe(true);
  });

  it("recusa data: — o jeito de embutir um QR sem passar pelo upload", () => {
    expect(imagemPermitida("data:image/png;base64,iVBORw0KGgo=")).toBe(false);
  });

  it("recusa host de terceiro e protocolo relativo", () => {
    expect(imagemPermitida("https://i.imgur.com/qr.png")).toBe(false);
    expect(imagemPermitida("http://localhost:3000/uploads/x.jpg")).toBe(false);
    expect(imagemPermitida("//evil.example/qr.png")).toBe(false);
  });

  it("não se deixa enganar por host parecido com o do Blob", () => {
    expect(imagemPermitida("https://public.blob.vercel-storage.com.evil.com/qr.png")).toBe(false);
    expect(imagemPermitida("https://blob.vercel-storage.com/qr.png")).toBe(false);
  });
});
