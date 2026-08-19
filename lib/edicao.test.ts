import { describe, it, expect } from "vitest";
import {
  CORTESIA_MINUTOS,
  PASSE_HORAS,
  PASSE_PRECO_CENTS,
  edicaoAberta,
  fimDaCortesia,
  fimDoPasse,
  passesIncluidos,
  temPasseIncluido,
} from "./edicao";

const agora = new Date("2026-08-18T12:00:00Z");

describe("edicaoAberta", () => {
  it("rascunho edita sempre", () => {
    expect(edicaoAberta({ status: "DRAFT", edicaoAte: null }, agora)).toBe(true);
  });

  it("publicado sem janela nao edita", () => {
    expect(edicaoAberta({ status: "PUBLISHED", edicaoAte: null }, agora)).toBe(false);
  });

  it("publicado com janela vencida nao edita", () => {
    const ontem = new Date("2026-08-17T12:00:00Z");
    expect(edicaoAberta({ status: "PUBLISHED", edicaoAte: ontem }, agora)).toBe(false);
  });

  it("publicado com janela aberta edita", () => {
    const daqui = new Date("2026-08-18T12:30:00Z");
    expect(edicaoAberta({ status: "PUBLISHED", edicaoAte: daqui }, agora)).toBe(true);
  });

  it("convite expirado nao edita nem com janela aberta", () => {
    const daqui = new Date("2026-08-18T12:30:00Z");
    expect(edicaoAberta({ status: "EXPIRED", edicaoAte: daqui }, agora)).toBe(false);
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
