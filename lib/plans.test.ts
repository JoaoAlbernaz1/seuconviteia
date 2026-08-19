import { describe, it, expect } from "vitest";
import { PLANOS_INFO, ehDowngrade, limiteEventos, podeCriarEvento, planoDoSite, planoEfetivo, planoPermite, recursosDoPlano, rotuloPlano, type Plan } from "./plans";

describe("recursosDoPlano — gating por plano (assinatura)", () => {
  it("BASICO (gratuito) -> convite COMPLETO; so marca e dominio ficam de fora", () => {
    // 17/08/2026: FestaLab, Wedy e Conviter dao RSVP, recados e album de graca.
    // Se este teste voltar a esperar `false`, alguem tirou do gratuito um
    // recurso que o mercado inteiro entrega — e perdemos na comparacao.
    expect(recursosDoPlano("BASICO")).toEqual({
      rsvp: true,
      recados: true,
      galeria: true,
      whiteLabel: false,
      dominioProprio: false,
    });
  });

  it("CLASSICO -> RSVP + recados + galeria; sem white-label/dominio", () => {
    expect(recursosDoPlano("CLASSICO")).toEqual({
      rsvp: true,
      recados: true,
      galeria: true,
      whiteLabel: false,
      dominioProprio: false,
    });
  });

  it("PREMIUM -> tudo liberado", () => {
    expect(recursosDoPlano("PREMIUM")).toEqual({
      rsvp: true,
      recados: true,
      galeria: true,
      whiteLabel: true,
      dominioProprio: true,
    });
  });
});

describe("planoPermite", () => {
  it("o gratuito permite RSVP e recados — é o convite completo", () => {
    expect(planoPermite("BASICO", "rsvp")).toBe(true);
    expect(planoPermite("BASICO", "recados")).toBe(true);
  });
  it("o que o gratuito NÃO tem é marca própria e domínio", () => {
    expect(planoPermite("BASICO", "whiteLabel")).toBe(false);
    expect(planoPermite("BASICO", "dominioProprio")).toBe(false);
  });
  it("confirmação de presença também nos pagos", () => {
    expect(planoPermite("CLASSICO", "rsvp")).toBe(true);
    expect(planoPermite("PREMIUM", "rsvp")).toBe(true);
  });
  it("white-label só no Premium", () => {
    expect(planoPermite("CLASSICO", "whiteLabel")).toBe(false);
    expect(planoPermite("PREMIUM", "whiteLabel")).toBe(true);
  });
});

describe("PLANOS_INFO / rotuloPlano", () => {
  it("tem os 3 planos com Clássico em destaque", () => {
    expect(PLANOS_INFO.map((p) => p.key)).toEqual(["BASICO", "CLASSICO", "PREMIUM"]);
    expect(PLANOS_INFO.find((p) => p.key === "CLASSICO")?.destaque).toBe(true);
  });
  it("rotuloPlano traduz", () => {
    expect(rotuloPlano("PREMIUM")).toBe("Estúdio");
  });
});

describe("escada de planos — o desenho comercial (12/08/2026)", () => {
  it("Basico limita a 1 convite; os pagos sao ilimitados", () => {
    expect(limiteEventos("BASICO")).toBe(1);
    expect(limiteEventos("CLASSICO")).toBeNull();
    expect(limiteEventos("PREMIUM")).toBeNull();
  });

  it("o plano do MEIO e o destacado (e so ele)", () => {
    const destacados = PLANOS_INFO.filter((p) => p.destaque);
    expect(destacados).toHaveLength(1);
    expect(destacados[0].key).toBe("CLASSICO");
    expect(PLANOS_INFO[1].key).toBe("CLASSICO");
  });

  it("todo plano diz a sua taxa no rodape do card", () => {
    for (const p of PLANOS_INFO) {
      expect(p.taxaLinha).toMatch(/^Taxa de \d+,\d% sobre os presentes$/);
    }
  });

  it("os cards tem o MESMO numero de itens (comparam melhor)", () => {
    const tamanhos = PLANOS_INFO.map((p) => p.inclui.length);
    expect(new Set(tamanhos).size).toBe(1);
  });

  it("preco sobe junto com o plano", () => {
    const cents = PLANOS_INFO.map((p) => p.mensalidadeCents);
    for (let i = 1; i < cents.length; i++) expect(cents[i]).toBeGreaterThan(cents[i - 1]);
  });
});

