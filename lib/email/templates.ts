// Templates dos e-mails transacionais. Funcoes PURAS que devolvem {subject, html}
// — nada de IO/banco aqui, para os testes conferirem o conteudo sem mock. HTML
// com inline styles (sem framework): clientes de e-mail nao suportam <style>/CSS
// externo de forma confiavel, entao a marca (turquesa/roxo) vai em hex inline.
//
// Cores da marca (espelham os tokens de app/globals.css): ink #0f172a,
// teal #0ea5a6, violeta #6d28d9, turquesa #2de2e6, nevoa #f1f5f9, lilas #ede9fe.

export interface EmailTemplate {
  subject: string;
  html: string;
}

/**
 * Escapa texto vindo de fora (nome do convidado, titulo do evento) antes de
 * interpolar no HTML — evita que aspas/tags do input quebrem ou injetem markup.
 */
function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Casca comum dos e-mails: fundo neutro, cartao branco centralizado, faixa em
 * gradiente da marca no topo e rodape discreto. `titulo` vira o header do cartao;
 * `corpo` e o HTML ja montado do conteudo.
 */
function layout(titulo: string, corpo: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <div style="max-width:520px;margin:0 auto;padding:24px 16px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
      <div style="height:6px;background:linear-gradient(90deg,#2de2e6,#0ea5a6,#6d28d9);"></div>
      <div style="padding:32px 28px;">
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#0f172a;">${titulo}</h1>
        ${corpo}
      </div>
    </div>
    <p style="margin:20px auto 0;text-align:center;font-size:12px;color:#64748b;">
      Enviado por SeuConvite IA — sites de convite para os seus eventos.
    </p>
  </div>
</body>
</html>`;
}

/** Botao/CTA em violeta (acento principal da marca). */
function botao(href: string, texto: string): string {
  return `<a href="${href}" style="display:inline-block;margin:8px 0;padding:12px 22px;background:#6d28d9;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">${texto}</a>`;
}

// ----------------------------------------------------------------------------
// Boas-vindas (dispara no cadastro do profissional)
// ----------------------------------------------------------------------------

export interface BoasVindasInput {
  nome: string;
  /** URL do painel do profissional (montada na action com o dominio de entao). */
  painelUrl: string;
}

/** E-mail de boas-vindas ao profissional que acabou de se cadastrar. */
export function emailBoasVindas({ nome, painelUrl }: BoasVindasInput): EmailTemplate {
  const primeiroNome = esc(nome.trim().split(/\s+/)[0] || nome.trim());
  const subject = "Bem-vindo(a) ao SeuConvite IA";
  const corpo = `
    <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#0f172a;">
      Olá, ${primeiroNome}! Sua conta está pronta. 🎉
    </p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">
      Com o SeuConvite IA você cria sites de convite para os seus clientes —
      casamento, 15 anos, bodas, aniversário — cada evento no seu próprio endereço,
      com confirmação de presença (RSVP), lista de presentes via Pix, mural de
      recados e álbum de fotos.
    </p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#334155;">
      Comece criando o seu primeiro evento no painel:
    </p>
    <p style="margin:0;">${botao(painelUrl, "Abrir meu painel")}</p>
    <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
      Se o botão não funcionar, copie e cole este endereço no navegador:<br />
      <span style="color:#0ea5a6;">${esc(painelUrl)}</span>
    </p>`;
  return { subject, html: layout("Sua conta está pronta", corpo) };
}

// ----------------------------------------------------------------------------
// Notificacao de RSVP (dispara quando um convidado confirma/recusa)
// ----------------------------------------------------------------------------

export interface NotificacaoRsvpInput {
  /** Dono do evento (saudacao). */
  nomeProfissional: string;
  /** Nome do convidado (titular) que respondeu. */
  nomeConvidado: string;
  /** Titulo do evento. */
  tituloEvento: string;
  /** `true` = vai; `false` = nao vai. */
  compareceu: boolean;
  /** Acompanhantes que vem junto do titular (0 quando nao vai). */
  acompanhantes: number;
}

/** E-mail avisando o profissional dono do evento que um convidado respondeu o RSVP. */
export function emailNotificacaoRsvp({
  nomeProfissional,
  nomeConvidado,
  tituloEvento,
  compareceu,
  acompanhantes,
}: NotificacaoRsvpInput): EmailTemplate {
  const conv = esc(nomeConvidado.trim());
  const evento = esc(tituloEvento.trim());
  const primeiroNome = esc(nomeProfissional.trim().split(/\s+/)[0] || nomeProfissional.trim());

  const status = compareceu ? "vai comparecer" : "não vai comparecer";
  const statusCor = compareceu ? "#0ea5a6" : "#64748b";
  const subject = compareceu
    ? `${nomeConvidado} confirmou presença em ${tituloEvento}`
    : `${nomeConvidado} não vai a ${tituloEvento}`;

  // Linha de acompanhantes so faz sentido para quem confirmou e leva gente junto.
  const linhaAcompanhantes =
    compareceu && acompanhantes > 0
      ? `<p style="margin:6px 0 0;font-size:14px;color:#334155;">
           Acompanhantes: <strong>${acompanhantes}</strong>
         </p>`
      : "";

  const corpo = `
    <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#0f172a;">
      Olá, ${primeiroNome}! Você tem uma nova resposta de RSVP.
    </p>
    <div style="margin:0 0 16px;padding:16px 18px;background:#ede9fe;border-radius:12px;">
      <p style="margin:0;font-size:15px;color:#0f172a;">
        <strong>${conv}</strong>
        <span style="color:${statusCor};font-weight:600;"> — ${status}</span>
      </p>
      <p style="margin:6px 0 0;font-size:14px;color:#334155;">
        Evento: <strong>${evento}</strong>
      </p>
      ${linhaAcompanhantes}
    </div>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
      Acompanhe todas as confirmações no painel do seu evento.
    </p>`;
  return { subject, html: layout("Nova confirmação de presença", corpo) };
}
