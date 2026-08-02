"use server";

// Server action chamada pelo editor ao colar um link de loja: busca a prévia
// (nome/foto/preço) no servidor. Exige sessão (evita virar proxy aberto).
import { auth } from "@/auth";
import { lerPreviaLink, type PreviaLink } from "@/lib/linkPreview";

export async function previewLink(url: string): Promise<PreviaLink> {
  const session = await auth();
  if (!session?.user) return { ok: false, erro: "Sua sessão expirou. Entre de novo." };
  if (typeof url !== "string" || url.trim().length < 8) {
    return { ok: false, erro: "Cole um link válido." };
  }
  return lerPreviaLink(url);
}
