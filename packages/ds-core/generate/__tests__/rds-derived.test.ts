/**
 * The accent a recipe does not name, derived from its primary (derive.ts), and the secondary that is then the primary
 * itself: the values, the rule, the contrast of the theme drawn from them in light, dark, plate and print, and the
 * recipes that name their colours.
 */
import { describe, expect, it } from "vitest";
import {
  emitRdsCss, generateRdsTheme, RDS_CONTRAST_PAIRS, RDS_NON_TEXT_PAIRS, rdsBrandColors, rdsContrastReport, rdsPrintMode,
  roleVar,
} from "../rdsTheme";
import { ACCENT_TURN, deriveAccent, NEUTRAL_ACCENT_HUE } from "../derive";
import { contrastRatio, hexToOklch } from "../scale";
import type { BrandDef } from "../../tokens/recipe.schema";
import { recipes } from "../../recipes";

const one = (hex: string): BrandDef =>
  ({ name: "brand", brand: { primary: hex }, surface: "neutral", text: "neutral", fonts: { body: "inter" } }) as BrandDef;

// The hard colours of the repo: a crimson, a violet, a grey, a near-black, a cyan, the navy, an orange, white and
// near-white.
const HARD = ["#E11D48", "#7C3AED", "#6B7280", "#111111", "#00AEEF", "#1B2A4A", "#E4572E", "#FFFFFF", "#FAFAFA", "#F5F5F5"];

const hueDeg = (hex: string) => (((hexToOklch(hex)[2] * 180) / Math.PI) % 360 + 360) % 360;
const hueGap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const opaque = (v: string | undefined): v is string => !!v && /^#[0-9a-f]{6}$/i.test(v);

describe("deriveAccent", () => {
  // The values the generator shows. A change here is a change of the rule: update derive.ts, its notes and this table.
  it("gives these accents for these primaries", () => {
    expect(Object.fromEntries(HARD.map((h) => [h, deriveAccent(h.toLowerCase())]))).toEqual({
      "#E11D48": "#00c192", "#7C3AED": "#d19a00", "#6B7280": "#e78a45", "#111111": "#e78a45", "#00AEEF": "#f47b75",
      "#1B2A4A": "#e78a47", "#E4572E": "#00beb1", "#FFFFFF": "#e78a45", "#FAFAFA": "#e78a45", "#F5F5F5": "#e78a45",
    });
  });

  it.each(HARD)("%s: the same primary always gives the same accent and theme, whatever its case", (hex) => {
    expect(deriveAccent(hex.toLowerCase())).toBe(deriveAccent(hex.toUpperCase()));
    expect(generateRdsTheme(one(hex))).toEqual(generateRdsTheme(one(hex)));
  });

  it("turns the hue of a coloured primary by ACCENT_TURN, a neutral one takes the fixed hue", () => {
    for (const hex of ["#E11D48", "#7C3AED", "#00AEEF", "#1B2A4A", "#E4572E"])
      expect(hueGap(hueDeg(deriveAccent(hex)), (hueDeg(hex) + ACCENT_TURN) % 360), hex).toBeLessThan(8);
    for (const hex of ["#111111", "#6B7280", "#FFFFFF"])
      expect(hueGap(hueDeg(deriveAccent(hex)), NEUTRAL_ACCENT_HUE), hex).toBeLessThan(8);
  });

  it("refuses what is not a #rrggbb colour", () => {
    expect(() => deriveAccent("teal-500")).toThrow(/not a #rrggbb/);
  });
});

describe("[RDS] theme from one colour: the colour is the action, the accent is derived", () => {
  it.each(HARD)("%s: the action is the colour chosen, the accent the derived one", (hex) => {
    const t = generateRdsTheme(one(hex));
    expect(t.light["--colors-secondary-default"].toLowerCase()).toBe(hex.toLowerCase());
    expect(t.light["--colors-accent-default"]).toBe(deriveAccent(hex.toLowerCase()));
    expect(rdsBrandColors(one(hex))).toEqual({
      primary: hex.toLowerCase(), secondary: hex.toLowerCase(), accent: deriveAccent(hex.toLowerCase()),
      source: { secondary: "primary", accent: "derived" },
    });
  });

  it.each(HARD)("%s: every pair of the report passes in light, dark and on the plate", (hex) => {
    expect(rdsContrastReport(generateRdsTheme(one(hex)))).toEqual([]);
  });

  it.each(HARD)("%s: every pair of the report passes in print (text 4.5:1, non-text 3:1)", (hex) => {
    const p = rdsPrintMode(generateRdsTheme(one(hex)));
    const bad = [
      ...RDS_CONTRAST_PAIRS.map(([fg, bg]) => [fg, bg, 4.5] as const),
      ...RDS_NON_TEXT_PAIRS.map(([fg, bg]) => [fg, bg, 3] as const),
    ].filter(([fg, bg, min]) => {
      const f = p[roleVar(fg)], b = p[roleVar(bg)];
      return opaque(f) && opaque(b) && contrastRatio(f, b) < min;
    });
    expect(bad).toEqual([]);
  });

  it("a named secondary or accent is used as given", () => {
    const withSecondary = generateRdsTheme({ ...one("#E11D48"), brand: { primary: "#E11D48", secondary: "#0A7E1C" } });
    expect(withSecondary.light["--colors-secondary-default"]).toBe("#0A7E1C");
    expect(withSecondary.light["--colors-accent-default"]).toBe(deriveAccent("#e11d48"));
    const withAccent = generateRdsTheme({ ...one("#E11D48"), brand: { primary: "#E11D48", accent: "#FFD60A" } });
    expect(withAccent.light["--colors-accent-default"]).toBe("#FFD60A");
    expect(withAccent.light["--colors-secondary-default"]).toBe("#E11D48");
    expect(rdsBrandColors({ ...one("#E11D48"), brand: { primary: "#E11D48", accent: "#FFD60A" } }).source).toEqual({
      secondary: "primary", accent: "recipe",
    });
  });

  it("a palette primary is derived from the colour it resolves to", () => {
    const c = rdsBrandColors({ ...one("#000000"), brand: { primary: "flare-700" } });
    expect(c).toMatchObject({ primary: "#ff6a00", secondary: "#ff6a00", accent: deriveAccent("#ff6a00") });
  });
});

// The house recipe names its three colours: deriving the missing ones must not touch it. The snapshot was recorded
// before the derivation existed.
describe("[RDS] rojao is untouched by the derivation of secondary and accent", () => {
  it("the generated CSS of rojao is the one recorded before", () => {
    expect(emitRdsCss(generateRdsTheme(recipes.rojao))).toMatchSnapshot();
  });

  it("names its colours: nothing is derived", () => {
    expect(rdsBrandColors(recipes.rojao)).toEqual({
      primary: "#1b2a4a", secondary: "#1b2a4a", accent: "#ff6a00", source: { secondary: "recipe", accent: "recipe" },
    });
  });
});