/**
 * O plano EFETIVO é derivado na leitura, e não rebaixado por cron: assim não
 * existe janela em que a linha diz PREMIUM e o direito já venceu.
 */
describe("planoEfetivo — o plano vale enquanto estiver pago", () => {
  const AGORA = new Date("2026-08-17T12:00:00Z");

  it("autorizado e dentro do prazo mantém o plano pago", () => {
    expect(
      planoEfetivo(
        { plan: "PREMIUM", assinaturaStatus: "authorized", assinaturaAte: new Date("2026-09-17T12:00:00Z") },
        AGORA,
      ),
    ).toBe("PREMIUM");
  });

  it("cancelado, mas dentro do prazo já pago, MANTÉM o plano", () => {
    // Quem cancelou já pagou o mês corrente — cortar na hora seria tomar o que
    // a pessoa comprou.
    expect(
      planoEfetivo(
        { plan: "PREMIUM", assinaturaStatus: "cancelled", assinaturaAte: new Date("2026-09-17T12:00:00Z") },
        AGORA,
      ),
    ).toBe("PREMIUM");
  });

  it("prazo vencido cai para Básico, mesmo com PREMIUM gravado na linha", () => {
    expect(
      planoEfetivo(
        { plan: "PREMIUM", assinaturaStatus: "authorized", assinaturaAte: new Date("2026-08-01T12:00:00Z") },
        AGORA,
      ),
    ).toBe("BASICO");
  });

  it("sem assinatura nenhuma é Básico", () => {
    expect(planoEfetivo({ plan: "PREMIUM", assinaturaStatus: null, assinaturaAte: null }, AGORA)).toBe("BASICO");
  });

  it("Básico nunca depende de assinatura", () => {
    expect(planoEfetivo({ plan: "BASICO", assinaturaStatus: null, assinaturaAte: null }, AGORA)).toBe("BASICO");
  });
});

describe("ehDowngrade", () => {
  it("descer de plano é downgrade (inclui cancelar para o Básico)", () => {
    expect(ehDowngrade("PREMIUM", "BASICO")).toBe(true);
    expect(ehDowngrade("PREMIUM", "CLASSICO")).toBe(true);
    expect(ehDowngrade("CLASSICO", "BASICO")).toBe(true);
  });

  it("subir e ficar no mesmo não são", () => {
    expect(ehDowngrade("BASICO", "PREMIUM")).toBe(false);
    expect(ehDowngrade("BASICO", "CLASSICO")).toBe(false);
    expect(ehDowngrade("CLASSICO", "CLASSICO")).toBe(false);
  });
});

describe("planoDoSite — o convite fica no ar; o que muda é o que ele tem", () => {
  const AGORA = new Date("2026-08-17T12:00:00Z");
  const conta = (plan: Plan, ate: string | null) => ({
    plan,
    assinaturaStatus: "authorized",
    assinaturaAte: ate ? new Date(ate) : null,
  });

  it("assinatura ativa manda no site, mesmo que o convite tenha nascido no grátis", () => {
    expect(
      planoDoSite({ plan: "BASICO", professional: conta("PREMIUM", "2026-12-01T00:00:00Z") }, AGORA),
    ).toBe("PREMIUM");
  });

  it("assinatura vencida derruba o convite para o gratuito — é o vazamento fechado", () => {
    // Publicou no teste, cancelou no 6º dia: o convite continua no ar, mas
    // volta a ser o grátis (com a nossa marca), não fica Premium para sempre.
    expect(
      planoDoSite({ plan: "PREMIUM", professional: conta("PREMIUM", "2026-08-01T00:00:00Z") }, AGORA),
    ).toBe("BASICO");
  });

  it("sem a conta carregada, respeita o que está gravado no convite", () => {
    expect(planoDoSite({ plan: "PREMIUM" }, AGORA)).toBe("PREMIUM");
  });
});

describe("podeCriarEvento", () => {
  it("Basico: um convite e so", () => {
    expect(podeCriarEvento("BASICO", 0)).toBe(true);
    expect(podeCriarEvento("BASICO", 1)).toBe(false);
    expect(podeCriarEvento("BASICO", 5)).toBe(false);
  });
  it("planos pagos nao tem teto", () => {
    expect(podeCriarEvento("CLASSICO", 99)).toBe(true);
    expect(podeCriarEvento("PREMIUM", 99)).toBe(true);
  });
});
