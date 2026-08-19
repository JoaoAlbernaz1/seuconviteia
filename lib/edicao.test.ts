import { describe, it, expect } from "vitest";
import {
  CORTESIA_MINUTOS,
  PASSE_HORAS,
  PASSE_PRECO_CENTS,
  edicaoAberta,
  enderecoTravado,
  fimDaCortesia,
  fimDoPasse,
  passesIncluidos,
  temPasseIncluido,
} from "./edicao";

const agora = new Date("2026-08-18T12:00:00Z");
const festaAdiante = new Date("2030-01-01T00:00:00Z");

describe("edicaoAberta", () => {
  it("rascunho edita sempre", () => {
    expect(
      edicaoAberta({ status: "DRAFT", expiresAt: festaAdiante, edicaoAte: null }, agora),
    ).toBe(true);
  });

  it("rascunho com data vencida ainda edita (e onde se conserta a data)", () => {
    const festaOntem = new Date("2026-08-17T12:00:00Z");
    expect(
      edicaoAberta({ status: "DRAFT", expiresAt: festaOntem, edicaoAte: null }, agora),
    ).toBe(true);
  });

  it("publicado sem janela nao edita", () => {
    expect(
      edicaoAberta(
        { status: "PUBLISHED", expiresAt: festaAdiante, edicaoAte: null },
        agora,
      ),
    ).toBe(false);
  });

  it("publicado com janela vencida nao edita", () => {
    const ontem = new Date("2026-08-17T12:00:00Z");
    expect(
      edicaoAberta(
        { status: "PUBLISHED", expiresAt: festaAdiante, edicaoAte: ontem },
        agora,
      ),
    ).toBe(false);
  });

  it("publicado com janela aberta edita", () => {
    const daqui = new Date("2026-08-18T12:30:00Z");
    expect(
      edicaoAberta(
        { status: "PUBLISHED", expiresAt: festaAdiante, edicaoAte: daqui },
        agora,
      ),
    ).toBe(true);
  });

  it("convite expirado nao edita nem com janela aberta", () => {
    const daqui = new Date("2026-08-18T12:30:00Z");
    expect(
      edicaoAberta(
        { status: "EXPIRED", expiresAt: festaAdiante, edicaoAte: daqui },
        agora,
      ),
    ).toBe(false);
  });

  it("festa que ja passou nao edita nem com janela aberta", () => {
    const daqui = new Date("2026-08-18T12:30:00Z");
    const festaOntem = new Date("2026-08-17T12:00:00Z");
    expect(
      edicaoAberta(
        { status: "PUBLISHED", expiresAt: festaOntem, edicaoAte: daqui },
        agora,
      ),
    ).toBe(false);
  });

  it("janela que termina AGORA ja esta fechada", () => {
    expect(
      edicaoAberta(
        { status: "PUBLISHED", expiresAt: festaAdiante, edicaoAte: agora },
        agora,
      ),
    ).toBe(false);
  });
});

describe("janelas", () => {
  it("cortesia dura 60 minutos", () => {
    expect(CORTESIA_MINUTOS).toBe(60);
    expect(fimDaCortesia(agora).toISOString()).toBe("2026-08-18T13:00:00.000Z");
  });

  it("passe dura 48 horas e custa R$ 19,90", () => {
    expect(PASSE_HORAS).toBe(48);
    expect(PASSE_PRECO_CENTS).toBe(1990);
    expect(fimDoPasse(agora).toISOString()).toBe("2026-08-20T12:00:00.000Z");
  });
});

describe("cota incluida no plano", () => {
  it("Basico nao tem liberacao incluida", () => {
    expect(passesIncluidos("BASICO")).toBe(0);
    expect(temPasseIncluido("BASICO", 0)).toBe(false);
  });

  it("Profissional tem 1 por convite", () => {
    expect(passesIncluidos("CLASSICO")).toBe(1);
    expect(temPasseIncluido("CLASSICO", 0)).toBe(true);
    expect(temPasseIncluido("CLASSICO", 1)).toBe(false);
  });

  it("Estudio tem 3 por convite", () => {
    expect(passesIncluidos("PREMIUM")).toBe(3);
    expect(temPasseIncluido("PREMIUM", 2)).toBe(true);
    expect(temPasseIncluido("PREMIUM", 3)).toBe(false);
  });
});

describe("enderecoTravado", () => {
  const publicado = new Date("2026-08-01T12:00:00Z");

  it("rascunho que nunca foi ao ar NAO trava (o servidor ainda sorteia o endereco)", () => {
    expect(enderecoTravado({ status: "DRAFT", publishedAt: null })).toBe(false);
  });

  it("trava depois da primeira publicacao", () => {
    expect(enderecoTravado({ status: "PUBLISHED", publishedAt: publicado })).toBe(true);
  });

  it("convite legado (publicado sem publishedAt) trava — o link ja esta com os convidados", () => {
    expect(enderecoTravado({ status: "PUBLISHED", publishedAt: null })).toBe(true);
  });

  it("um 'despublicar' que volte para DRAFT nao destrava o que ja foi ao ar", () => {
    expect(enderecoTravado({ status: "DRAFT", publishedAt: publicado })).toBe(true);
  });

  it("responde o OPOSTO de 'primeira publicacao' — e a regra que a action usa", () => {
    const casos = [
      { status: "DRAFT", publishedAt: null },
      { status: "PUBLISHED", publishedAt: publicado },
      { status: "PUBLISHED", publishedAt: null },
      { status: "DRAFT", publishedAt: publicado },
    ] as const;
    for (const ev of casos) {
      const primeiraPublicacao = ev.status !== "PUBLISHED" && ev.publishedAt === null;
      expect(enderecoTravado(ev)).toBe(!primeiraPublicacao);
    }
  });
});
