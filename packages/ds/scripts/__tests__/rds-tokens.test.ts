import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RDS_TOKEN_SCOPE } from "@rojaostudio/ds-core/generate";
import {
  check, emitComponentsCss, emitThemeCss, foundationCss, loadAll, loadBrandTable, parseCollection, pathVar,
  RDS_LAYER_ORDER, TOKEN_SCOPE, tokenCss,
} from "../rds-tokens";

const roles = new Set(["text/body", "surface/card", "focus/ring"]);
const foundation = [{ name: "type/label/size", type: "F", value: "16", cssVar: "--type-label-size" }];

describe("rds-tokens checks", () => {
  it("fails an alias to a theme role that does not exist", () => {
    const t = parseCollection("forms", "input/value|C|@theme:text/nope|=");
    expect(check(t, roles, foundation, []).missingAlias).toEqual(["forms: input/value → @theme:text/nope"]);
  });

  it("fails an alias to a base token that does not exist", () => {
    const t = parseCollection("forms", "input/text/size|F|@base:type/nope/size|=");
    expect(check(t, roles, foundation, []).missingAlias).toHaveLength(1);
  });

  it("resolves an alias into the scale collection (space, size) against the foundation", () => {
    const f = [...foundation, { name: "space/16", type: "F", value: "16", cssVar: "--space-16" }];
    const ok = parseCollection("actions", "button/size/sm/padding-x|F|@scale:space/16|=");
    expect(check(ok, roles, f, []).missingAlias).toEqual([]);
    expect(tokenCss(ok[0])).toBe("var(--space-16)");
    const bad = parseCollection("actions", "button/size/sm/padding-x|F|@scale:space/17|=");
    expect(check(bad, roles, f, []).missingAlias).toHaveLength(1);
  });

  it("fails a var() that no layer defines, but not a local --_x or one declared in the file", () => {
    const t = parseCollection("forms", "input/value|C|@theme:text/body|=");
    const css = ".x { --_bg: red; --own: 1px; color: var(--input-value); background: var(--_bg); width: var(--own); border-color: var(--input-nope); }";
    expect(check(t, roles, foundation, [{ file: "components/input.css", css }]).orphanVars).toEqual([
      "components/input.css: --input-nope",
    ]);
  });

  it("accepts the --radix-* variables Radix sets at runtime", () => {
    const css = ".x { width: var(--radix-select-trigger-width); }";
    expect(check([], roles, foundation, [{ file: "components/select.css", css }]).orphanVars).toEqual([]);
  });

  it("fails a token of a component with a stylesheet that never uses it", () => {
    const t = parseCollection("forms", "input/value|C|@theme:text/body|=\ninput/hint|C|@theme:text/body|=");
    const css = "/* @tokens input */ .x { color: var(--input-value); }";
    expect(check(t, roles, foundation, [{ file: "a.css", css }]).unusedTokens).toEqual(["forms: input/hint"]);
  });

  it("fails a component stylesheet that reads a theme role directly", () => {
    const t = parseCollection("forms", "input/value|C|@theme:text/body|=");
    const css = "/* @tokens input */ .x { color: var(--input-value); background: var(--surface-card); }";
    expect(check(t, roles, foundation, [{ file: "a.css", css }]).themeRoleInComponent).toEqual(["a.css: --surface-card"]);
  });

  it("does not ask for components that have no stylesheet yet", () => {
    const t = parseCollection("forms", "input/value|C|@theme:text/body|=");
    expect(check(t, roles, foundation, []).unusedTokens).toEqual([]);
  });

  it("reports a codeSyntax that is not the path, and the CSS still uses the path", () => {
    const [t] = parseCollection("actions", "fab/cta/background/default|C|@theme:surface/card|--fab-cta-bg");
    expect(t.cssVar).toBe("--fab-cta-background-default");
    expect(check([t], roles, foundation, []).codeSyntaxDivergent).toHaveLength(1);
  });
});

describe("rds-tokens output", () => {
  it("a component token is var(--role); a raw number is px", () => {
    const [a, b] = parseCollection("forms", "input/value|C|@theme:text/body|=\nx/size|F|12|=");
    expect(tokenCss(a)).toBe("var(--text-body)");
    expect(tokenCss(b)).toBe("12px");
  });

  it("elevation resolves the shadow colour to the theme role", () => {
    expect(
      foundationCss({ name: "elevation/modal", type: "E", value: "0 24 48 -12 @theme:shadow/strong", cssVar: "--elevation-modal" }),
    ).toBe("0px 24px 48px -12px var(--shadow-strong)");
  });

  it("emits every token inside @layer rds.tokens", () => {
    const css = emitComponentsCss(parseCollection("forms", "input/value|C|@theme:text/body|="));
    expect(css).toContain("@layer rds.tokens");
    expect(css).toContain("--input-value: var(--text-body);");
  });
});

