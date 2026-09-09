import { describe, expect, it } from "vitest";
import {
  isEventSlugAvailable,
  normalizeEventSlugInput,
  resolveEventSlug,
  validateEventSlug,
  withEventSlug,
} from "./slug";
import { createDefaultEventDocument } from "./document";

describe("endereço do evento", () => {
  it("aceita um slug minúsculo como theohenrique", () => {
    expect(validateEventSlug("theohenrique")).toEqual({ ok: true, slug: "theohenrique" });
  });

  it("normaliza o texto digitado sem acentos, espaços ou letras maiúsculas", () => {
    expect(normalizeEventSlugInput("  Thé o Henrique  ")).toBe("theohenrique");
  });

  it("rejeita slug curto, reservado e com formato inválido", () => {
    expect(validateEventSlug("abc")).toMatchObject({ ok: false, kind: "too_short" });
    expect(validateEventSlug("admin")).toMatchObject({ ok: false, kind: "reserved" });
    expect(validateEventSlug("-theo-")).toMatchObject({ ok: false, kind: "invalid_format" });
    expect(validateEventSlug("Theo Henrique")).toMatchObject({ ok: false, kind: "invalid_format" });
  });

  it("permite o slug atual e bloqueia o slug de outro convite", () => {
    const ocupados = new Set(["theohenrique", "maria15"]);

    expect(isEventSlugAvailable("theohenrique", "theohenrique", ocupados)).toBe(true);
    expect(isEventSlugAvailable("maria15", "theohenrique", ocupados)).toBe(false);
    expect(isEventSlugAvailable("novo-convite", "theohenrique", ocupados)).toBe(true);
  });

  it("resolve o slug solicitado sem criar um sufixo inesperado", async () => {
    await expect(resolveEventSlug("theohenrique", "teste-7", async () => false)).resolves.toEqual({
      ok: true,
      slug: "theohenrique",
    });
    await expect(resolveEventSlug("teste-7", "teste-7", async () => true)).resolves.toEqual({
      ok: true,
      slug: "teste-7",
    });
    await expect(resolveEventSlug("maria15", "teste-7", async () => true)).resolves.toMatchObject({
      ok: false,
      kind: "taken",
    });
  });

  it("atualiza somente o slug do documento quando a criação precisa de um sufixo", () => {
    const document = createDefaultEventDocument({ basic: { name: "Theo", slug: "teste", eventType: "QUINZE_ANOS" } });
    const updated = withEventSlug(document, "teste-2");

    expect(updated.basic.slug).toBe("teste-2");
    expect(updated.content).toEqual(document.content);
    expect(document.basic.slug).toBe("teste");
  });
});
