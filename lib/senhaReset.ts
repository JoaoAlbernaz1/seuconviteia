// REDEFINIÇÃO DE SENHA — o núcleo, puro e testável.
//
// O link que vai no e-mail É uma credencial: quem tem ele entra na conta. Então
// as regras aqui são as de uma credencial, não as de um id:
//
//  - O token nasce de 32 bytes aleatórios de verdade (`randomBytes`, não
//    `Math.random`) e vive no e-mail em base64url.
//  - No banco fica só o HASH (SHA-256). Se o banco vazar, o que está gravado não
//    serve para entrar: o atacante teria de inverter o hash. Sem isso, um dump
//    do banco seria uma lista de links de acesso prontos.
//  - Comparação por hash + `@unique` no `tokenHash`: a busca é por igualdade de
//    hash, então não há como sondar token parcial.
//  - USO ÚNICO e VALIDADE CURTA, porque link de e-mail não desaparece: fica na
//    caixa de entrada, no histórico do navegador e no preview do mensageiro.
//
// SHA-256 sem sal e sem KDF é o certo AQUI (e seria errado para senha): o token
// tem 256 bits de entropia, então não existe dicionário nem força bruta viável —
// o que um KDF protege é segredo de baixa entropia, como senha de gente.
import { createHash, randomBytes } from "node:crypto";

/** Quanto tempo o link vale. Curto: é uma credencial no e-mail de alguém. */
export const VALIDADE_MINUTOS = 60;

/** Tamanho mínimo da senha nova — o mesmo do cadastro, senão a troca enfraquece. */
export const SENHA_MINIMA = 8;

/** Hash do token, do jeito que ele é guardado e procurado no banco. */
export function hashDoToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Um token novo: o que vai no e-mail e o que vai para o banco. */
export function gerarToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashDoToken(token) };
}

/** Quando este pedido expira, contado de agora. */
export function expiraEm(agora: Date): Date {
  return new Date(agora.getTime() + VALIDADE_MINUTOS * 60_000);
}

/**
 * Este pedido ainda pode virar uma senha nova?
 *
 * Devolve o MOTIVO, e não só um booleano, porque a tela precisa distinguir
 * "expirou" (peça outro) de "já foi usado" (você já trocou — talvez alguém
 * clicou no link antigo) e de "não existe" (link adulterado).
 */
export type MotivoRecusa = "inexistente" | "expirado" | "usado";

export function avaliarPedido(
  pedido: { expiresAt: Date; usedAt: Date | null } | null,
  agora: Date,
): { ok: true } | { ok: false; motivo: MotivoRecusa } {
  if (!pedido) return { ok: false, motivo: "inexistente" };
  if (pedido.usedAt) return { ok: false, motivo: "usado" };
  if (pedido.expiresAt.getTime() <= agora.getTime()) return { ok: false, motivo: "expirado" };
  return { ok: true };
}

/** A frase que a tela mostra para cada recusa. */
export function textoDaRecusa(motivo: MotivoRecusa): string {
  switch (motivo) {
    case "expirado":
      return "Este link expirou. Peça um novo — eles valem 1 hora.";
    case "usado":
      return "Este link já foi usado. Se não foi você, peça um novo agora.";
    default:
      return "Este link não é válido. Peça um novo para redefinir sua senha.";
  }
}

/**
 * O link que vai no e-mail.
 *
 * `base` entra por parâmetro porque quem monta a URL pública é a borda (a action
 * sabe o domínio); aqui só se garante que o token vai codificado — chave
 * base64url pode conter `-` e `_`, que passam, mas encodar é o que impede um
 * token estranho de virar outro caminho.
 */
export function linkDeRedefinicao(base: string, token: string): string {
  return `${base}/entrar/senha/nova?token=${encodeURIComponent(token)}`;
}

/** Corpo do e-mail. Texto curto: é um aviso, não uma newsletter. */
export function emailDeRedefinicao(nome: string, link: string): { subject: string; html: string } {
  const primeiroNome = nome.trim().split(/\s+/)[0] || "Olá";
  return {
    subject: "Redefinir sua senha · seuconvite",
    html: `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#0f172a">
<p>Oi, ${primeiroNome}!</p>
<p>Você pediu para redefinir a senha da sua conta no <strong>seuconvite</strong>. O link abaixo vale por <strong>1 hora</strong> e só pode ser usado uma vez:</p>
<p style="margin:24px 0"><a href="${link}" style="background:#6d28d9;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block">Criar uma senha nova</a></p>
<p style="color:#64748b;font-size:13.5px">Se não foi você que pediu, ignore este e-mail — sua senha continua a mesma.</p>
</div>`,
  };
}
