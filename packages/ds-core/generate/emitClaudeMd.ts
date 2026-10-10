/**
 * emitClaudeMd.ts — a brand → the rules file (CLAUDE.md / .cursorrules / AGENTS.md) that teaches
 * the AI (Claude Code, Cursor, any agent) to build with the brand on Rojão DS 2.0.
 *
 * 2.0 (issue #5): the file describes the [RDS] setup — components with their own CSS
 * (`@rojaostudio/ds/styles/rds.css`), the generated theme file imported after it, the theme roles
 * (`--surface-card`, `--text-on-primary`…) and the foundation tokens (`--space-*`, `--radius-*`,
 * `--type-*`). The 1.x text (Tailwind utilities, base.css, `theme-<name>`, shadcn mapping) is gone:
 * no component reads it any more.
 *
 * The input is either a recipe (BrandDef, theme derived by `generateRdsTheme`) or a brand table
 * exported from Figma (`rdsThemeFromTable`). Colours in the table are the theme's own hex values,
 * so the AI "sees" the brand. Pure (no I/O).
 */
import { generateRdsTheme, RDS_MEDIA_TYPE, rdsThemeFromTable, roleVar, type RdsBrandTable, type RdsTheme } from "./rdsTheme";
import type { BrandDef } from "../tokens/recipe.schema";
import { assertSafeTheme, oneLine, preview } from "./validate";

export type ClaudeMdTarget = "claude" | "cursor" | "agents";

export interface ClaudeMdOptions {
  /** URL of a hosted theme stylesheet, if any. No default: the theme is a local file. */
  cssUrl?: string;
  /** Name of the local theme file the consumer imports. Default `rds-theme.css`. */
  cssFile?: string;
  /** The theme, if it was already generated. Default: derived from the input. */
  theme?: RdsTheme;
  /** File the text is written to (only the footer changes). Default `claude`. */
  target?: ClaudeMdTarget;
  /**
   * The install command shown in the setup, as the consumer's package manager runs it
   * (`npm install @rojaostudio/ds@next`). Default `pnpm add @rojaostudio/ds`.
   */
  install?: string;
}

