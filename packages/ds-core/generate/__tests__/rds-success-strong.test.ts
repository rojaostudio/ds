/**
 * text/on/success-strong: the icon on colors/state/success-strong (the success fill Tile). White in light and print,
 * black in dark and on the plate; 3:1 or more on the fill in every mode (WCAG 1.4.11, an icon).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateRdsTheme, rdsPrintMode, rdsThemeFromTable, type RdsBrandTable, type RdsMode } from "../rdsTheme";
import { contrastRatio } from "../scale";
import type { BrandDef } from "../../tokens/recipe.schema";

const one = (hex: string) => generateRdsTheme({ name: "b", brand: { primary: hex }, fonts: { body: "inter" } } as BrandDef, { warn: () => {} });
const table = () => JSON.parse(readFileSync(join(__dirname, "..", "..", "figma", "brands", "rojao.rds.json"), "utf8")) as RdsBrandTable;

describe("text/on/success-strong", () => {
  it.each(["#1b2a4a", "#00aeef", "#ffd60a", "#7c3aed", "#111111", "#f5f5f5"])(
    "%s: white in light and print, black in dark and plate, 3:1 on colors/state/success-strong",
    (hex) => {
      const t = one(hex);
      const print = rdsPrintMode(t);
      expect([t.light, print].map((m) => m["--text-on-success-strong"])).toEqual(["#ffffff", "#ffffff"]);
      expect([t.dark, t.brand].map((m) => m["--text-on-success-strong"])).toEqual(["#000000", "#000000"]);
      for (const m of [t.light, t.dark, t.brand, print])
        expect(contrastRatio(m["--text-on-success-strong"], m["--colors-state-success-strong"])).toBeGreaterThanOrEqual(3);
    },
  );

  it("the Rojão table carries it; a table exported before it loads it by the same rule, with a warning", () => {
    const t = rdsThemeFromTable(table(), { warn: () => {} });
    expect([t.light, t.dark, t.brand].map((m) => m["--text-on-success-strong"])).toEqual(["#ffffff", "#000000", "#000000"]);
    const old = table();
    for (const mode of ["light", "dark", "brand"] as RdsMode[]) delete old.modes[mode]["text/on/success-strong"];
    const warnings: string[] = [];
    const t2 = rdsThemeFromTable(old, { warn: (m) => warnings.push(m) });
    expect(t2.dark["--text-on-success-strong"]).toBe("#000000");
    expect(warnings[0]).toMatch(/exported before "text\/on\/success-strong"/);
  });
});
