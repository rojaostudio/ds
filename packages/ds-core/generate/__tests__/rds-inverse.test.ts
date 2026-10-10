/**
 * The inverse roles (surface/inverse, text/on-inverse, text/on-inverse-subtle), the inverse Card's fill and texts: the
 * brand's primary in light when white reads AA on it, coal/900 otherwise; white in dark and on the plate.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateRdsTheme, rdsPrintMode, rdsThemeFromTable, type RdsBrandTable, type RdsMode } from "../rdsTheme";
import { contrastRatio } from "../scale";
import { primitives } from "../../tokens";
import { recipes } from "../../recipes";
import type { BrandDef } from "../../tokens/recipe.schema";

const coal = primitives.color.coal as Record<number, string>;
const one = (hex: string) => generateRdsTheme({ name: "b", brand: { primary: hex }, fonts: { body: "inter" } } as BrandDef, { warn: () => {} });
/** `#rrggbbaa` over an opaque colour. */
const over = (top: string, below: string) => {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
  const a = top.length === 9 ? ch(top, 3) / 255 : 1;
  return `#${[0, 1, 2].map((i) => Math.round(ch(top, i) * a + ch(below, i) * (1 - a)).toString(16).padStart(2, "0")).join("")}`;
};

describe("surface/inverse and its texts", () => {
  it("a dark primary is the inverse fill itself, with white text", () => {
    const t = one("#1b2a4a");
    expect(t.light["--surface-inverse"]).toBe("#1b2a4a");
    expect(t.light["--text-on-inverse"]).toBe("#ffffff");
    expect(t.light["--text-on-inverse-subtle"]).toBe("#ffffffb3");
  });

  it("the subtitle is white at 70%, more opaque when 70% would fall under AA on the fill", () => {
    const t = one("#7c3aed");
    expect(t.light["--surface-inverse"]).toBe("#7c3aed");
    expect(t.light["--text-on-inverse-subtle"]).toBe("#ffffffd9");
  });

  it("a light primary (#00aeef, under 4.5:1 with white) falls back to coal/900", () => {
    expect(contrastRatio("#ffffff", "#00aeef")).toBeLessThan(4.5);
    expect(one("#00aeef").light["--surface-inverse"]).toBe(coal[900]);
    expect(one("#ffd60a").light["--surface-inverse"]).toBe(coal[900]);
  });

  it("dark and plate: white fill, coal/900 text, coal/600 subtitle", () => {
    const t = one("#7c3aed");
    for (const mode of ["dark", "brand"] as RdsMode[]) {
      expect(t[mode]["--surface-inverse"]).toBe("#ffffff");
      expect(t[mode]["--text-on-inverse"]).toBe(coal[900]);
      expect(t[mode]["--text-on-inverse-subtle"]).toBe(coal[600]);
    }
  });

  it("print keeps the light inverse (a full fill, not a background turned white)", () => {
    const t = one("#7c3aed");
    expect(rdsPrintMode(t)["--surface-inverse"]).toBe("#7c3aed");
    expect(rdsPrintMode(t)["--text-on-inverse"]).toBe("#ffffff");
  });

  it.each(["#1b2a4a", "#ff6a00", "#00aeef", "#ffd200", "#7c3aed", "#0a7e1c", "#e91e63", "#111111", "#f4f4f5"])(
    "%s: text and subtitle clear 4.5:1 on the fill, in light, dark, plate and print",
    (hex) => {
      const t = one(hex);
      for (const m of [t.light, t.dark, t.brand, rdsPrintMode(t)]) {
        const bg = m["--surface-inverse"];
        expect(contrastRatio(m["--text-on-inverse"], bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(over(m["--text-on-inverse-subtle"], bg), bg)).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it("rojao: navy/900 in light, from the recipe and from the Figma table", () => {
    expect(generateRdsTheme(recipes.rojao).light["--surface-inverse"]).toBe("#1b2a4a");
    const table = JSON.parse(readFileSync(join(__dirname, "..", "..", "figma", "brands", "rojao.rds.json"), "utf8")) as RdsBrandTable;
    const t = rdsThemeFromTable(table, { warn: () => {} });
    expect([t.light["--surface-inverse"], t.dark["--surface-inverse"], t.brand["--text-on-inverse"]]).toEqual(["#1b2a4a", "#ffffff", coal[900]]);
  });

  it("a table exported before the inverse roles loads them by the generator's rule, with a warning", () => {
    const table = JSON.parse(readFileSync(join(__dirname, "..", "..", "figma", "brands", "rojao.rds.json"), "utf8")) as RdsBrandTable;
    for (const mode of ["light", "dark", "brand"] as RdsMode[])
      for (const r of ["surface/inverse", "text/on-inverse", "text/on-inverse-subtle"]) delete table.modes[mode][r];
    const warnings: string[] = [];
    const t = rdsThemeFromTable(table, { warn: (m) => warnings.push(m) });
    expect(t.light["--surface-inverse"]).toBe("#1b2a4a");
    expect(t.dark["--text-on-inverse-subtle"]).toBe(coal[600]);
    expect(warnings[0]).toMatch(/exported before "surface\/inverse"[\s\S]*Export the table again/);
  });
});
