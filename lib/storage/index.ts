// Abstracao de storage de arquivos (fotos de evento, etc.).
// Implementacao real (Vercel Blob via BLOB_READ_WRITE_TOKEN) chega em fase posterior.

export interface UploadInput {
  /** Nome/destino do arquivo (ex.: "eventos/<id>/capa.jpg"). */
  path: string;
  /** Conteudo do arquivo. */
  body: Blob | ArrayBuffer | Buffer | Uint8Array;
  /** Content-type (ex.: "image/jpeg"). */
  contentType?: string;
}

export interface UploadResult {
  /** URL publica do arquivo enviado. */
  url: string;
}

export interface StorageProvider {
  upload(input: UploadInput): Promise<UploadResult>;
}

/** Provider falso para dev/teste. NAO persiste nada. */
export class StubStorageProvider implements StorageProvider {
  async upload(input: UploadInput): Promise<UploadResult> {
    return { url: `https://stub.local/blob/${input.path}` };
  }
}

export const storageProvider: StorageProvider = new StubStorageProvider();
