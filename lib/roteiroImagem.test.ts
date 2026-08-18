import { describe, expect, it } from "vitest";
import {
  descricaoSegura,
  pedidoAoRoteirista,
  promptDaImagem,
  promptDeReserva,
} from "./roteiroImagem";

describe("descricaoSegura", () => {
  it("tira aspas, quebras de linha e espaço sobrando", () => {
    expect(descricaoSegura('  "Silver high heels on a ballroom floor."\n\n')).toBe(
      "Silver high heels on a ballroom floor.",
    );
  });

  it("resposta vazia, curta ou ausente cai na reserva", () => {
    expect(descricaoSegura("")).toBeNull();
    expect(descricaoSegura("   ")).toBeNull();
    expect(descricaoSegura("ok")).toBeNull();
    expect(descricaoSegura(null)).toBeNull();
    expect(descricaoSegura(undefined)).toBeNull();
  });

  it("corta resposta gigante", () => {
    expect(descricaoSegura("a".repeat(2000))?.length).toBe(600);
  });
});

describe("pedidoAoRoteirista", () => {
  it("leva o nome do presente como a pessoa escreveu", () => {
    expect(pedidoAoRoteirista("Valsa da debutante")).toContain('"Valsa da debutante"');
  });

  it("leva a cor do convite quando existe, e nada quando não existe", () => {
    expect(pedidoAoRoteirista("Buffet", "#CE578B")).toContain("#CE578B");
    expect(pedidoAoRoteirista("Buffet")).not.toContain("Paleta");
  });

  it("leva a descrição escrita pela pessoa — é o melhor contexto que existe", () => {
    const p = pedidoAoRoteirista("Cota da festa", "#CE578B", "ajude com o buffet da noite");
    expect(p).toContain("ajude com o buffet da noite");
  });

  it("descrição vazia ou só espaço não vira ruído no pedido", () => {
    expect(pedidoAoRoteirista("Buffet", undefined, "   ")).not.toContain("descreveu");
    expect(pedidoAoRoteirista("Buffet")).not.toContain("descreveu");
  });
});

describe("prompts de imagem", () => {
  it("o pedido final proíbe texto, logo e rosto", () => {
    const p = promptDaImagem("Silver high heels on a ballroom floor.");
    expect(p).toContain("Silver high heels");
    expect(p).toMatch(/no text/);
    expect(p).toMatch(/no logos/);
    expect(p).toMatch(/no identifiable faces/);
  });

  it("a reserva ainda cita o presente pelo nome", () => {
    expect(promptDeReserva("Valsa da debutante")).toContain("Valsa da debutante");
  });
});
