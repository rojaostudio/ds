import { describe, it, expect } from "vitest";
import { generateTheme } from "../generateTheme";
import { contrastRatio } from "../scale";
import type { BrandDef } from "../../tokens/recipe.schema";

const base: BrandDef = {
  name: "custom",
  archetype: "chromatic",
  brand: { primary: "#d4476a" }, // hex, sem hover nem onPrimary
  surface: "neutral",
  text: "neutral",
  fonts: { body: "inter" },
};

describe("generateTheme — cor de marca custom (hex)", () => {
  it("emite a cor exata em --brand-primary", () => {
    expect(generateTheme(base).light["--brand-primary"]).toBe("#d4476a");
  });

  it("deriva on-primary com contraste AA quando o recipe não traz", () => {
    const on = generateTheme(base).light["--brand-on-primary"];
    expect(on).toMatch(/^#[0-9a-f]{6}$/);
    expect(contrastRatio("#d4476a", on)).toBeGreaterThanOrEqual(4.5);
  });

  it("deriva hover (tom distinto) quando o recipe não traz", () => {
    const hover = generateTheme(base).light["--brand-hover"];
    expect(hover).toMatch(/^#[0-9a-f]{6}$/);
    expect(hover).not.toBe("#d4476a");
  });

  it("respeita hover/onPrimary explícitos do recipe", () => {
    const def: BrandDef = { ...base, brand: { primary: "#d4476a", hover: "#a02050", onPrimary: "#ffffff" } };
    const { light } = generateTheme(def);
    expect(light["--brand-hover"]).toBe("#a02050");
    expect(light["--brand-on-primary"]).toBe("#ffffff");
  });

  it("deriva hover/on-primary também para ref de paleta (contraste + step)", () => {
    const def: BrandDef = { ...base, brand: { primary: "teal-500" } };
    const { light } = generateTheme(def);
    expect(light["--brand-primary"]).toBe("var(--color-teal-500)");
    // teal-500 é escuro o suficiente → texto preto tem maior contraste
    expect(light["--brand-on-primary"]).toBe("var(--color-black)");
    // hover = 1 step mais escuro na própria paleta
    expect(light["--brand-hover"]).toBe("var(--color-teal-600)");
  });

  it("valores explícitos do recipe vencem a derivação por ref", () => {
    const def: BrandDef = { ...base, brand: { primary: "teal-500", hover: "teal-700", onPrimary: "white" } };
    const { light } = generateTheme(def);
    expect(light["--brand-hover"]).toBe("var(--color-teal-700)");
    expect(light["--brand-on-primary"]).toBe("var(--color-white)");
  });
});
