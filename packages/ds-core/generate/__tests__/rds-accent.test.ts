/**
 * text/accent: the accent as text, only in large titles (24px and up, or 18.66px and up in bold). colors/accent/default
 * in every mode; an accent under 3:1 (large text) on surface/page or surface/card goes down its own ramp to the first
 * step that clears it.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  generateRdsTheme, rdsContrastReport, rdsPrintMode, rdsThemeFromTable, RDS_LARGE_TEXT_PAIRS, type RdsBrandTable, type RdsMode,
} from "../rdsTheme";
import { buildScale, contrastRatio } from "../scale";
import { recipes } from "../../recipes";
import type { BrandDef } from "../../tokens/recipe.schema";

const MODES: RdsMode[] = ["light", "dark", "brand"];

const make = (primary: string, accent?: string) =>
  generateRdsTheme(
    { name: "b", brand: accent ? { primary, secondary: primary, accent } : { primary }, fonts: { body: "inter" } } as BrandDef,
    { warn: () => {} },
  );
const table = () => JSON.parse(readFileSync(join(__dirname, "..", "..", "figma", "brands", "rojao.rds.json"), "utf8")) as RdsBrandTable;

describe("text/accent", () => {
  it("is measured at 3:1 on surface/page and surface/card (large text)", () => {
    expect(RDS_LARGE_TEXT_PAIRS).toEqual([["text/accent", "surface/page"], ["text/accent", "surface/card"]]);
  });

  it("the Rojão table: flare/800 on light, flare/700 on dark, the plate's colors/accent/default on the plate", () => {
    const t = table();
    expect(MODES.map((m) => t.modes[m]["text/accent"])).toEqual(["flare/800", "flare/700", "flare/300"]);
    expect(t.modes.brand["text/accent"]).toBe(t.modes.brand["colors/accent/default"]);
    const theme = rdsThemeFromTable(t, { warn: () => {} });
    expect([theme.light, theme.dark, theme.brand, rdsPrintMode(theme)].map((m) => m["--text-accent"])).toEqual([
      "#d95a00", "#ff6a00", "#ffb066", "#d95a00",
    ]);
    expect(rdsContrastReport(theme)).toEqual([]);
  });

  it("rojao recipe: the orange (2.9:1 on white) goes down to flare/800 on light; flare/300 is kept on dark and the plate", () => {
    const t = generateRdsTheme(recipes.rojao);
    expect(contrastRatio("#ff6a00", "#ffffff")).toBeLessThan(3);
    expect(t.light["--text-accent"]).toBe("#d95a00");
    expect(t.dark["--text-accent"]).toBe(t.dark["--colors-accent-default"]);
    expect(t.brand["--text-accent"]).toBe(t.brand["--colors-accent-default"]);
  });

  it("an accent that already clears 3:1 is colors/accent/default itself", () => {
    const t = make("#1b2a4a", "#7c3aed");
    for (const m of MODES) expect(t[m]["--text-accent"]).toBe(t[m]["--colors-accent-default"]);
  });

  it.each([
    ["yellow accent", "#1b2a4a", "#ffd200"], ["cyan accent", "#1b2a4a", "#00aeef"], ["one yellow", "#ffd200", undefined],
    ["one cyan", "#00aeef", undefined], ["orange accent", "#111111", "#ff6a00"], ["near white", "#f4f4f5", undefined],
  ] as const)("%s: 3:1 on page and card in light, dark, plate and print", (_, primary, accent) => {
    const t = make(primary, accent);
    for (const m of [t.light, t.dark, t.brand, rdsPrintMode(t)])
      for (const bg of ["--surface-page", "--surface-card"])
        expect(contrastRatio(m["--text-accent"], m[bg]), `${m["--text-accent"]} on ${m[bg]}`).toBeGreaterThanOrEqual(3);
  });

  it("a light accent goes down its own ramp, to the first step that clears 3:1", () => {
    const t = make("#1b2a4a", "#ffd200");
    const accent = t.light["--colors-accent-default"];
    const text = t.light["--text-accent"];
    expect(contrastRatio(accent, "#ffffff")).toBeLessThan(3);
    expect(text).not.toBe(accent);
    const ramp = Object.values(buildScale("#ffd200"));
    expect(ramp).toContain(text);
    // The step before it (lighter, nearer the accent) fails on one of the two surfaces.
    const darkerSteps = ramp.filter((c) => contrastRatio(c, "#ffffff") > contrastRatio(accent, "#ffffff"));
    darkerSteps.sort((a, b) => contrastRatio(a, "#ffffff") - contrastRatio(b, "#ffffff"));
    const before = darkerSteps[darkerSteps.indexOf(text) - 1];
    if (before)
      expect(Math.min(contrastRatio(before, t.light["--surface-page"]), contrastRatio(before, t.light["--surface-card"]))).toBeLessThan(3);
  });

  it("a table exported before it takes colors/accent/default of each mode, with a warning", () => {
    const old = table();
    for (const mode of MODES) delete old.modes[mode]["text/accent"];
    const warnings: string[] = [];
    const t = rdsThemeFromTable(old, { warn: (m) => warnings.push(m) });
    for (const mode of MODES) expect(t[mode]["--text-accent"]).toBe(t[mode]["--colors-accent-default"]);
    expect(warnings[0]).toMatch(/exported before "text\/accent"/);
  });
});
