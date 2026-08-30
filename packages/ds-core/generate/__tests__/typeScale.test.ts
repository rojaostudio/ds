import { describe, it, expect } from "vitest";
import { generateTheme } from "../generateTheme";
import type { BrandDef } from "../../tokens/recipe.schema";

const base: BrandDef = {
  name: "t",
  archetype: "chromatic",
  brand: { primary: "teal-500" },
  surface: "neutral",
  text: "neutral",
  fonts: { body: "inter" },
};

describe("generateTheme — type scale", () => {
  it("não emite font-size quando o recipe não traz type", () => {
    const { light } = generateTheme(base);
    expect(Object.keys(light).some((k) => k.startsWith("--font-size-"))).toBe(false);
  });

  it("emite --font-size-<style> resolvido do token da escala", () => {
    const def: BrandDef = { ...base, type: { body: { token: "lg" }, "heading-lg": { token: "4xl" } } };
    const { light } = generateTheme(def);
    expect(light["--font-size-body"]).toBe("18px");
    expect(light["--font-size-heading-lg"]).toBe("36px");
    // não customizado → não emitido (herda a base)
    expect(light["--font-size-caption"]).toBeUndefined();
  });
});
