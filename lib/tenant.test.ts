import { afterEach, describe, it, expect } from "vitest";
import { appUrl, eventPublicUrl, protocoloDe, resolveSubdomain, rootDomain, slugify } from "./tenant";

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

describe("appUrl — o painel vive no mesmo host da landing", () => {
  // Decisao do dono: sem subdominio `app.`. O link e sempre relativo, o que
  // tambem evita o bug antigo de apontar para um host que nao existe.
  it("devolve caminho relativo, seja qual for o dominio", () => {
    expect(appUrl("/entrar", "seuconvite.orivya.com.br")).toBe("/entrar");
    expect(appUrl("/cadastrar", "localhost:3000")).toBe("/cadastrar");
    expect(appUrl("/entrar", "seuconviteia.vercel.app")).toBe("/entrar");
  });

  it("normaliza caminho sem barra inicial", () => {
    expect(appUrl("cadastrar", "localhost:3000")).toBe("/cadastrar");
  });

  it("sem caminho aponta para o painel", () => {
    expect(appUrl("", "seuconvite.orivya.com.br")).toBe("/painel");
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

describe("rootDomain — apara o que a env var traz de sujeira", () => {
  const original = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    else process.env.NEXT_PUBLIC_ROOT_DOMAIN = original;
  });

  it("tira a quebra de linha que o `echo | vercel env add` deixa", () => {
    // Este \n derrubou TODO o checkout: a URL de retorno virava
    // "https://dominio\n/painel/plano" e o Mercado Pago recusava.
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = "seuconvite.orivya.com.br\n";
    expect(rootDomain()).toBe("seuconvite.orivya.com.br");
    expect(`https://${rootDomain()}/painel/plano`).toBe(
      "https://seuconvite.orivya.com.br/painel/plano",
    );
  });

  it("espaços em volta também somem", () => {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = "  exemplo.com  ";
    expect(rootDomain()).toBe("exemplo.com");
  });

  it("vazia ou só espaço cai no padrão de dev", () => {
    process.env.NEXT_PUBLIC_ROOT_DOMAIN = "   ";
    expect(rootDomain()).toBe("localhost:3000");
    delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    expect(rootDomain()).toBe("localhost:3000");
  });
});
