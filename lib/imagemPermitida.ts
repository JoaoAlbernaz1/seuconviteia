// De onde pode vir uma imagem do convite.
//
// A trava de QR code mora no upload (`lib/imagemQr.ts`), mas o upload não é o
// único jeito de uma imagem entrar: o editor salva o documento com as URLs, e
// quem controla o navegador pode mandar o documento que quiser. Uma URL de
// fora — ou um `data:` com o QR embutido — entraria sem passar pela porta.
//
// Aqui a regra é a origem: só vale imagem que NÓS emitimos.
//   - caminho do próprio site  (`/uploads/...`, `/presentes-demo/...`)
//   - Vercel Blob             (`https://<store>.public.blob.vercel-storage.com/...`)
//
// Isso fecha `data:`, `http://` e qualquer host de terceiro — inclusive os
// encurtadores e hospedagens grátis onde daria para deixar um QR.
//
// PURA e testável: só olha a string.

const BLOB = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[^\s]*$/i;

/** Uma imagem vazia é ausência de imagem — sempre válida. */
export function imagemPermitida(url: string): boolean {
  const u = url.trim();
  if (!u) return true;
  // Caminho do próprio site. `//host` é URL de protocolo relativo (outro host).
  if (u.startsWith("/") && !u.startsWith("//")) return true;
  return BLOB.test(u);
}

/** Todas as imagens que o documento carrega, na ordem em que a pessoa as vê. */
export function imagensDoDocumento(document: {
  cover: { mobileImageUrl: string; desktopImage: { url: string }; monogram: { imageUrl: string } };
  gifts: { items: { imageUrl: string }[] };
  gallery: { imageUrls: string[] };
}): string[] {
  return [
    document.cover.mobileImageUrl,
    document.cover.desktopImage.url,
    document.cover.monogram.imageUrl,
    ...document.gifts.items.map((g) => g.imageUrl),
    ...document.gallery.imageUrls,
  ];
}
