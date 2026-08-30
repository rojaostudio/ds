import { describe, it, expect } from "vitest";
import { generateTheme } from "../generateTheme";
import type { BrandDef } from "../../tokens/recipe.schema";

const base: BrandDef = {
  name: "t",
  archetype: "chromatic",
  brand: { primary: "ocean-700" },
  surface: "neutral",
  text: "neutral",
  fonts: { body: "inter" },
};

describe("generateTheme — paletas custom", () => {
  it("não emite --color-* quando não há palettes", () => {
    const def: BrandDef = { ...base, brand: { primary: "teal-500" } };
    const { light } = generateTheme(def);
    expect(Object.keys(light).some((k) => k.startsWith("--color-"))).toBe(false);
  });

  it("emite a escala 50–900 de cada paleta custom (buildScale)", () => {
    const def: BrandDef = { ...base, palettes: { ocean: "#1a73e8" } };
    const { light } = generateTheme(def);
    // 10 steps emitidos
    for (const s of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
      expect(light[`--color-ocean-${s}`]).toMatch(/^#[0-9a-f]{6}$/i);
    }
    // a cor original é cravada em algum step
    const values = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((s) => light[`--color-ocean-${s}`].toLowerCase());
    expect(values).toContain("#1a73e8");
  });

  it("emite a escala completa (curada) como-está, sem buildScale", () => {
    const def: BrandDef = { ...base, palettes: { coal: { "50": "#eeeeee", "700": "#232833", "900": "#0f1115" } } };
    const { light } = generateTheme(def);
    expect(light["--color-coal-50"]).toBe("#eeeeee");
    expect(light["--color-coal-700"]).toBe("#232833");
    expect(light["--color-coal-900"]).toBe("#0f1115");
  });

  it("ignora hex inválido", () => {
    const def: BrandDef = { ...base, palettes: { bad: "nope" } };
    const { light } = generateTheme(def);
    expect(Object.keys(light).some((k) => k.startsWith("--color-bad-"))).toBe(false);
  });
});