/** The markers the CLI writes the block between. The generated text never carries them. */
const MARKERS = /rojao-ds:(start|end)/i;
/** A brand name, as shown in the title. */
const NAME = /^[a-z0-9][a-z0-9 _-]{0,63}$/i;
/** A theme file path for `@import "./…"`: path characters only. */
const CSS_FILE = /^[a-z0-9_@./-]+\.css$/i;
/** A hosted theme: an http(s) URL with nothing that leaves `url("…")` or a code span. */
const CSS_URL = /^https?:\/\/[^\s"'`<>()\\]+$/i;
/** `<pm> add|install @rojaostudio/ds[@tag-or-version]`. */
const INSTALL = /^(?:pnpm add|yarn add|bun add|npm install|npm i) @rojaostudio\/ds(?:@[a-z0-9][a-z0-9.+-]*)?$/;

/** Main theme roles, with what each one is for. */
const ROLE_DOCS: { role: string; use: string }[] = [
  { role: "colors/primary/default", use: "neutral ink fill: neutral Button and Badge, bars, Tooltip" },
  { role: "text/on/primary", use: "text/icon on the neutral ink fill" },
  { role: "colors/primary/active", use: "pressed neutral ink fill" },
  { role: "colors/secondary/default", use: "action fill: the default Button, checkbox, switch (with `--text-on-secondary`)" },
  { role: "colors/accent/default", use: "highlight — sparingly (with `--text-on-accent`)" },
  { role: "surface/page", use: "page background" },
  { role: "surface/card", use: "cards" },
  { role: "surface/panel", use: "panels, side areas" },
  { role: "surface/muted", use: "muted areas, wells" },
  { role: "surface/tint/default", use: "selected / tinted fill (with `--text-on-tint`)" },
  { role: "border/default", use: "dividers, card borders" },
  { role: "border/strong", use: "control borders, emphasis" },
  { role: "focus/ring", use: "focus ring" },
  { role: "text/heading", use: "headings" },
  { role: "text/body", use: "body text" },
  { role: "text/muted", use: "supporting text" },
  { role: "text/subtle", use: "captions, metadata" },
  { role: "text/link", use: "links" },
  { role: "colors/state/error", use: "error fill (with `--text-on-error`)" },
  { role: "text/error", use: "error message text" },
  { role: "colors/state/success", use: "success fill (with `--text-on-success`)" },
  { role: "colors/state/warning", use: "warning fill (with `--text-on-warning`)" },
];

/**
 * Components named in the file, by module (`@rojaostudio/ds/components/<module>`). A short list on
 * purpose: the AI learns the import shape, not the catalogue. The ds-core tests check that each
 * module exists in @rojaostudio/ds.
 */
export const CLAUDE_MD_COMPONENTS = [
  "button", "icon-button", "tooltip", "input", "textarea", "select", "checkbox", "radio-group", "switch",
  "card", "dialog", "sheet", "tabs", "table", "toast", "badge", "alert", "avatar", "dropdown-menu",
  "page-header", "sidebar", "empty", "skeleton", "pagination",
] as const;

/** Foundation tokens named in the file. The ds-core tests check them against figma/foundation.txt. */
export const CLAUDE_MD_FOUNDATION = {
  space: ["--space-4", "--space-8", "--space-12", "--space-16", "--space-24", "--space-32", "--space-40", "--space-48", "--space-56", "--space-64"],
  radius: ["--radius-xs", "--radius-control", "--radius-field", "--radius-card", "--radius-container", "--radius-full"],
  type: ["heading", "lead", "body", "label", "button", "small", "caption"],
  font: "--type-font-stack",
} as const;

function isTable(x: BrandDef | RdsBrandTable): x is RdsBrandTable {
  return typeof x === "object" && x !== null && "modes" in x && "primitives" in x;
}

const TARGET_FILES: Record<ClaudeMdTarget, string> = { claude: "CLAUDE.md", cursor: ".cursorrules", agents: "AGENTS.md" };

function fileLabel(target: ClaudeMdTarget): string {
  return TARGET_FILES[target];
}

function roleTable(theme: RdsTheme): string {
  const rows = ROLE_DOCS.filter((r) => roleVar(r.role) in theme.light).map((r) => {
    const v = roleVar(r.role);
    return `| \`${v}\` | ${r.use} | \`${theme.light[v]}\` | \`${theme.dark[v] ?? theme.light[v]}\` |`;
  });
  return ["| Token | Use for | Light | Dark |", "|---|---|---|---|", ...rows].join("\n");
}

export function emitClaudeMd(source: BrandDef | RdsBrandTable, opts: ClaudeMdOptions = {}): string {
  const theme = opts.theme ?? (isTable(source) ? rdsThemeFromTable(source) : generateRdsTheme(source));
  // The text is read by an AI agent as instructions: nothing reaches it without passing the allow lists.
  assertSafeTheme(theme, "emitClaudeMd");
  const name = source.name;
  if (name !== undefined && name !== "" && !(typeof name === "string" && NAME.test(name)))
    throw new Error(`emitClaudeMd: name ${preview(name)} is not valid (letters, digits, space, "-" and "_", up to 64)`);
  const Name = name ? name[0].toUpperCase() + name.slice(1) : "Brand";
  const desc = !isTable(source) ? oneLine(source.description) : "";
  const description = desc ? ` — ${desc}` : "";
  const cssFile = opts.cssFile ?? "rds-theme.css";
  if (!CSS_FILE.test(cssFile)) throw new Error(`emitClaudeMd: cssFile ${preview(cssFile)} is not a valid .css path`);
  if (opts.cssUrl !== undefined && !CSS_URL.test(opts.cssUrl))
    throw new Error(`emitClaudeMd: cssUrl ${preview(opts.cssUrl)} is not a valid http(s) URL`);
  const install = opts.install ?? "pnpm add @rojaostudio/ds";
  if (!INSTALL.test(install)) throw new Error(`emitClaudeMd: install ${preview(install)} is not an install command of @rojaostudio/ds`);
  const target = opts.target ?? "claude";
  if (!Object.prototype.hasOwnProperty.call(TARGET_FILES, target)) throw new Error(`emitClaudeMd: unknown target ${preview(target)}`);
  const f = CLAUDE_MD_FOUNDATION;
  const own = theme.vars ? Object.keys(theme.vars) : [];

  const themeImport = opts.cssUrl
    ? `@import "@rojaostudio/ds/styles/rds.css";
@import url("${opts.cssUrl}"); /* the brand theme, AFTER rds.css */`
    : `@import "@rojaostudio/ds/styles/rds.css";
@import "./${cssFile}"; /* the brand theme, AFTER rds.css */`;

  const text = `# Design System — ${Name}

> This project uses **Rojão DS 2.0** with the **${Name}** brand${description}. When you build any
> UI — components, pages, screens — follow the rules below so every screen looks like the same
> product. Do not invent colors, fonts, spacing or radii.

## Setup (once per app)
\`\`\`bash
${install}
\`\`\`
\`\`\`css
/* root stylesheet */
${themeImport}
\`\`\`
- \`rds.css\` carries the tokens and every component's styles, in cascade layers
  (\`rds.theme\`, \`rds.tokens\`, \`rds.components\`). No Tailwind, no other stylesheet.
- ${opts.cssUrl ? `The theme is served from \`${opts.cssUrl}\`.` : `\`${cssFile}\` is the brand theme, generated — a file **you own**; commit it. Regenerate it
  with \`npx rojao-ds init\` instead of editing it by hand.`}
- Dark mode: \`class="dark"\` on \`<html>\` (or any element). Light AND dark are first-class.
- Brand plate: \`class="ds-plate"\` on a section paints it with the brand color; the roles inside
  flip so text and components stay legible.
- Print: the theme already carries \`@media print\` (light forced, white backgrounds, no shadows, even
  under \`.dark\` or \`.ds-plate\`). Components keep their type; for your printed sheet use
  \`--media-type-<role>-size\` / \`--media-type-<role>-line\` (${RDS_MEDIA_TYPE.map((m) => `\`${m.role}\``).join(" · ")}):
  the screen type on screen, points on paper.

