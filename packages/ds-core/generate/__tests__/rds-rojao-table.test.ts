/**
 * The Rojão brand table (figma/brands/rojao.rds.json, exported from the [RDS] Base Tokens file by
 * figma/export-brand.js) against the generator. The table is what @rojaostudio/ds ships; the generator is what any
 * other brand gets. The difference below is the map of what the generator still does not draw as Figma does: it
 * is pinned (a change shows up in review), not asserted to be empty.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateRdsTheme, rdsContrastReport, rdsThemeFromTable, ROLES, roleVar, type RdsBrandTable, type RdsMode } from "../rdsTheme";
import { recipes } from "../../recipes";

const table = JSON.parse(readFileSync(join(__dirname, "../../figma/brands/rojao.rds.json"), "utf8")) as RdsBrandTable;
const MODES: RdsMode[] = ["light", "dark", "brand"];

describe("rojao: the Figma table", () => {
  it("is the rojao brand, with every role of every mode", () => {
    expect(table.name).toBe("rojao");
    for (const mode of MODES) expect(Object.keys(table.modes[mode]).sort()).toEqual(ROLES.map(([r]) => r).sort());
  });

  // Figma fixed text/on/info (black on blue/500): nothing below AA in the table, and no warning.
  it("the contrast report of the table is empty", () => {
    const warnings: string[] = [];
    const t = rdsThemeFromTable(table, { warn: (m) => warnings.push(m) });
    expect(rdsContrastReport(t)).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it("border/error: red/600 on light, red/400 on dark, red/300 on the plate, as the generator draws it", () => {
    const fig = rdsThemeFromTable(table);
    const gen = generateRdsTheme(recipes.rojao);
    expect(MODES.map((m) => table.modes[m]["border/error"])).toEqual(["red/600", "red/400", "red/300"]);
    for (const m of MODES) expect(gen[m]["--border-error"]).toBe(fig[m]["--border-error"]);
  });

  it("text/heading is navy on light, as the recipe", () => {
    const t = rdsThemeFromTable(table);
    expect(t.light["--text-heading"]).toBe(generateRdsTheme(recipes.rojao).light["--text-heading"]);
    expect(table.modes.light["text/heading"]).toBe("navy/900");
  });

  it("generateRdsTheme(recipes.rojao) against the table: the roles the generator still draws differently", () => {
    const fig = rdsThemeFromTable(table);
    const gen = generateRdsTheme(recipes.rojao);
    const diff: string[] = [];
    for (const mode of MODES)
      for (const [role] of ROLES) {
        const v = roleVar(role);
        if (gen[mode][v].toLowerCase() !== fig[mode][v].toLowerCase())
          diff.push(`${mode} ${role}: generator ${gen[mode][v]}, Figma ${fig[mode][v]} (${table.modes[mode][role]})`);
      }
    expect(diff).toMatchSnapshot();
  });
});
