import { describe, it, expect, vi, afterEach } from "vitest";
import {
  escolherProvider,
  StubEmailProvider,
  ResendEmailProvider,
  formatarEndereco,
  enviarEmail,
} from "./index";

describe("escolherProvider — selecao LAZY por env", () => {
  it("sem RESEND_API_KEY -> Stub (dev roda sem chave)", () => {
    expect(escolherProvider({})).toBeInstanceOf(StubEmailProvider);
  });

  it("com RESEND_API_KEY -> Resend real", () => {
    const p = escolherProvider({ RESEND_API_KEY: "re_x", EMAIL_FROM: "a@b.com" });
    expect(p).toBeInstanceOf(ResendEmailProvider);
  });

  it("chave so com espacos cai no Stub (nao vale como chave)", () => {
    expect(escolherProvider({ RESEND_API_KEY: "   " })).toBeInstanceOf(StubEmailProvider);
  });
});

describe("formatarEndereco — From com nome de exibicao", () => {
  it("com nome -> 'Nome <email>'", () => {
    expect(formatarEndereco("no-reply@x.com", "Estudio Fulano")).toBe(
      "Estudio Fulano <no-reply@x.com>",
    );
  });

  it("sem nome -> so o endereco", () => {
    expect(formatarEndereco("no-reply@x.com")).toBe("no-reply@x.com");
  });
});

describe("enviarEmail — nunca propaga erro (protege o fluxo que chamou)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
  });

  it("resolve mesmo se o provider falhar (fetch rejeita)", async () => {
    process.env.RESEND_API_KEY = "re_test";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("rede caiu")));

    await expect(
      enviarEmail({ to: "x@y.com", subject: "s", html: "<p>h</p>" }),
    ).resolves.toBeUndefined();
  });
});