describe("styles/rds/theme.css is the Figma brand table of the Rojão, role by role", () => {
  const pkg = join(__dirname, "..", "..");
  const table = loadBrandTable(pkg, "rojao");
  const css = readFileSync(join(pkg, "styles", "rds", "theme.css"), "utf8");
  // The three blocks of the file (light, dark, plate), as declared.
  const blocks = [...css.matchAll(/\n([^\n{]+) \{\n([^}]*)\n\}/g)].map((m) =>
    Object.fromEntries([...m[2].matchAll(/^\s*(--[\w-]+): (.+);$/gm)].map((d) => [d[1], d[2]])),
  );
  // Dark and plate only carry what differs from light: the cascade fills in the rest.
  const resolved = { light: blocks[0], dark: { ...blocks[0], ...blocks[1] }, brand: { ...blocks[0], ...blocks[2] } };

  it("is the build output of the table (rebuild with pnpm build:rds)", () => {
    expect(css).toBe(emitThemeCss(table, () => {}));
    expect(blocks).toHaveLength(3);
  });

  it.each(["light", "dark", "brand"] as const)("%s: every role is the colour of the primitive Figma points to", (mode) => {
    const wrong: string[] = [];
    for (const [role, ref] of Object.entries(table.modes[mode])) {
      const expected = role === "type/font/mono" ? `"${ref}", monospace` : (table.primitives[ref] ?? ref).toLowerCase();
      const got = resolved[mode][pathVar(role)];
      if (got !== expected) wrong.push(`${role}: css ${got}, Figma ${expected} (${ref})`);
    }
    expect(wrong).toEqual([]);
    expect(Object.keys(table.modes[mode])).toHaveLength(103);
  });

  it("the brand's own variables (--rojao-*) are in the light scope", () => {
    for (const [name, ref] of Object.entries(table.vars ?? {}))
      expect(resolved.light[pathVar(name)]).toBe((table.primitives[ref] ?? ref).toLowerCase());
  });
});

describe("cascade layers", () => {
  const pkg = join(__dirname, "..", "..");
  it("rds.css and base.css declare the same order, rds.legacy first", () => {
    const decl = `@layer ${RDS_LAYER_ORDER};`;
    expect(RDS_LAYER_ORDER.split(", ")[0]).toBe("rds.legacy");
    expect(readFileSync(join(pkg, "styles", "rds.css"), "utf8")).toContain(decl);
    const base = readFileSync(join(pkg, "styles", "base.css"), "utf8");
    expect(base.indexOf(decl)).toBeGreaterThan(-1);
    expect(base.indexOf(decl)).toBeLessThan(base.search(/^@import/m));
    expect(base).toContain('@import "./_primitives.generated.css" layer(rds.legacy);');
  });

  it("base.css declares no variable and no rule outside a layer (Tailwind's @utility/@theme aside)", () => {
    const base = readFileSync(join(pkg, "styles", "base.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    // Walk the top level: every block is @layer, @utility or @theme.
    let depth = 0;
    const top: string[] = [];
    let buf = "";
    for (const ch of base) {
      if (ch === "{") {
        if (depth === 0) top.push(buf.trim().split("\n").pop()!.trim());
        depth++;
        buf = "";
      } else if (ch === "}") {
        depth--;
        buf = "";
      } else if (depth === 0) buf += ch;
    }
    expect(top.filter((h) => !/^@(layer|utility|theme)\b/.test(h))).toEqual([]);
  });

  it("the component tokens are redeclared on the selectors ds-core checks emitRdsCss against", () => {
    expect(TOKEN_SCOPE).toBe(RDS_TOKEN_SCOPE);
    expect(readFileSync(join(pkg, "styles", "rds", "components.css"), "utf8")).toContain(`${RDS_TOKEN_SCOPE} {`);
  });
});

describe("the real [RDS] extraction", () => {
  const all = loadAll(join(__dirname, "..", ".."));

  it("has the 990 component tokens of the 10 collections", () => {
    expect(all.tokens).toHaveLength(990);
  });

  it("has no alias to a missing role or base token", () => {
    expect(check(all.tokens, all.roles, all.foundation, all.stylesheets).missingAlias).toEqual([]);
  });

  it("every codeSyntax in Figma is the path with hyphens", () => {
    expect(check(all.tokens, all.roles, all.foundation, []).codeSyntaxDivergent).toEqual([]);
  });
});
