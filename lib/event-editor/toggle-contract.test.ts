import { describe, expect, it } from "vitest";
import { createDefaultEventDocument } from "./document";
import { toggleSection, updateField } from "./state";
import { TOGGLE_REGISTRY } from "./registry";

describe("contrato central dos toggles do editor", () => {
  it("registra todos os toggles existentes que afetam o convite", () => {
    expect(TOGGLE_REGISTRY.map((toggle) => toggle.id)).toEqual([
      "cover.desktopImage",
      "cover.monogram",
      "content.parents",
      "content.dressCode",
      "schedule.program",
      "rsvp",
      "rsvp.companions",
      "gifts",
      "gifts.freeContribution",
      "pix",
      "gallery",
      "messages",
      "footer",
      "appearance.bold",
      "appearance.overlay",
      "appearance.animations",
    ]);
  });

  for (const toggle of TOGGLE_REGISTRY) {
    it(`${toggle.id}: preserva a configuração em três ciclos OFF → ON`, () => {
      let document = createDefaultEventDocument();
      document = updateField(document, toggle.configurationProbe.path, toggle.configurationProbe.value);

      for (let cycle = 0; cycle < 3; cycle += 1) {
        document = toggleSection(document, toggle.id, false);
        expect(toggle.readEnabled(document)).toBe(false);
        expect(toggle.configurationProbe.read(document)).toEqual(toggle.configurationProbe.value);

        document = toggleSection(document, toggle.id, true);
        expect(toggle.readEnabled(document)).toBe(true);
        expect(toggle.configurationProbe.read(document)).toEqual(toggle.configurationProbe.value);
      }
    });
  }
});
