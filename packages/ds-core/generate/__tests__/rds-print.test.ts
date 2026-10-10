/**
 * The print mode of the [RDS] theme (issue #42): emitRdsCss closes the sheet with an `@media print` block, the light
 * mode with white backgrounds and clear shadows over every scope, dark and plate; and the media type variables, the
 * screen type outside print and a closed scale in points inside it.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  emitRdsCss, generateRdsTheme, RDS_MEDIA_TYPE, RDS_PRINT_TRANSPARENT, RDS_PRINT_WHITE, rdsPrintMode, ROLES, roleVar,
} from "../rdsTheme";
import { emitClaudeMd } from "../emitClaudeMd";
import { recipes } from "../../recipes";

const theme = generateRdsTheme(recipes.rojao);
const css = emitRdsCss(theme);
/** The `@media print { … }` block, and the rule inside it. */
const printBlock = css.slice(css.indexOf("@media print {"));
const printRule = printBlock.slice(printBlock.indexOf("\n") + 1);
const decl = (block: string, v: string) => block.match(new RegExp(`^  ${v}: ([^;]+);$`, "m"))?.[1];
const lightBlock = css.slice(0, css.indexOf("\n}\n") + 2);

describe("rdsPrintMode", () => {
  const print = rdsPrintMode(theme);

  it("is light with every background white and every shadow transparent", () => {
    expect(RDS_PRINT_WHITE).toHaveLength(19);
    expect(RDS_PRINT_TRANSPARENT).toHaveLength(3);
    for (const role of RDS_PRINT_WHITE) expect(print[roleVar(role)], role).toBe("#ffffff");
    for (const role of RDS_PRINT_TRANSPARENT) expect(print[roleVar(role)], role).toBe("#00000000");
    const swapped = new Set<string>([...RDS_PRINT_WHITE, ...RDS_PRINT_TRANSPARENT].map(roleVar));
    for (const [k, v] of Object.entries(theme.light)) if (!swapped.has(k)) expect(print[k], k).toBe(v);
  });

  it("only swaps roles of the theme", () => {
    const roles = new Set(ROLES.map(([r]) => r));
    expect([...RDS_PRINT_WHITE, ...RDS_PRINT_TRANSPARENT].filter((r) => !roles.has(r))).toEqual([]);
    expect(Object.keys(print)).toHaveLength(ROLES.length);
  });

  it("leaves borders and texts as in light", () => {
    for (const role of ["border/default", "border/strong", "text/body", "text/heading", "text/muted"])
      expect(print[roleVar(role)]).toBe(theme.light[roleVar(role)]);
  });
});

describe("emitRdsCss — the print block", () => {
  it("is the last block, a media query over every scope, dark and plate selector", () => {
    expect(css.match(/@media print \{/g)).toHaveLength(1);
    expect(css.trimEnd().endsWith("}\n}")).toBe(true);
    const head = printRule.slice(0, printRule.indexOf(" {\n")).split(", ");
    for (const sel of [":root", ".ds-scope", "[data-rds-scope]", ":root.dark", ".dark", '[data-rds-mode="dark"]',
      ".dark .ds-scope", ".ds-plate", "[data-rds-plate]"])
      expect(head, sel).toContain(sel);
  });

  it("forces the light values, with the print swaps, for every role", () => {
    const print = rdsPrintMode(theme);
    for (const [k, v] of Object.entries(print))
      expect(decl(printRule, k), k).toBe(k === "--type-font-mono" ? `"${v}", monospace` : v);
    expect(decl(printRule, "--surface-page")).toBe("#ffffff");
    expect(decl(printRule, "--surface-attention-high")).toBe("#ffffff");
    expect(decl(printRule, "--shadow-strong")).toBe("#00000000");
    // A dark value never reaches paper.
    expect(decl(printRule, "--text-body")).toBe(theme.light["--text-body"]);
    expect(decl(printRule, "--text-body")).not.toBe(theme.dark["--text-body"]);
  });

  it("follows an own scope and dark selector", () => {
    const own = emitRdsCss(theme, { scope: ":root", dark: ':root[data-theme="dark"]' });
    expect(own).toContain('@media print {\n:root, :root[data-theme="dark"], .ds-plate, [data-rds-plate] {\n');
  });
});

describe("the media type variables", () => {
  it("are the screen type outside print and points inside it", () => {
    expect(RDS_MEDIA_TYPE.map((m) => m.role)).toEqual(["caption", "small", "body", "label", "title"]);
    expect(RDS_MEDIA_TYPE.map((m) => m.print.join("/"))).toEqual(["8/10", "9/12", "10/14", "12/16", "18/24"]);
    expect(decl(lightBlock, "--media-type-caption-size")).toBe("var(--type-caption-size, 12px)");
    expect(decl(lightBlock, "--media-type-title-size")).toBe("var(--type-heading-size, 24px)");
    expect(decl(lightBlock, "--media-type-title-line")).toBe("var(--type-heading-line, 30px)");
    for (const { role, print: [size, line] } of RDS_MEDIA_TYPE) {
      expect(decl(printRule, `--media-type-${role}-size`)).toBe(`${size}pt`);
      expect(decl(printRule, `--media-type-${role}-line`)).toBe(`${line}pt`);
    }
  });

  it("alias type styles that exist in figma/foundation.txt, with their px value as fallback", () => {
    const foundation = new Map(
      readFileSync(join(__dirname, "..", "..", "figma", "foundation.txt"), "utf8")
        .split(/\r?\n/)
        .filter((l) => l && !l.startsWith("#"))
        .map((l) => l.split("|"))
        .map(([name, , value]) => [name, Number(value)]),
    );
    for (const { screen, size, line } of RDS_MEDIA_TYPE) {
      expect(foundation.get(`type/${screen}/size`), screen).toBe(size);
      expect(foundation.get(`type/${screen}/line`), screen).toBe(line);
    }
  });

  it("are named in the rules file, with the print mode", () => {
    const md = emitClaudeMd(recipes.rojao);
    expect(md).toContain("@media print");
    expect(md).toContain("--media-type-<role>-size");
    expect(md).toMatch(/`caption` · `small` · `body` · `label` · `title`/);
  });
});
