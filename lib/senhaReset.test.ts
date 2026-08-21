import { describe, it, expect } from "vitest";
import {
  VALIDADE_MINUTOS,
  avaliarPedido,
  emailDeRedefinicao,
  expiraEm,
  gerarToken,
  hashDoToken,
  linkDeRedefinicao,
  textoDaRecusa,
} from "./senhaReset";

describe("gerarToken", () => {
  it("nao repete e nao vaza o token no que vai para o banco", () => {
    const a = gerarToken();
    const b = gerarToken();
    expect(a.token).not.toBe(b.token);
    // 32 bytes em base64url: 43 caracteres, sem `=`, sem `+`, sem `/`.
    expect(a.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    // O que vai para o banco NAO contem o token — e o ponto todo do hash.
    expect(a.tokenHash).not.toContain(a.token);
    expect(a.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("o hash e deterministico: e por ele que o link e encontrado", () => {
    const { token, tokenHash } = gerarToken();
    expect(hashDoToken(token)).toBe(tokenHash);
    expect(hashDoToken(`${token}x`)).not.toBe(tokenHash);
  });
});

describe("avaliarPedido", () => {
  const agora = new Date("2026-08-21T12:00:00Z");

  it("aceita pedido novo e nao usado", () => {
    expect(avaliarPedido({ expiresAt: expiraEm(agora), usedAt: null }, agora)).toEqual({ ok: true });
  });

  it("recusa link que nao existe (adulterado ou apagado)", () => {
    expect(avaliarPedido(null, agora)).toEqual({ ok: false, motivo: "inexistente" });
  });

  it("recusa link expirado — inclusive no segundo exato do vencimento", () => {
    const vencido = { expiresAt: new Date(agora.getTime() - 1), usedAt: null };
    expect(avaliarPedido(vencido, agora)).toEqual({ ok: false, motivo: "expirado" });
    // Fronteira: `<=` e nao `<`, senao o instante do vencimento ainda passava.
    const exato = { expiresAt: new Date(agora), usedAt: null };
    expect(avaliarPedido(exato, agora)).toEqual({ ok: false, motivo: "expirado" });
  });

  it("USADO vence EXPIRADO na explicacao", () => {
    // Link usado e depois vencido: a frase que importa e "ja foi usado" — ela
    // avisa a pessoa de que a senha pode ter sido trocada por outro alguem.
    const usadoEVencido = {
      expiresAt: new Date(agora.getTime() - 60_000),
      usedAt: new Date(agora.getTime() - 120_000),
    };
    expect(avaliarPedido(usadoEVencido, agora)).toEqual({ ok: false, motivo: "usado" });
  });

  it("a validade e de uma hora", () => {
    expect(VALIDADE_MINUTOS).toBe(60);
    expect(expiraEm(agora).getTime() - agora.getTime()).toBe(60 * 60_000);
  });
});

describe("textoDaRecusa", () => {
  it("cada recusa diz o que fazer em seguida", () => {
    expect(textoDaRecusa("expirado")).toMatch(/Peça um novo/i);
    expect(textoDaRecusa("usado")).toMatch(/já foi usado/i);
    expect(textoDaRecusa("inexistente")).toMatch(/não é válido/i);
  });
});

describe("linkDeRedefinicao", () => {
  it("leva o token codificado", () => {
    expect(linkDeRedefinicao("https://app.seuconvite.orivya.com.br", "abc-_123")).toBe(
      "https://app.seuconvite.orivya.com.br/entrar/senha/nova?token=abc-_123",
    );
    // Token estranho nao pode virar outro caminho nem outro parametro.
    expect(linkDeRedefinicao("https://x.com", "a/b&c=d")).toBe(
      "https://x.com/entrar/senha/nova?token=a%2Fb%26c%3Dd",
    );
  });
});

describe("emailDeRedefinicao", () => {
  it("chama a pessoa pelo primeiro nome e leva o link", () => {
    const { subject, html } = emailDeRedefinicao("Maria Clara Souza", "https://x.com/l?token=t");
    expect(subject).toContain("Redefinir");
    expect(html).toContain("Oi, Maria!");
    expect(html).toContain("https://x.com/l?token=t");
    // Diz o que fazer quem NAO pediu — e o unico aviso que importa para a vitima
    // de um pedido alheio.
    expect(html).toMatch(/Se não foi você/i);
  });

  it("sem nome, nao manda 'Oi, undefined'", () => {
    expect(emailDeRedefinicao("   ", "https://x.com/l").html).toContain("Oi, Olá!");
  });
});
