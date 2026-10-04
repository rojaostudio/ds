import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateRdsTheme, rdsContrastReport, RDS_CONTRAST_PAIRS, rdsThemeFromTable, type RdsBrandTable } from "../rdsTheme";
import type { BrandDef } from "../../tokens/recipe.schema";
import { recipes } from "../../recipes";
import { contrastRatio } from "../scale";

const table = JSON.parse(readFileSync(join(__dirname, "../../figma/brands/rojao.rds.json"), "utf8")) as RdsBrandTable;

const brand = (hex: string, extra: Partial<BrandDef["brand"]> = {}): BrandDef =>
  ({ name: hex, brand: { primary: hex, ...extra }, fonts: { body: "inter" } }) as BrandDef;

// Brand colours across the wheel and the lightness range: light, dark, saturated, the yellow that breaks every
// "brand colour as text" rule, near-white and near-black.
const COLOURS = [
  "#ffd200", "#fff3a0", "#f4f4f5", "#ffffff", "#e0f7fa", "#ffb6c1", "#a3e635", "#22d3ee",
  "#00aeef", "#ff6a00", "#e91e63", "#7c3aed", "#0a7e1c", "#1b2a4a", "#111111", "#000000",
  "#ff0000", "#00ff00", "#0000ff", "#808080", "#c0a000", "#8b4513",
];

const headingAndOn = (fails: ReturnType<typeof rdsContrastReport>) =>
  fails.filter((f) => f.fg === "text/heading" || f.fg.startsWith("text/on/"));

