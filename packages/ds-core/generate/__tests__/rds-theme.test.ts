import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateRdsTheme, rdsContrast, ROLES, roleVar, type RdsMode } from "../rdsTheme";
import type { BrandDef } from "../../tokens/recipe.schema";
import { primitives } from "../../tokens";

const themeTxt = readFileSync(join(__dirname, "../../figma/theme.txt"), "utf8")
  .split("\n")
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => l.split("|"));

// The Rojão brand as drawn in the [RDS] base collection (mode `rojao`).
const rojao: BrandDef = {
  name: "rojao",
  brand: { primary: "navy-900", secondary: "navy-900", accent: "flare-700", heading: "flare-700" },
  text: "zinc",
  fonts: { body: "inter" },
} as BrandDef;

// Brand colours across the wheel and the lightness range, including the awkward ones.
const samples: Array<[string, BrandDef]> = [
  ["rojao", rojao],
  ...["#1b2a4a", "#ff6a00", "#00aeef", "#ffd200", "#7c3aed", "#0a7e1c", "#e91e63", "#111111", "#f4f4f5"].map(
    (hex): [string, BrandDef] => [hex, { name: hex, brand: { primary: hex }, fonts: { body: "inter" } } as BrandDef],
  ),
];

describe("[RDS] theme roles", () => {
  it("ROLES matches figma/theme.txt (names, order and mode sources)", () => {
    const src = (cell: string, mode: "dark" | "brand") =>
      cell.startsWith(`@base:${mode}/`) ? (mode === "dark" ? "d" : "b") : cell.startsWith("@base:dark/") ? "d" : "l";
    const fromFigma = themeTxt.map(([name, , , , dark, brand]) => [name, src(dark, "dark"), src(brand, "brand")]);
    expect(ROLES.map((r) => [...r])).toEqual(fromFigma);
  });

  it("codeSyntax of every role is the path with hyphens", () => {
    for (const [name, , css] of themeTxt) expect(roleVar(name)).toBe(css);
  });

  it.each(samples)("%s: every role has a value in every mode", (_, def) => {
    const t = generateRdsTheme(def);
    for (const mode of ["light", "dark", "brand"] as RdsMode[]) {
      expect(Object.keys(t[mode])).toHaveLength(ROLES.length);
      for (const v of Object.values(t[mode])) expect(v).toBeTruthy();
    }
  });

  it("rojao: the brand roles come out as drawn in Figma", () => {
    const t = generateRdsTheme(rojao);
    expect(t.light["--colors-primary-default"]).toBe("#1b2a4a");
    expect(t.light["--colors-accent-default"]).toBe("#ff6a00");
    expect(t.light["--text-body"]).toBe("#27272a");
    expect(t.light["--surface-page"]).toBe("#f4f4f5");
    expect(t.dark["--colors-primary-default"]).toBe("#c9cdd8");
    expect(t.brand["--surface-page"]).toBe("#1b2a4a");
    expect(t.light["--text-on-primary"]).toBe("#ffffff");
  });

  // surface/tint/subtle (issue #26): one step lighter than the default tint in light (flare/200 →
  // flare/100 for rojao), the default itself in dark (no step below 900), ink at 5% on the plate.
  it("rojao: surface/tint/subtle follows the Figma rule", () => {
    const t = generateRdsTheme(rojao);
    const flare = primitives.color.flare as Record<number, string>;
    expect(t.light["--surface-tint-default"]).toBe(flare[200]);
    expect(t.light["--surface-tint-subtle"]).toBe(flare[100]);
    expect(t.dark["--surface-tint-subtle"]).toBe(t.dark["--surface-tint-default"]);
    expect(t.brand["--surface-tint-subtle"]).toBe("#ffffff0d");
  });

  // Text on a fill must clear WCAG AA (4.5:1) for any brand colour: these are picked by contrast.
  const onPairs: Array<[string, string, RdsMode[]]> = [
    ["text/on/primary", "colors/primary/default", ["light", "dark"]],
    ["text/on/secondary", "colors/secondary/default", ["light", "dark"]],
    ["text/on/accent", "colors/accent/default", ["light", "dark"]],
    ["text/on/accent-mark", "colors/accent/mark", ["light", "dark"]],
    ["text/on/cover", "surface/cover", ["light"]],
    ["text/on/primary", "colors/primary/default", ["brand"]],
    ["text/body", "surface/page", ["brand"]],
    ["text/heading", "surface/page", ["brand"]],
    ["text/link", "surface/page", ["brand"]],
  ];
  it.each(samples)("%s: text on brand fills ≥ 4.5:1", (_, def) => {
    const t = generateRdsTheme(def);
    for (const [fg, bg, modes] of onPairs)
      for (const mode of modes) {
        const r = rdsContrast(t, mode, fg, bg);
        if (r !== null) expect(r, `${mode} ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
  });

  // Fixed text/surface pairs (neutral and state ramps) clear AA in light and dark.
  const fixedPairs: Array<[string, string]> = [
    ["text/body", "surface/page"], ["text/body", "surface/card"], ["text/muted", "surface/card"],
    ["text/subtle", "surface/card"], ["text/link", "surface/card"], ["text/action", "surface/card"],
    ["text/error", "surface/error"], ["text/success", "surface/success"], ["text/info", "surface/info"],
    ["text/warning", "surface/warning"], ["text/neutral", "surface/neutral"],
    ["text/on/error", "colors/state/error"], ["text/on/info", "colors/state/info"],
    ["text/on/neutral", "colors/state/neutral"],
  ];
  it.each(["light", "dark"] as RdsMode[])("rojao %s: neutral and state text pairs ≥ 4.5:1", (mode) => {
    const t = generateRdsTheme(rojao);
    const fails = fixedPairs
      .map(([fg, bg]) => [fg, bg, rdsContrast(t, mode, fg, bg)] as const)
      .filter(([, , r]) => r !== null && r < 4.5);
    expect(fails).toEqual([]);
  });
});
