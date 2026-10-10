import { describe, expect, it } from "vitest";
import { emitRdsCss, generateRdsTheme, RDS_SCOPE_SELECTORS, RDS_TOKEN_SCOPE } from "../rdsTheme";
import { recipes } from "../../recipes";

const theme = generateRdsTheme(recipes.rojao);
/** The selector list before each `{`, block by block (light, dark, plate). */
const heads = (css: string) => [...css.matchAll(/^([^\n{]+) \{$/gm)].map((m) => m[1]);

describe("emitRdsCss scopes", () => {
  it("the default covers the classes and the generic attributes", () => {
    const dark =
      ':root.dark, .dark, :root[data-rds-mode="dark"], [data-rds-mode="dark"], .ds-scope.dark, .dark .ds-scope, ' +
      '.ds-scope[data-rds-mode="dark"], [data-rds-mode="dark"] .ds-scope, [data-rds-scope].dark, .dark [data-rds-scope], ' +
      '[data-rds-scope][data-rds-mode="dark"], [data-rds-mode="dark"] [data-rds-scope]';
    expect(heads(emitRdsCss(theme))).toEqual([
      ":root, .ds-scope, [data-rds-scope]",
      dark,
      ".ds-plate, [data-rds-plate]",
      // Print (#42): every selector above, light forced.
      "@media print",
      `:root, .ds-scope, [data-rds-scope], ${dark}, .ds-plate, [data-rds-plate]`,
    ]);
  });

  it("the selectors the component tokens cover are exported, as one list", () => {
    expect(RDS_TOKEN_SCOPE).toBe(RDS_SCOPE_SELECTORS.join(", "));
    expect(RDS_SCOPE_SELECTORS).toContain("[data-rds-scope]");
    expect(RDS_SCOPE_SELECTORS).toContain("[data-rds-mode]");
  });

  it("next-themes with attribute=data-theme: a dark selector anchored at the root is used as is", () => {
    const css = emitRdsCss(theme, { scope: ":root", dark: ':root[data-theme="dark"]' });
    expect(heads(css)[1]).toBe(':root[data-theme="dark"]');
    expect(emitRdsCss(theme, { scope: ":root", dark: "html.dark" })).toContain("html.dark {");
  });

  it("an own scope works when it carries the attribute the tokens cover", () => {
    const css = emitRdsCss(theme, { scope: ".my-scope[data-rds-scope]", dark: '[data-rds-mode="dark"]' });
    expect(heads(css)).toEqual([
      ".my-scope[data-rds-scope]",
      '.my-scope[data-rds-scope][data-rds-mode="dark"], [data-rds-mode="dark"] .my-scope[data-rds-scope]',
      ".ds-plate, [data-rds-plate]",
      "@media print",
      '.my-scope[data-rds-scope], .my-scope[data-rds-scope][data-rds-mode="dark"], ' +
        '[data-rds-mode="dark"] .my-scope[data-rds-scope], .ds-plate, [data-rds-plate]',
    ]);
    expect(() => emitRdsCss(theme, { scope: '[data-rds-scope="my-brand"]' })).not.toThrow();
  });

  it("throws, naming the selector and the way out, when the components would keep the root colours", () => {
    expect(() => emitRdsCss(theme, { scope: ".my-scope" })).toThrow(/"\.my-scope"[\s\S]*not covered[\s\S]*data-rds-scope/);
    // A bare [data-theme=dark] also matches a nested element, where the tokens are not redeclared.
    expect(() => emitRdsCss(theme, { dark: '[data-theme="dark"]' })).toThrow(/\[data-theme="dark"\][\s\S]*:root\[data-theme="dark"\]/);
    expect(() => emitRdsCss(theme, { plate: ".hero" })).toThrow(/"\.hero" is not covered/);
    // .darker is not .dark.
    expect(() => emitRdsCss(theme, { dark: ".darker" })).toThrow(/not covered/);
  });

  it("allowUncovered emits anyway, for a theme read without the components", () => {
    expect(emitRdsCss(theme, { scope: ".my-scope", allowUncovered: true })).toContain(".my-scope {");
  });
});
