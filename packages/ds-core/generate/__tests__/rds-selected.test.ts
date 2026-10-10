/**
 * text/selected: the text and icon of a selected item (the pressed Toggle, the current page of a Pagination) and the
 * pressed Toggle's border. colors/primary/default in every mode; a primary under 4.5:1 on the selection tints falls
 * to a darker step of its own ramp.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateRdsTheme, rdsPrintMode, rdsThemeFromTable, type RdsBrandTable, type RdsMode } from "../rdsTheme";
import { buildScale, contrastRatio } from "../scale";
import { recipes } from "../../recipes";
import type { BrandDef } from "../../tokens/recipe.schema";

const WHITE = "#ffffff";

const make = (primary: string, secondary?: string) =>
  generateRdsTheme(
    { name: "b", brand: secondary ? { primary, secondary } : { primary }, fonts: { body: "inter" } } as BrandDef,
    { warn: () => {} },
  );
const table = () => JSON.parse(readFileSync(join(__dirname, "..", "..", "figma", "brands", "rojao.rds.json"), "utf8")) as RdsBrandTable;
/** `#rrggbbaa` over an opaque colour. */
const over = (top: string, below: string) => {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
  const a = top.length === 9 ? ch(top, 3) / 255 : 1;
  return `#${[0, 1, 2].map((i) => Math.round(ch(top, i) * a + ch(below, i) * (1 - a)).toString(16).padStart(2, "0")).join("")}`;
};

describe("text/selected", () => {
  it("rojao: the same as colors/primary/default in light, dark, plate and print", () => {
    const t = generateRdsTheme(recipes.rojao);
    for (const m of [t.light, t.dark, t.brand, rdsPrintMode(t)]) expect(m["--text-selected"]).toBe(m["--colors-primary-default"]);
  });

  it("a light primary (#00aeef, a cyan with a secondary) falls to a darker step of its own ramp in light", () => {
    const t = make("#00aeef", "#1b2a4a");
    expect(t.light["--colors-primary-default"]).toBe("#00aeef");
    expect(contrastRatio("#00aeef", t.light["--surface-tint-default"])).toBeLessThan(4.5);
    const sel = t.light["--text-selected"];
    expect(sel).not.toBe("#00aeef");
    expect(Object.values(buildScale("#00aeef"))).toContain(sel);
    expect(contrastRatio(sel, WHITE)).toBeGreaterThan(contrastRatio("#00aeef", WHITE));
  });

  it.each([
    ["#1b2a4a", "#ff6a00"], ["#00aeef", "#1b2a4a"], ["#ffd60a", "#111111"], ["#7c3aed", undefined], ["#00aeef", undefined],
    ["#f4f4f5", "#0a7e1c"], ["#e91e63", "#00aeef"],
  ] as const)("%s (secondary %s): 4.5:1 on both selection tints in light, dark, plate and print", (primary, secondary) => {
    const t = make(primary, secondary);
    for (const m of [t.light, t.dark, t.brand, rdsPrintMode(t)]) {
      const below = m["--surface-card"].length === 7 ? m["--surface-card"] : WHITE;
      for (const tint of ["--surface-tint-default", "--surface-tint-subtle"]) {
        const bg = over(m[tint], below);
        expect(contrastRatio(m["--text-selected"], bg)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("the Rojão table carries it; a table exported before it takes colors/primary/default of each mode, with a warning", () => {
    const t = rdsThemeFromTable(table(), { warn: () => {} });
    for (const mode of ["light", "dark", "brand"] as RdsMode[]) expect(t[mode]["--text-selected"]).toBe(t[mode]["--colors-primary-default"]);
    const old = table();
    for (const mode of ["light", "dark", "brand"] as RdsMode[]) delete old.modes[mode]["text/selected"];
    const warnings: string[] = [];
    const t2 = rdsThemeFromTable(old, { warn: (m) => warnings.push(m) });
    expect([t2.light, t2.dark, t2.brand].map((m) => m["--text-selected"])).toEqual(["#1b2a4a", t.dark["--colors-primary-default"], "#ffffff"]);
    expect(warnings[0]).toMatch(/exported before "text\/selected"/);
  });
});
