import { describe, it, expect } from "vitest";
import { appUrl, eventPublicUrl, protocoloDe, resolveSubdomain, slugify } from "./tenant";

const ROOT = "seuconviteia.com";

describe("resolveSubdomain", () => {
  it("extrai o subdominio de um evento", () => {
    expect(resolveSubdomain("ana.seuconviteia.com", ROOT)).toBe("ana");
  });

  it("retorna null para o dominio raiz", () => {
    expect(resolveSubdomain("seuconviteia.com", ROOT)).toBeNull();
  });

  it("retorna null para www", () => {
    expect(resolveSubdomain("www.seuconviteia.com", ROOT)).toBeNull();
  });

  it("retorna null para o reservado app", () => {
    expect(resolveSubdomain("app.seuconviteia.com", ROOT)).toBeNull();
  });

  it("retorna null para os demais reservados", () => {
    for (const r of ["api", "admin", "send"]) {
      expect(resolveSubdomain(`${r}.seuconviteia.com`, ROOT)).toBeNull();
    }
  });

  it("retorna null para um dominio externo", () => {
    expect(resolveSubdomain("ana.outrodominio.com", ROOT)).toBeNull();
  });

  it("rejeita subdominio com mais de um nivel", () => {
    expect(resolveSubdomain("a.b.seuconviteia.com", ROOT)).toBeNull();
  });

  it("retorna null para host vazio/indefinido", () => {
    expect(resolveSubdomain(null, ROOT)).toBeNull();
    expect(resolveSubdomain(undefined, ROOT)).toBeNull();
    expect(resolveSubdomain("", ROOT)).toBeNull();
  });

  it("ignora a porta no host e no root", () => {
    expect(resolveSubdomain("ana.localhost:3000", "localhost:3000")).toBe("ana");
    expect(resolveSubdomain("localhost:3000", "localhost:3000")).toBeNull();
    expect(resolveSubdomain("app.localhost:3000", "localhost:3000")).toBeNull();
  });
});

describe("slugify", () => {
  it("remove acentos", () => {
    expect(slugify("Maria Clara")).toBe("maria-clara");
    expect(slugify("Aniversario da Vovo Joao")).toBe("aniversario-da-vovo-joao");
    expect(slugify("Coracao")).toBe("coracao");
  });

  it("troca espacos e simbolos por hifen", () => {
    expect(slugify("15 anos!!!")).toBe("15-anos");
    expect(slugify("Joao & Ana")).toBe("joao-ana");
  });

  it("colapsa hifens repetidos e apara as pontas", () => {
    expect(slugify("  --Festa---Top--  ")).toBe("festa-top");
  });

  it("retorna string vazia quando nao ha caractere valido", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("")).toBe("");
  });
});

describe("eventPublicUrl", () => {
  it("usa http em dev (localhost)", () => {
    expect(eventPublicUrl("ana", "localhost:3000")).toBe(
      "http://ana.localhost:3000",
    );
  });

  it("usa https em producao", () => {
    expect(eventPublicUrl("ana", "seuconviteia.com")).toBe(
      "https://ana.seuconviteia.com",
    );
  });
});

describe("appUrl — link absoluto pro painel (app.<root>)", () => {
  it("monta caminho do painel em dev", () => {
    expect(appUrl("/cadastrar", "localhost:3000")).toBe(
      "http://app.localhost:3000/cadastrar",
    );
  });

  it("monta caminho do painel em producao", () => {
    expect(appUrl("/entrar", "seuconviteia.com")).toBe(
      "https://app.seuconviteia.com/entrar",
    );
  });

  it("sem caminho retorna a raiz do app", () => {
    expect(appUrl("", "seuconviteia.com")).toBe("https://app.seuconviteia.com");
  });

  it("normaliza caminho sem barra inicial", () => {
    expect(appUrl("cadastrar", "localhost:3000")).toBe(
      "http://app.localhost:3000/cadastrar",
    );
  });

  // Enquanto nao ha dominio proprio, o site roda em *.vercel.app, onde
  // subdominio curinga nao existe: `app.<host>.vercel.app` nao resolve e todo
  // CTA da landing morreria em erro de DNS. Ali o painel vive no mesmo host.
  it("em *.vercel.app devolve link relativo (nao ha subdominio curinga)", () => {
    expect(appUrl("/entrar", "seuconviteia.vercel.app")).toBe("/entrar");
    expect(appUrl("cadastrar", "meu-app-abc123.vercel.app")).toBe("/cadastrar");
  });

  it("em *.vercel.app sem caminho aponta para o painel", () => {
    expect(appUrl("", "seuconviteia.vercel.app")).toBe("/painel");
  });
});

describe("protocoloDe", () => {
  it("http para localhost", () => {
    expect(protocoloDe("localhost:3000")).toBe("http");
  });
  it("http para IP cru e nip.io/sslip.io (rede local)", () => {
    expect(protocoloDe("192.168.1.4:3000")).toBe("http");
    expect(protocoloDe("192.168.1.4.nip.io:3000")).toBe("http");
    expect(protocoloDe("10.0.0.2.sslip.io")).toBe("http");
  });
  it("https para dominio publico", () => {
    expect(protocoloDe("seuconviteia.com")).toBe("https");
  });
  it("eventPublicUrl usa http em rede local", () => {
    expect(eventPublicUrl("ana", "192.168.1.4.nip.io:3000")).toBe(
      "http://ana.192.168.1.4.nip.io:3000",
    );
  });
});
