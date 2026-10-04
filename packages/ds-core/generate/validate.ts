/**
 * validate.ts — what the emitters accept from the outside (a recipe, a brand table, a theme object).
 *
 * ds-core is a public API, and its output lands in a stylesheet (`emitRdsCss`) and in the rules file an AI agent
 * reads (`emitClaudeMd`). A value that is not a colour could close the CSS rule and open another one, pull an
 * `url()`, or carry an instruction into CLAUDE.md. So every value is checked against an allow list before it is
 * written, and the check runs again in each emitter (defence in depth: a theme object can be built by hand).
 *
 * Allow lists, never deny lists: a colour is a hex or a closed `rgb()/rgba()/oklch()`; a variable name is lowercase
 * words joined by `-` or `/`; a font family has no quote, semicolon, brace, backslash or line break.
 */

/** `#rgb` … `#rrggbbaa`. */
const HEX = /^#[0-9a-f]{3,8}$/i;
/** One channel: a number (optionally signed, decimal, exponent) with an optional % or deg, or `none`. */
const CH = String.raw`(?:[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:%|deg)?|none)`;
/** `rgb(…)`, `rgba(…)`, `oklch(…)`: 3 or 4 channels, separated by spaces, commas or the alpha slash. Nothing else. */
const COLOR_FN = new RegExp(String.raw`^(?:rgba?|oklch)\(\s*${CH}(?:\s*[,/]?\s*${CH}){2,3}\s*\)$`, "i");
/** A variable or primitive name: `marca/ciano`, `colors-primary-default`, `black/a10`. */
const VAR_NAME = /^[a-z0-9]+(?:[/-][a-z0-9]+)*$/;
/** What a font family may not carry: it is written inside `"…"` in the stylesheet. */
// eslint-disable-next-line no-control-regex -- control characters are exactly what is refused
const FONT_BAD = /["';{}\\<>\u0000-\u001f\u007f]/;

export const isSafeColor = (v: unknown): v is string => typeof v === "string" && (HEX.test(v) || COLOR_FN.test(v));
export const isSafeVarName = (v: unknown): v is string => typeof v === "string" && VAR_NAME.test(v);
export const isSafeFont = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= 100 && !FONT_BAD.test(v);

/** A CSS custom property name built from a safe name: `--` + the name with `/` as `-`. */
const isSafeCustomProperty = (k: string) => k.startsWith("--") && isSafeVarName(k.slice(2));

/** The role whose value is a font family, not a colour. */
export const FONT_ROLE_VAR = "--type-font-mono";

/** Shows a hostile value in an error without echoing it whole (it may be long, or carry a line break). */
export function preview(v: unknown): string {
  const s = typeof v === "string" ? v : JSON.stringify(v) ?? String(v);
  const one = s.replace(/[\r\n\t]+/g, " ");
  return JSON.stringify(one.length > 60 ? `${one.slice(0, 60)}…` : one);
}

/** Thrown when an input fails the allow list. The message lists every field that failed. */
export class RdsValidationError extends Error {
  constructor(where: string, readonly problems: string[]) {
    super(`${where}: invalid input\n  ${problems.join("\n  ")}`);
    this.name = "RdsValidationError";
  }
}

/** Collects problems; `done` throws once with all of them. */
export function collector(where: string) {
  const problems: string[] = [];
  return {
    problems,
    color(field: string, v: unknown) {
      if (!isSafeColor(v)) problems.push(`${field}: ${preview(v)} is not a colour (hex, rgb(), rgba() or oklch())`);
    },
    name(field: string, v: unknown) {
      if (!isSafeVarName(v)) problems.push(`${field}: ${preview(v)} is not a valid name (lowercase letters, digits, "-" and "/")`);
    },
    font(field: string, v: unknown) {
      if (!isSafeFont(v)) problems.push(`${field}: ${preview(v)} is not a valid font family (no quotes, ";", braces, "\\" or line breaks)`);
    },
    done() {
      if (problems.length) throw new RdsValidationError(where, problems);
    },
  };
}

type ThemeLike = { light?: unknown; dark?: unknown; brand?: unknown; vars?: unknown };

/**
 * Checks a whole theme before it is written: every key is a safe custom property, every value a safe colour
 * (`--type-font-mono`, a safe font family). Throws an RdsValidationError listing every field that fails.
 */
export function assertSafeTheme(theme: ThemeLike, where: string): void {
  const c = collector(where);
  if (!theme || typeof theme !== "object") {
    c.problems.push("the theme is not an object");
    c.done();
  }
  const check = (label: string, map: unknown, fontRole: boolean) => {
    if (!map || typeof map !== "object" || Array.isArray(map)) {
      c.problems.push(`${label}: not an object`);
      return;
    }
    for (const [k, v] of Object.entries(map as Record<string, unknown>)) {
      if (!isSafeCustomProperty(k)) {
        c.problems.push(`${label}: ${preview(k)} is not a valid CSS variable name`);
        continue;
      }
      if (fontRole && k === FONT_ROLE_VAR) c.font(`${label}.${k}`, v);
      else c.color(`${label}.${k}`, v);
    }
  };
  for (const mode of ["light", "dark", "brand"] as const) check(mode, theme[mode], true);
  // A brand variable is always a colour, even one named like the font role.
  if (theme.vars !== undefined) check("vars", theme.vars, false);
  c.done();
}

/** A CSS selector list given to emitRdsCss: no brace, semicolon, comment, backslash, at-rule or line break. */
export const isSafeSelectorList = (v: unknown): boolean =>
  // eslint-disable-next-line no-control-regex -- control characters are exactly what is refused
  typeof v === "string" && v.trim().length > 0 && !/[{};\\<@\u0000-\u001f\u007f]|\/\*|\*\//.test(v);

/**
 * Free text written into the rules file (a recipe's description): one line, no `<`, `>` or backtick (no HTML
 * comment, no marker, no code span to break out of), at most `max` characters.
 */
export function oneLine(v: unknown, max = 200): string {
  if (typeof v !== "string") return "";
  let s = v
    // eslint-disable-next-line no-control-regex -- control characters are exactly what is refused
    .replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ")
    .replace(/[<>`]/g, "")
    .replace(/rojao-ds:(start|end)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length > max) s = `${s.slice(0, max - 1).trimEnd()}…`;
  return s;
}
