// Upload de imagem autenticado (capa/album do evento).
//
// POST multipart com campo `file`. Requer sessao (`auth()`); valida com Zod que e
// uma imagem (JPG/PNG/WebP) de ate ~6MB; RECUSA imagem com QR code (ver
// `lib/imagemQr.ts`); salva via storage provider sob um diretorio por
// profissional; devolve `{ url }`.
//
// Esta rota fica no subdominio `app` (reservado) — o middleware NAO reescreve `/api/*`,
// entao ela responde como rota raiz normal do app. Runtime Node (Prisma/bcrypt no auth).
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getStorageProvider } from "@/lib/storage";
import { contemQrCode, ERRO_QR } from "@/lib/imagemQr";

export const runtime = "nodejs";

const TIPOS_OK = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 6 * 1024 * 1024; // ~6MB

const fileSchema = z
  .instanceof(File, { message: "Envie um arquivo de imagem." })
  .refine((f) => f.size > 0, "Arquivo vazio.")
  .refine((f) => f.size <= MAX_BYTES, "A imagem deve ter no maximo 6MB.")
  .refine(
    (f) => (TIPOS_OK as readonly string[]).includes(f.type),
    "Formato invalido — use JPG, PNG ou WebP.",
  );

export async function POST(req: Request) {
  // Tenant SEMPRE da sessao — sem login, 401.
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requisicao invalida." }, { status: 400 });
  }

  const parsed = fileSchema.safeParse(form.get("file"));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Arquivo invalido.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Foto com QR CODE nao entra: o presente em dinheiro e pago pelo proprio site
  // (com a taxa da plataforma), e um QR na foto e o atalho para desviar isso —
  // basta o convidado escanear. Ver `lib/imagemQr.ts`.
  // A leitura do arquivo entra no `try` junto: falhar ao ler o `File` não pode
  // virar erro 500 num módulo que promete falhar ABERTO.
  let temQr = false;
  try {
    temQr = await contemQrCode(await parsed.data.arrayBuffer());
  } catch {
    temQr = false;
  }
  if (temQr) {
    return NextResponse.json({ error: ERRO_QR }, { status: 400 });
  }

  try {
    // Diretorio por profissional (isolamento) — id vem da sessao, nao do cliente.
    const { url } = await getStorageProvider().salvar(
      parsed.data,
      `eventos/${session.user.id}`,
    );
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload] falha ao salvar arquivo", err);
    return NextResponse.json(
      { error: "Falha ao salvar o arquivo. Tente novamente." },
      { status: 500 },
    );
  }
}