## Components first
Use the design system components before writing your own markup. Import each from its own path:
\`\`\`tsx
import { Button } from "@rojaostudio/ds/components/button";
import { IconButton } from "@rojaostudio/ds/components/icon-button";
import { Tooltip } from "@rojaostudio/ds/components/tooltip";
\`\`\`
Available, among others: ${CLAUDE_MD_COMPONENTS.map((c) => `\`${c}\``).join(" · ")}.
- Components bring their own CSS (inside \`rds.css\`). Don't restyle their internals, don't wrap
  them in Tailwind classes, don't rebuild them with shadcn/ui.
- Every \`IconButton\` goes inside a \`Tooltip\` with the same text as its \`label\`.

## Theme roles — ALWAYS use these in your own CSS, NEVER hardcode a color
They already flip between light, dark and the brand plate.
${roleTable(theme)}

Every role pairs a fill with its \`--text-on-*\` text. Example:
\`\`\`css
.panel { background: var(--surface-card); color: var(--text-body);
         border: var(--border-width) solid var(--border-default);
         border-radius: var(--radius-card); padding: var(--space-16); }
\`\`\`${own.length ? `

Brand's own variables (same value in every mode): ${own.map((v) => `\`${v}\``).join(" · ")}.` : ""}

## Foundation tokens
- **Spacing** (padding, margin, gap) — ONLY: ${f.space.map((v) => `\`${v}\``).join(" · ")}
- **Radius:** ${f.radius.map((v) => `\`${v}\``).join(" · ")}
- **Type** — \`--type-<style>-size\` / \`--type-<style>-line\`, styles: ${f.type.map((v) => `\`${v}\``).join(" · ")}
- **Font:** \`font-family: var(${f.font})\` — never substitute.

## Rules (do / don't)
- ✅ Primary action = \`Button\` (tone action paints \`--colors-secondary-default\` + \`--text-on-secondary\`).
- ✅ Page uses \`--surface-page\`; cards \`--surface-card\`; body text \`--text-body\`.
- ✅ \`--colors-accent-default\` is the highlight — use it sparingly.
- ✅ Spacing, radius and type come ONLY from the foundation tokens above.
- ✅ Your own CSS is unlayered, so it already wins over the design system — no \`!important\`.
- ❌ Never write a raw hex (\`#000\`) or a Tailwind palette class (\`bg-emerald-500\`) in a component.
- ❌ Never use a brand fill as a border or as text on a surface: contrast is guaranteed only for a
  fill + its \`--text-on-*\`.
- ❌ Never hardcode dark-mode colors — the roles already flip. Don't add a second accent color.
- ❌ Don't use the 1.x stylesheet (\`styles/base.css\`), its utilities (\`bg-surface-*\`, \`text-fg-*\`) or
  \`theme-<name>\` classes.

<!-- Generated by Rojão DS (npx rojao-ds init) — file: ${fileLabel(target)}. Claude Code, Cursor and other agents read it from the project root. -->
`;
  // Last line of defence: the block the CLI merges must never carry its own markers.
  if (MARKERS.test(text)) throw new Error("emitClaudeMd: the generated text contains a rojao-ds marker");
  return text;
}
