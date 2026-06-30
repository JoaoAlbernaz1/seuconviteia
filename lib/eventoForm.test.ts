import { describe, it, expect } from "vitest";
import {
  brlParaCents,
  parseProgramacao,
  parsePresentes,
  parseFotos,
  montarMapsUrls,
  semUndefined,
  TEMA_KEYS,
} from "./eventoForm";

describe("brlParaCents", () => {
  it("converte formato pt-BR com virgula decimal", () => {
    expect(brlParaCents("150,00")).toBe(15000);
    expect(brlParaCents("90,50")).toBe(9050);
  });

  it("trata ponto como milhar quando ha virgula decimal", () => {
    expect(brlParaCents("1.250,50")).toBe(125050);
    expect(brlParaCents("1.000,00")).toBe(100000);
  });

  it("aceita inteiro sem separadores", () => {
    expect(brlParaCents("150")).toBe(15000);
    expect(brlParaCents("0")).toBe(0);
  });

  it("trata ponto sozinho como decimal", () => {
    expect(brlParaCents("150.5")).toBe(15050);
  });

  it("ignora prefixo R$ e espacos", () => {
    expect(brlParaCents("R$ 90,00")).toBe(9000);
    expect(brlParaCents("  120,00  ")).toBe(12000);
  });

  it("retorna null para vazio / invalido / negativo", () => {
    expect(brlParaCents("")).toBeNull();
    expect(brlParaCents("   ")).toBeNull();
    expect(brlParaCents(null)).toBeNull();
    expect(brlParaCents(undefined)).toBeNull();
    expect(brlParaCents("abc")).toBeNull();
    expect(brlParaCents("-5")).toBeNull();
  });
});

describe("parseProgramacao", () => {
  it("faz o zip das colunas paralelas", () => {
    expect(
      parseProgramacao(["20h30", "22h00"], ["Recepção", "Jantar"]),
    ).toEqual([
      { hora: "20h30", titulo: "Recepção" },
      { hora: "22h00", titulo: "Jantar" },
    ]);
  });

  it("descarta linhas totalmente vazias e faz trim", () => {
    expect(
      parseProgramacao([" 20h ", "", "  "], [" Recepção ", "", ""]),
    ).toEqual([{ hora: "20h", titulo: "Recepção" }]);
  });

  it("mantem a linha quando so a hora OU so o titulo esta preenchido", () => {
    expect(parseProgramacao(["20h", ""], ["", "Valsa"])).toEqual([
      { hora: "20h", titulo: "" },
      { hora: "", titulo: "Valsa" },
    ]);
  });

  it("tolera arrays de tamanhos diferentes", () => {
    expect(parseProgramacao(["20h"], [])).toEqual([{ hora: "20h", titulo: "" }]);
  });
});

describe("parsePresentes", () => {
  it("zipa titulo/descricao/valor e converte o valor para centavos", () => {
    expect(
      parsePresentes(
        ["Cota da festa", "Vale look"],
        ["Contribua via Pix", ""],
        ["150,00", "120"],
      ),
    ).toEqual([
      { titulo: "Cota da festa", descricao: "Contribua via Pix", valorCents: 15000 },
      { titulo: "Vale look", descricao: undefined, valorCents: 12000 },
    ]);
  });

  it("descarta itens sem titulo", () => {
    expect(parsePresentes(["", "Perfume"], ["x", ""], ["10", "250,00"])).toEqual([
      { titulo: "Perfume", descricao: undefined, valorCents: 25000 },
    ]);
  });

  it("deixa valorCents undefined quando o valor e vazio/invalido", () => {
    expect(parsePresentes(["Presente"], [""], [""])).toEqual([
      { titulo: "Presente", descricao: undefined, valorCents: undefined },
    ]);
  });
});

describe("parseFotos", () => {
  it("apara, descarta vazios e mantem a ordem", () => {
    expect(
      parseFotos(["/uploads/a.jpg", "  ", " /uploads/b.png ", ""]),
    ).toEqual(["/uploads/a.jpg", "/uploads/b.png"]);
  });

  it("aceita caminhos / e URLs http(s); rejeita o resto", () => {
    expect(
      parseFotos(["/uploads/a.jpg", "https://x.com/b.png", "javascript:alert(1)", "ftp://x"]),
    ).toEqual(["/uploads/a.jpg", "https://x.com/b.png"]);
  });

  it("deduplica preservando a primeira ocorrencia", () => {
    expect(parseFotos(["/a.jpg", "/b.jpg", "/a.jpg"])).toEqual([
      "/a.jpg",
      "/b.jpg",
    ]);
  });

  it("respeita o limite maximo", () => {
    const urls = Array.from({ length: 5 }, (_, i) => `/u${i}.jpg`);
    expect(parseFotos(urls, 3)).toEqual(["/u0.jpg", "/u1.jpg", "/u2.jpg"]);
  });
});

describe("montarMapsUrls", () => {
  it("deriva os dois links do local + endereco", () => {
    const { mapsUrl, mapsEmbedUrl } = montarMapsUrls(
      "Espaço Esplendor",
      "Park Way, Brasília",
    );
    const enc = encodeURIComponent("Espaço Esplendor, Park Way, Brasília");
    expect(mapsUrl).toBe(
      `https://www.google.com/maps/search/?api=1&query=${enc}`,
    );
    expect(mapsEmbedUrl).toBe(
      `https://www.google.com/maps?q=${enc}&output=embed`,
    );
  });

  it("usa so o campo preenchido quando o outro esta vazio", () => {
    const { mapsUrl } = montarMapsUrls("Espaço Esplendor", "");
    expect(mapsUrl).toContain(encodeURIComponent("Espaço Esplendor"));
  });

  it("retorna objeto vazio sem local nem endereco", () => {
    expect(montarMapsUrls("", "")).toEqual({});
    expect(montarMapsUrls(undefined, null)).toEqual({});
  });
});

describe("semUndefined", () => {
  it("remove apenas as chaves undefined", () => {
    expect(semUndefined({ a: 1, b: undefined, c: "", d: null })).toEqual({
      a: 1,
      c: "",
      d: null,
    });
  });
});

describe("TEMA_KEYS", () => {
  it("expoe as 6 paletas conhecidas", () => {
    expect(TEMA_KEYS).toEqual(
      expect.arrayContaining([
        "rose",
        "dourado",
        "azul",
        "lavanda",
        "verde",
        "terracota",
      ]),
    );
    expect(TEMA_KEYS).toHaveLength(6);
  });
});
