import { describe, expect, it } from "vitest";
import { emitRdsCss, rdsThemeFromTable, ROLES, roleVar, type RdsBrandTable } from "../rdsTheme";

// A brand table as figma/export-brand.js writes it: every role of every mode points to a primitive by name.
function table(): RdsBrandTable {
  const mode = (primary: string) =>
    Object.fromEntries(
      ROLES.map(([role]) => [
        role,
        role === "type/font/mono" ? "Roboto Mono" : role === "colors/primary/default" ? primary : role === "surface/disabled" ? "black/a10" : "zinc/500",
      ]),
    );
  return {
    $schema: "rds-brand-table/1",
    name: "sample",
    primitives: { "brandcyan/400": "#22BBF2", "brandcyan/500": "#00aeef", "zinc/500": "#71717a", "black/a10": "#0000001a" },
    modes: { light: mode("brandcyan/500"), dark: mode("brandcyan/400"), brand: mode("brandcyan/500") },
  };
}

describe("[RDS] theme from a brand table", () => {
  it("each role takes the colour of the primitive Figma points to, mode by mode", () => {
    const t = rdsThemeFromTable(table());
    expect(t.light["--colors-primary-default"]).toBe("#00aeef");
    expect(t.dark["--colors-primary-default"]).toBe("#22bbf2");
    expect(t.light["--surface-disabled"]).toBe("#0000001a");
    expect(t.light["--type-font-mono"]).toBe("Roboto Mono");
    for (const mode of ["light", "dark", "brand"] as const) expect(Object.keys(t[mode])).toEqual(ROLES.map(([r]) => roleVar(r)));
  });

  it("lists every missing role and unknown primitive", () => {
    const t = table();
    delete t.modes.dark["text/body"];
    t.modes.brand["surface/page"] = "nope/500";
    expect(() => rdsThemeFromTable(t)).toThrow(/dark: role "text\/body" is missing[\s\S]*brand: "surface\/page" points to unknown primitive "nope\/500"/);
  });

  // A table exported before border/error existed (a consumer keeps its export): the role is taken, mode by mode,
  // from the token Figma aliases it to, with a warning to export again. Without that token it fails as any role.
  it("a table without border/error loads it from the Figma aliases, with a warning to export again", () => {
    const t = table();
    t.primitives["red/600"] = "#c50003";
    t.primitives["red/400"] = "#ff6c5c";
    t.primitives["red/300"] = "#ffa598";
    t.modes.light["colors/state/error"] = "red/600";
    t.modes.dark["colors/state/error-strong"] = "red/400";
    t.modes.brand["text/error"] = "red/300";
    for (const mode of ["light", "dark", "brand"] as const) delete t.modes[mode]["border/error"];
    const warnings: string[] = [];
    const theme = rdsThemeFromTable(t, { warn: (m) => warnings.push(m) });
    expect([theme.light, theme.dark, theme.brand].map((m) => m["--border-error"])).toEqual(["#c50003", "#ff6c5c", "#ffa598"]);
    expect(warnings[0]).toMatch(/exported before "border\/error"[\s\S]*Export the table again with figma\/export-brand\.js/);
    delete t.modes.dark["colors/state/error-strong"];
    expect(() => rdsThemeFromTable(t, { warn: () => {} })).toThrow(/dark: role "colors\/state\/error-strong" is missing[\s\S]*dark: role "border\/error" is missing/);
  });

  it("emits CSS with dark and plate carrying only what differs", () => {
    const css = emitRdsCss(rdsThemeFromTable(table()));
    expect(css).toContain(":root, .ds-scope, [data-rds-scope] {\n");
    expect(css).toMatch(/\.dark[^{]*\{\n {2}--colors-primary-default: #22bbf2;\n\}/);
    expect(css).toMatch(/\.ds-plate, \[data-rds-plate\] \{\n\n?\}/);
  });

  it("the brand's own variables come out as --<brand>-<name> in the light scope", () => {
    const t = { ...table(), vars: { "sample/cyan": "brandcyan/500", "sample/key": "#111111" } };
    const theme = rdsThemeFromTable(t);
    expect(theme.vars).toEqual({ "--sample-cyan": "#00aeef", "--sample-key": "#111111" });
    expect(emitRdsCss(theme)).toMatch(/:root, \.ds-scope, \[data-rds-scope\] \{[^}]*--sample-cyan: #00aeef;/);
    expect(() => rdsThemeFromTable({ ...t, vars: { "sample/x": "nope/1" } })).toThrow(/var "sample\/x" points to unknown primitive/);
  });
});
