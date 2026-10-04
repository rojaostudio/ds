import { describe, expect, it } from "vitest";
import { distinct, generateRdsTheme, rdsContrastReport } from "../rdsTheme";
import type { BrandDef } from "../../tokens/recipe.schema";
import { recipes } from "../../recipes";

// The showroom's "your colour": one hex, as ds-www builds it (lib/rds-theme.ts, colorDef).
const one = (hex: string): BrandDef =>
  ({ name: "brand", brand: { primary: hex }, surface: "neutral", text: "neutral", fonts: { body: "inter" } }) as BrandDef;

// The colours that broke it (Patrick's P0): light, mid, near-black, near-white, a grey and the warm ones.
const HARD = ["#FFD60A", "#10B981", "#E11D48", "#7C3AED", "#6B7280", "#22D3EE", "#111111", "#F5F5F5", "#FF6A00"];

describe("[RDS] theme from one colour", () => {
  it.each(HARD)("%s: every pair of the report passes (text 4.5:1, non-text 3:1), in every mode", (hex) => {
    expect(rdsContrastReport(generateRdsTheme(one(hex)))).toEqual([]);
  });

  it.each(HARD)("%s: the neutral fill is a neutral ink, never the brand colour, and apart from the action fill", (hex) => {
    const t = generateRdsTheme(one(hex));
    for (const mode of ["light", "dark"] as const) {
      const neutral = t[mode]["--colors-primary-default"];
      const action = t[mode]["--colors-secondary-default"];
      expect(neutral.toLowerCase(), `${mode} neutral`).not.toBe(hex.toLowerCase());
      expect(distinct(neutral, action), `${mode} neutral ${neutral} vs action ${action}`).toBe(true);
    }
    // The brand colour stays the action of the light mode.
    expect(t.light["--colors-secondary-default"].toLowerCase()).toBe(hex.toLowerCase());
  });

  it("the plate is the brand colour when it leaves room for its ink, a deeper step of it otherwise", () => {
    expect(generateRdsTheme(one("#FFD60A")).brand["--surface-page"].toLowerCase()).toBe("#ffd60a");
    expect(generateRdsTheme(one("#FF6A00")).brand["--surface-page"].toLowerCase()).toBe("#ff6a00");
    const crimson = generateRdsTheme(one("#E11D48")).brand["--surface-page"];
    expect(crimson.toLowerCase()).not.toBe("#e11d48");
    expect(crimson).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("a recipe with its own secondary keeps its primary (rojao: navy is the neutral ink and the plate)", () => {
    const t = generateRdsTheme(recipes.rojao);
    expect(t.light["--colors-primary-default"]).toBe("#1b2a4a");
    expect(t.brand["--surface-page"]).toBe("#1b2a4a");
    expect(t.light["--logo-primary"]).toBe("#1b2a4a");
  });
});