describe("[RDS] contrast of the generated theme, for any brand colour", () => {
  it.each(COLOURS)("%s: text/heading and every text/on/* pass the report", (hex) => {
    expect(headingAndOn(rdsContrastReport(generateRdsTheme(brand(hex))))).toEqual([]);
  });

  it.each(COLOURS)("%s as secondary and accent: text/heading and text/on/* pass", (hex) => {
    expect(headingAndOn(rdsContrastReport(generateRdsTheme(brand("#1b2a4a", { secondary: hex, accent: hex }))))).toEqual([]);
  });

  // Marks, not text (WCAG 1.4.11, 3:1): the border of a field in error on surface/card (the field background), in
  // every mode, and the brand's own chart series on the card of light and dark.
  it.each(COLOURS)("%s: border/error and chart/series/1 reach 3:1 on surface/card", (hex) => {
    for (const t of [generateRdsTheme(brand(hex)), generateRdsTheme(brand("#1b2a4a", { secondary: hex, accent: hex }))]) {
      for (const mode of ["light", "dark", "brand"] as const)
        expect(contrastRatio(t[mode]["--border-error"], t[mode]["--surface-card"]), `${mode} border/error`).toBeGreaterThanOrEqual(3);
      for (const mode of ["light", "dark"] as const)
        expect(contrastRatio(t[mode]["--chart-series-1"], t[mode]["--surface-card"]), `${mode} chart/series/1`).toBeGreaterThanOrEqual(3);
    }
  });

  // A hovered or pressed fill keeps the label of the default one: the text/on/* is picked against the default, so
  // hover and active have to carry it too. The report measures those pairs (the cases above run them); here, each
  // state also stays a visible change, never the default fill itself.
  const STATES = [
    ["text/on/primary", "colors/primary/default", ["colors/primary/active"]],
    ["text/on/secondary", "colors/secondary/default", ["colors/secondary/hover", "colors/secondary/active"]],
    ["text/on/accent", "colors/accent/default", ["colors/accent/hover"]],
  ] as const;
  it("the report measures hover and active against the text of the default fill", () => {
    for (const [text, , states] of STATES)
      for (const s of states) expect(RDS_CONTRAST_PAIRS, `${text} on ${s}`).toContainEqual([text, s]);
  });

  it.each(COLOURS)("%s: hover and active carry text/on/* at AA and differ from the default fill", (hex) => {
    for (const t of [generateRdsTheme(brand(hex)), generateRdsTheme(brand("#1b2a4a", { secondary: hex, accent: hex }))])
      for (const mode of ["light", "dark", "brand"] as const)
        for (const [text, fill, states] of STATES) {
          const on = t[mode][`--${text.replaceAll("/", "-")}`];
          const def = t[mode][`--${fill.replaceAll("/", "-")}`];
          const seen = new Set([def.toLowerCase()]);
          for (const s of states) {
            const v = t[mode][`--${s.replaceAll("/", "-")}`];
            expect(contrastRatio(on, v), `${mode} ${text} on ${s} (${on} on ${v})`).toBeGreaterThanOrEqual(4.5);
            expect(seen.has(v.toLowerCase()), `${mode} ${s} ${v} repeats the default or another state`).toBe(false);
            seen.add(v.toLowerCase());
          }
        }
  });

  it("cyan #00aeef (the PR #33 case): the action fill hover no longer darkens under black text", () => {
    const t = generateRdsTheme(brand("#00aeef"));
    expect(t.light["--text-on-secondary"]).toBe("#000000");
    // Was #005679 (2.6:1 with the black label) and #003d58 (1.8:1).
    expect(t.light["--colors-secondary-hover"]).not.toBe("#005679");
    expect(contrastRatio("#000000", t.light["--colors-secondary-hover"])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#000000", t.light["--colors-secondary-active"])).toBeGreaterThanOrEqual(4.5);
  });

  it("text/heading keeps the brand colour when it already passes, and darkens the yellow", () => {
    expect(generateRdsTheme(brand("#1b2a4a")).light["--text-heading"]).toBe("#1b2a4a");
    const t = generateRdsTheme(brand("#ffd200"));
    // An ochre of the same hue, not the black fallback. Dark enough to also read on the pressed outline Button
    // (surface/muted-strong) and on the accent highlight of the Badge, where it is a label too.
    expect(t.light["--text-heading"]).toBe("#855800");
    expect(rdsContrastReport(t).filter((f) => f.fg === "text/heading")).toEqual([]);
  });

  it("an explicit heading that fails is kept, with a warning", () => {
    const warnings: string[] = [];
    const t = generateRdsTheme(brand("#1b2a4a", { heading: "#ffd200" }), { warn: (m) => warnings.push(m) });
    expect(t.light["--text-heading"]).toBe("#ffd200");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/heading #ffd200 is 1\.\d+:1/);
    expect(rdsContrastReport(t).some((f) => f.fg === "text/heading" && f.mode === "light")).toBe(true);
  });

  it("an explicit heading that passes gives no warning", () => {
    const warnings: string[] = [];
    generateRdsTheme(brand("#ffd200", { heading: "#1b2a4a" }), { warn: (m) => warnings.push(m) });
    expect(warnings).toEqual([]);
  });

  it("the rojao recipe: navy heading, nothing in the report", () => {
    const t = generateRdsTheme(recipes.rojao);
    expect(t.light["--text-heading"]).toBe("#1b2a4a");
    expect(rdsContrastReport(t)).toEqual([]);
  });

  it("the report measures a short, explicit list of pairs", () => {
    expect(RDS_CONTRAST_PAIRS.length).toBeLessThan(60);
    const t = generateRdsTheme(brand("#1b2a4a"));
    t.light["--text-body"] = "#cccccc";
    expect(rdsContrastReport(t)).toEqual([
      { mode: "light", fg: "text/body", bg: "surface/page", ratio: expect.any(Number), min: 4.5 },
      { mode: "light", fg: "text/body", bg: "surface/card", ratio: expect.any(Number), min: 4.5 },
      { mode: "light", fg: "text/body", bg: "surface/tint/default", ratio: expect.any(Number), min: 4.5 },
    ]);
  });

  it("rdsThemeFromTable reports a pair below AA and still returns the theme", () => {
    const bad = structuredClone(table);
    bad.modes.light["text/body"] = "zinc/200";
    const warnings: string[] = [];
    const t = rdsThemeFromTable(bad, { warn: (m) => warnings.push(m) });
    expect(t.light["--text-body"]).toBe("#e4e4e7");
    expect(warnings.join("\n")).toMatch(/light: text\/body on surface\/page/);
  });
});
