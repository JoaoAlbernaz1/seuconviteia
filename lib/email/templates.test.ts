import { describe, it, expect } from "vitest";
import { emailBoasVindas, emailNotificacaoRsvp } from "./templates";

describe("emailBoasVindas", () => {
  it("sauda pelo primeiro nome e traz o link do painel", () => {
    const { subject, html } = emailBoasVindas({
      nome: "Joao Victor",
      painelUrl: "https://app.seuconviteia.com/painel",
    });
    expect(subject).toContain("SeuConvite IA");
    expect(html).toContain("Joao");
    expect(html).toContain("https://app.seuconviteia.com/painel");
  });
});

describe("emailNotificacaoRsvp", () => {
  it("confirmado: nome, evento, status e acompanhantes", () => {
    const { subject, html } = emailNotificacaoRsvp({
      nomeProfissional: "Ana",
      nomeConvidado: "Maria Clara",
      tituloEvento: "Bodas de Prata",
      compareceu: true,
      acompanhantes: 2,
    });
    expect(subject).toContain("Maria Clara");
    expect(subject).toContain("Bodas de Prata");
    expect(html).toContain("Maria Clara");
    expect(html).toContain("Bodas de Prata");
    expect(html).toContain("vai comparecer");
    expect(html).toContain("Acompanhantes:");
    expect(html).toContain("<strong>2</strong>");
  });

  it("recusado: status 'nao vai' e sem linha de acompanhantes", () => {
    const { subject, html } = emailNotificacaoRsvp({
      nomeProfissional: "Ana",
      nomeConvidado: "Pedro",
      tituloEvento: "Festa",
      compareceu: false,
      acompanhantes: 0,
    });
    expect(subject).toContain("não vai");
    expect(html).toContain("não vai comparecer");
    expect(html).not.toContain("Acompanhantes:");
  });

  it("escapa HTML vindo do input (nome do convidado)", () => {
    const { html } = emailNotificacaoRsvp({
      nomeProfissional: "Ana",
      nomeConvidado: "<b>hack</b>",
      tituloEvento: "Festa",
      compareceu: true,
      acompanhantes: 0,
    });
    expect(html).not.toContain("<b>hack</b>");
    expect(html).toContain("&lt;b&gt;hack&lt;/b&gt;");
  });
});
