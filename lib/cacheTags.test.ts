import { describe, expect, it } from "vitest";
import { tagEvento, tagRecados } from "./cacheTags";

describe("tagEvento", () => {
  it("prefixa com evento: e usa o subdominio", () => {
    expect(tagEvento("maria-clara")).toBe("evento:maria-clara");
  });

  it("nao colide com a tag de recados", () => {
    expect(tagEvento("abc")).not.toBe(tagRecados("abc"));
  });
});

describe("tagRecados", () => {
  it("prefixa com recados: e usa o eventId", () => {
    expect(tagRecados("ckv123")).toBe("recados:ckv123");
  });
});
