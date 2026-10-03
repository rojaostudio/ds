import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CLAUDE_MD_COMPONENTS, CLAUDE_MD_FOUNDATION, emitClaudeMd } from "../emitClaudeMd";
import { generateRdsTheme, ROLES, roleVar, type RdsBrandTable } from "../rdsTheme";
import type { BrandDef } from "../../tokens/recipe.schema";

const def: BrandDef = {
  name: "acme",
  brand: { primary: "#7C3AED" },
  surface: "zinc",
  text: "zinc",
  fonts: { body: "inter" },
};

const pkgRoot = join(__dirname, "..", "..");
const foundation = readFileSync(join(pkgRoot, "figma", "foundation.txt"), "utf8");
const foundationVars = new Set(
  foundation
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("|")[3])
    .filter(Boolean),
);

describe("emitClaudeMd — 2.0 ([RDS])", () => {
  const md = emitClaudeMd(def);

  it("describes rds.css + the generated theme, imported after it", () => {
    expect(md).toContain('@import "@rojaostudio/ds/styles/rds.css";');
    expect(md).toContain('@import "./rds-theme.css";');
    expect(md.indexOf("styles/rds.css")).toBeLessThan(md.indexOf("./rds-theme.css"));
    expect(md).toContain("pnpm add @rojaostudio/ds");
  });

  it("no longer teaches the 1.x setup", () => {
    expect(md).not.toMatch(/@import "tailwindcss"/);
    expect(md).not.toMatch(/--brand-primary|--surface-default|theme-acme/);
    expect(md).not.toMatch(/Use with shadcn/);
  });

  it("shows the theme's own colours, light and dark", () => {
    const theme = generateRdsTheme(def);
    const v = roleVar("colors/primary/default");
    expect(md).toContain(`| \`${v}\` | primary action, brand fills | \`${theme.light[v]}\` | \`${theme.dark[v]}\` |`);
  });

  it("every theme var it names is a real [RDS] role", () => {
    const roles = new Set(ROLES.map(([r]) => roleVar(r)));
    const named = [...md.matchAll(/`(--(?:colors|surface|text|border|focus)-[a-z0-9-]+)`/g)].map((m) => m[1]);
    expect(named.length).toBeGreaterThan(10);
    expect(named.filter((n) => !roles.has(n))).toEqual([]);
  });

  it("every foundation token it names exists in figma/foundation.txt", () => {
    const names = [
      ...CLAUDE_MD_FOUNDATION.space,
      ...CLAUDE_MD_FOUNDATION.radius,
      CLAUDE_MD_FOUNDATION.font,
      "--border-width",
      ...CLAUDE_MD_FOUNDATION.type.flatMap((t) => [`--type-${t}-size`, `--type-${t}-line`]),
    ];
    expect(names.filter((n) => !foundationVars.has(n))).toEqual([]);
  });

  it("every component it names exists in @rojaostudio/ds", () => {
    const dir = join(pkgRoot, "..", "ds", "components");
    expect(CLAUDE_MD_COMPONENTS.filter((c) => !existsSync(join(dir, `${c}.tsx`)))).toEqual([]);
  });

  it("takes the theme file name, a hosted URL and the target", () => {
    expect(emitClaudeMd(def, { cssFile: "marca.css" })).toContain('@import "./marca.css";');
    expect(emitClaudeMd(def, { cssUrl: "https://example.com/t.css" })).toContain('@import url("https://example.com/t.css");');
    expect(emitClaudeMd(def, { target: "cursor" })).toContain("file: .cursorrules");
    expect(emitClaudeMd(def, { target: "agents" })).toContain("file: AGENTS.md");
    expect(md).toContain("file: CLAUDE.md");
  });

  it("accepts a brand table from Figma", () => {
    const mode = Object.fromEntries(
      ROLES.map(([r]) => [r, r === "type/font/mono" ? "Roboto Mono" : r === "colors/primary/default" ? "brand/500" : "zinc/500"]),
    );
    const table: RdsBrandTable = {
      $schema: "rds-brand-table/1",
      name: "sample",
      primitives: { "brand/500": "#00AEEF", "zinc/500": "#71717a" },
      modes: { light: mode, dark: mode, brand: mode },
      vars: { "sample/cyan": "brand/500" },
    };
    const out = emitClaudeMd(table);
    expect(out).toContain("# Design System — Sample");
    expect(out).toContain("`#00aeef`");
    expect(out).toContain("`--sample-cyan`");
  });
});
