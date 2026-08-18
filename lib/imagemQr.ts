// Recusa de imagem com QR CODE nos uploads do convite.
//
// POR QUE: o dinheiro do presente passa pela plataforma, que cobra a taxa. Uma
// foto, porém, é conteúdo livre — dá para enviar o print do QR do Pix PESSOAL
// como "foto do presente" (ou na galeria, ou na capa) e o convidado escaneia
// aquilo. O pagamento sai por fora, e ninguém percebe. Texto com a chave até
// dá para copiar, mas exige esforço; um QR na tela é um toque.
//
// Fecha na PORTA: o arquivo é lido no servidor e recusado se tiver QR dentro.
//
// FALHA ABERTA de propósito: se a leitura quebrar (formato exótico, imagem
// corrompida, falta de memória), o upload PASSA. Esta é uma trava de abuso, não
// um controle de segurança — bloquear foto de festa por um erro nosso custa
// mais do que deixar passar um caso raro.
import jsQR from "jsqr";
import sharp from "sharp";

/** Lado máximo analisado. Acima disso a leitura fica cara sem achar mais nada. */
const LADO_MAX = 1000;

/**
 * Teto de pixels da imagem ORIGINAL (~50 megapixels).
 *
 * Os 6 MB do upload limitam o arquivo COMPRIMIDO, não a imagem aberta: um PNG
 * de poucos KB pode declarar 16.000 × 16.000 e virar ~1 GB em memória na hora
 * de decodificar. Isso derruba a função inteira, e o `catch` não salva de um
 * estouro de memória. Acima deste teto o `sharp` recusa a imagem, o erro cai no
 * `catch` e o upload PASSA (falha aberta) — coerente com o resto do módulo.
 */
const PIXELS_MAX = 50_000_000;

/**
 * A imagem contém um QR code legível?
 *
 * Analisa a imagem inteira, reduzida para no máximo `LADO_MAX` — um QR que não
 * sobrevive a essa redução também não seria escaneável na tela do convidado.
 */
export async function contemQrCode(dados: ArrayBuffer | Uint8Array): Promise<boolean> {
  try {
    const bytes = dados instanceof Uint8Array ? dados : new Uint8Array(dados);
    const { data, info } = await sharp(Buffer.from(bytes), { limitInputPixels: PIXELS_MAX })
      .rotate() // respeita a orientação do EXIF (foto de celular deitada)
      .resize({ width: LADO_MAX, height: LADO_MAX, fit: "inside", withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const achado = jsQR(new Uint8ClampedArray(data), info.width, info.height, {
      // QR claro sobre fundo escuro também conta.
      inversionAttempts: "attemptBoth",
    });
    return achado !== null;
  } catch {
    return false;
  }
}

/** Recado ao profissional quando a imagem é recusada. */
export const ERRO_QR =
  "Esta imagem tem um QR code. Os presentes em dinheiro são pagos pelo próprio site — envie uma foto sem QR.";
