/**
 * rdsTheme.ts — BrandDef → the theme roles of the Figma [RDS] (2.0, issue #13).
 *
 * The [RDS] theme collection has three modes (light, dark, brand). Each role points to a token of
 * the `base` collection, and `base` is drawn per brand from a handful of ramps: the brand's
 * primary, secondary and accent, one neutral, one link/action hue, and fixed state ramps. The
 * rules below are that drawing, written down once, so any brand colour produces the whole set.
 *
 * Source of truth: packages/ds-core/figma/theme.txt (the role → base mapping, extracted from
 * Figma). The test rds-theme.test.ts fails if ROLES drifts from it.
 *
 * Text that sits on a brand fill (text/on/*) is never copied from the template: it is picked by
 * contrast, so a light brand colour gets dark text and the pair always clears WCAG AA.
 */
import { primitives } from "../tokens";
import type { BrandDef, ColorRef } from "../tokens/recipe.schema";
import { buildScale, contrastRatio, isHex, onColor, refToHex, type Scale, type ScaleStep } from "./scale";

export type RdsMode = "light" | "dark" | "brand";
export type RdsTheme = Record<RdsMode, Record<string, string>>;

type PaletteMap = Record<string, Record<number, string> | string>;
const palettes = primitives.color as PaletteMap;

const WHITE = "#ffffff";
const BLACK = "#000000";
/** black/white with alpha, as 8-digit hex (the [RDS] Primitives `black/aNN`, `white/aNN`). */
const black = (pct: number) => BLACK + Math.round((pct / 100) * 255).toString(16).padStart(2, "0");
const white = (pct: number) => WHITE + Math.round((pct / 100) * 255).toString(16).padStart(2, "0");

function palette(name: string): Scale {
  const p = palettes[name];
  if (!p || typeof p === "string") throw new Error(`rdsTheme: unknown palette "${name}"`);
  return p as Scale;
}

/** A brand colour as a ramp plus its own value. Palette ref → that palette; hex → derived ramp. */
function ramp(c: ColorRef): { base: string; scale: Scale } {
  if (isHex(c)) return { base: c, scale: buildScale(c) };
  const m = c.match(/^([a-zA-Z]+)-(\d{2,3})$/);
  if (m) return { base: refToHex(c) ?? palette(m[1])[Number(m[2]) as ScaleStep], scale: palette(m[1]) };
  const hex = refToHex(c);
  if (!hex) throw new Error(`rdsTheme: cannot resolve colour "${c}"`);
  return { base: hex, scale: buildScale(hex) };
}

/** Best text colour on a fill: white or black, whichever contrasts more. */
const on = (bg: string) => onColor(bg);

/**
 * Roles of the [RDS] theme collection, in Figma order: [name, dark source, brand source].
 * The light mode always reads the plain base token. In dark and brand, Figma points either to the
 * mode's own variant (`d` = base dark/…, `b` = base brand/…) or back to another one (`l` = plain).
 */
export const ROLES: ReadonlyArray<readonly [string, "l" | "d", "l" | "d" | "b"]> = [
  ["colors/primary/light", "d", "b"], ["colors/primary/default", "d", "b"], ["colors/primary/dark", "d", "b"],
  ["colors/secondary/light", "d", "b"], ["colors/secondary/default", "d", "b"], ["colors/secondary/active", "d", "b"],
  ["colors/accent/highlight", "d", "d"], ["colors/accent/default", "d", "d"], ["colors/accent/hover", "d", "d"],
  ["colors/accent/invert", "l", "l"],
  ["text/heading", "d", "b"], ["text/body", "d", "b"], ["text/link", "d", "b"],
  ["surface/page", "d", "b"], ["surface/card", "d", "b"], ["surface/panel", "d", "b"],
  ["border/default", "d", "b"], ["surface/tint/default", "d", "b"], ["text/on/action-tonal", "d", "b"],
  ["text/on/primary", "d", "b"], ["text/on/secondary", "d", "b"], ["text/on/accent", "d", "d"],
  ["text/on/tint", "d", "b"], ["colors/state/error", "l", "l"], ["colors/state/error-strong", "d", "d"],
  ["surface/tint/strong", "d", "b"], ["text/on/error", "l", "l"],
  ["surface/action/default", "d", "b"], ["surface/action/strong", "d", "b"],
  ["focus/ring", "d", "b"], ["focus/ring-inset", "d", "b"], ["surface/disabled", "d", "b"],
  ["text/disabled", "d", "b"], ["text/muted", "d", "b"], ["text/disabled-invert", "d", "b"],
  ["text/action", "d", "b"], ["surface/lift/action", "d", "b"], ["text/on/lift-action", "d", "b"],
  ["surface/lift/action-strong", "d", "b"], ["surface/band/action", "l", "l"], ["surface/band/base", "l", "l"],
  ["text/on/band-action", "l", "l"], ["text/on/band-base", "l", "l"], ["text/on/primary-strong", "d", "b"],
  ["colors/accent/logo", "l", "l"], ["surface/band/mark-action", "l", "l"], ["surface/band/mark-base", "l", "l"],
  ["colors/secondary/hover", "d", "b"], ["colors/state/success", "l", "l"], ["text/on/success", "l", "l"],
  ["colors/state/success-strong", "d", "d"], ["surface/cover", "l", "l"], ["text/on/cover", "l", "l"],
  ["text/subtle", "d", "b"], ["surface/muted", "d", "b"], ["surface/error", "d", "d"],
  ["colors/primary/active", "d", "b"], ["surface/muted-strong", "d", "b"], ["colors/state/error-active", "l", "l"],
  ["text/error", "d", "d"], ["surface/error-strong", "d", "d"], ["border/strong", "d", "b"],
  ["border/strong-hover", "d", "b"], ["colors/state/info", "l", "l"], ["text/on/info", "l", "l"],
  ["colors/state/warning", "l", "l"], ["colors/state/warning-strong", "d", "d"], ["text/on/warning", "l", "l"],
  ["colors/state/neutral", "l", "l"], ["text/on/neutral", "l", "l"], ["surface/success", "d", "d"],
  ["text/success", "d", "d"], ["surface/info", "d", "d"], ["text/info", "d", "d"],
  ["surface/warning", "d", "d"], ["text/warning", "d", "d"], ["surface/neutral", "d", "d"],
  ["text/neutral", "d", "d"], ["chart/series/1", "d", "d"], ["chart/series/2", "d", "d"],
  ["chart/series/3", "d", "d"], ["chart/series/4", "d", "d"], ["chart/series/5", "d", "d"],
  ["colors/accent/mark", "d", "d"], ["text/on/accent-mark", "d", "d"], ["type/font/mono", "l", "l"],
  ["surface/scrim", "d", "d"], ["shadow/ambient", "d", "d"], ["shadow/key", "d", "d"], ["shadow/strong", "d", "d"],
  ["logo/primary", "d", "d"], ["logo/accent", "d", "d"], ["logo/signature", "d", "d"],
  ["logo/accent-2", "l", "l"], ["logo/accent-3", "l", "l"], ["logo/mono", "d", "d"],
  ["logo/inverse", "l", "l"], ["logo/inverse-signature", "l", "l"], ["social/ink", "d", "d"],
  ["colors/state/info-strong", "d", "d"], ["colors/state/neutral-strong", "d", "d"],
  ["text/on/primary-subtle", "d", "b"], ["surface/tint/subtle", "d", "b"],
];

/** The tint steps of the base collection. `surface/tint/subtle` sits one step lighter than the default. */
const TINT_DEFAULT: ScaleStep = 200;
const lighterStep = (s: ScaleStep): ScaleStep => (s >= 200 ? ((s - 100) as ScaleStep) : 50);

/** CSS custom property of a role: the Figma path with hyphens (the [RDS] codeSyntax rule). */
export const roleVar = (role: string) => `--${role.replaceAll("/", "-")}`;

export function generateRdsTheme(def: BrandDef): RdsTheme {
  const b = def.brand;
  const P = ramp(b.primary);
  const S = b.secondary ? ramp(b.secondary) : P;
  const A = b.accent ? ramp(b.accent) : P;
  const N = palette(def.text && palettes[def.text] && typeof palettes[def.text] !== "string" ? def.text : "zinc");
  const L = palette("blue");
  const red = palette("red"), green = palette("green"), orange = palette("orange");
  const teal = palette("teal"), purple = palette("purple");
  const heading = b.heading ? ramp(b.heading).base : P.base;
  const invert = b.invert ? ramp(b.invert).base : WHITE;

  // base — plain (light) tokens.
  const l: Record<string, string> = {
    "colors/primary/light": P.scale[500], "colors/primary/default": P.base, "colors/primary/dark": P.scale[900],
    "colors/primary/active": P.scale[600],
    "colors/secondary/light": S.scale[500], "colors/secondary/default": S.base, "colors/secondary/active": S.scale[800],
    "colors/secondary/hover": S.scale[700],
    "colors/accent/highlight": A.scale[200], "colors/accent/default": A.base, "colors/accent/hover": A.scale[400],
    "colors/accent/invert": invert, "colors/accent/logo": A.scale[300], "colors/accent/mark": A.scale[400],
    "text/heading": heading, "text/body": N[800], "text/link": L[600], "text/muted": N[700], "text/subtle": N[600],
    "text/action": L[700], "text/disabled": black(40), "text/disabled-invert": white(40),
    "surface/page": N[100], "surface/card": WHITE, "surface/panel": N[50], "surface/muted": N[100],
    "surface/muted-strong": N[200], "surface/disabled": black(10), "surface/scrim": black(50),
    "border/default": N[200], "border/strong": N[500], "border/strong-hover": N[600],
    "surface/tint/default": A.scale[TINT_DEFAULT], "surface/tint/strong": A.scale[300], "text/on/tint": BLACK,
    // Light selection fill (pressed Toggle, choice tile): one step lighter than the default tint
    // (200 → 100, 100 → 50).
    "surface/tint/subtle": A.scale[lighterStep(TINT_DEFAULT)],
    "surface/action/default": L[100], "surface/action/strong": L[200], "text/on/action-tonal": P.scale[700],
    "surface/lift/action": P.scale[50], "surface/lift/action-strong": L[100],
    "surface/band/action": L[100], "surface/band/base": L[100], "text/on/band-action": BLACK, "text/on/band-base": BLACK,
    "surface/band/mark-action": L[500], "surface/band/mark-base": L[500],
    "surface/cover": A.base, "focus/ring": N[800], "focus/ring-inset": WHITE,
    "text/on/primary-subtle": white(30),
    "colors/state/error": red[600], "colors/state/error-strong": red[800], "colors/state/error-active": red[900],
    "colors/state/success": green[400], "colors/state/success-strong": green[600],
    "colors/state/warning": orange[400], "colors/state/warning-strong": orange[500],
    "colors/state/info": L[500], "colors/state/info-strong": L[500],
    "colors/state/neutral": N[600], "colors/state/neutral-strong": N[600],
    "surface/error": red[100], "surface/error-strong": red[200], "text/error": red[800],
    "surface/success": green[100], "text/success": green[800], "surface/info": L[100], "text/info": L[700],
    "surface/warning": orange[100], "text/warning": orange[700], "surface/neutral": N[100], "text/neutral": N[800],
    "chart/series/1": P.scale[600], "chart/series/2": orange[500], "chart/series/3": teal[500],
    "chart/series/4": purple[500], "chart/series/5": green[500],
    "shadow/ambient": black(5), "shadow/key": black(10), "shadow/strong": black(20),
    "type/font/mono": "Roboto Mono",
    "logo/mono": BLACK, "logo/inverse": WHITE, "logo/inverse-signature": WHITE, "social/ink": BLACK,
  };
  // Text on fills: by contrast, never copied.
  for (const [fill, text] of [
    ["colors/primary/default", "text/on/primary"], ["colors/secondary/default", "text/on/secondary"],
    ["colors/accent/default", "text/on/accent"], ["colors/accent/mark", "text/on/accent-mark"],
    ["colors/state/error", "text/on/error"], ["colors/state/success", "text/on/success"],
    ["colors/state/info", "text/on/info"], ["colors/state/warning", "text/on/warning"],
    ["colors/state/neutral", "text/on/neutral"], ["surface/cover", "text/on/cover"],
    ["surface/lift/action", "text/on/lift-action"], ["colors/primary/dark", "text/on/primary-strong"],
  ] as const) l[text] = on(l[fill]);
  l["logo/primary"] = l["colors/primary/default"];
  l["logo/signature"] = l["colors/primary/default"];
  l["logo/accent"] = l["colors/accent/logo"];
  l["logo/accent-2"] = l["colors/secondary/default"];
  l["logo/accent-3"] = l["colors/accent/default"];

  // base — dark/… tokens.
  const d: Record<string, string> = {
    "surface/page": N[900], "surface/panel": N[900], "surface/card": N[900], "surface/muted": N[800],
    "surface/muted-strong": N[700], "surface/disabled": white(10), "surface/scrim": black(70),
    "border/default": N[800], "border/strong": N[500], "border/strong-hover": N[400],
    "text/heading": N[50], "text/body": N[100], "text/muted": N[300], "text/subtle": N[400],
    "text/disabled": white(40), "text/disabled-invert": black(40), "text/link": L[300], "text/action": L[300],
    "focus/ring": N[100], "focus/ring-inset": N[900],
    "shadow/ambient": black(20), "shadow/key": black(40), "shadow/strong": black(60),
    "colors/primary/default": P.scale[200], "colors/primary/active": P.scale[300], "colors/primary/dark": P.scale[100],
    "colors/primary/light": P.scale[400],
    "colors/secondary/default": S.scale[400], "colors/secondary/hover": S.scale[300],
    "colors/secondary/active": S.scale[200], "colors/secondary/light": S.scale[500],
    "colors/accent/default": A.scale[300], "colors/accent/hover": A.scale[200], "colors/accent/highlight": A.scale[800],
    "colors/accent/mark": A.scale[300],
    "surface/tint/default": A.scale[900], "surface/tint/strong": A.scale[800], "text/on/tint": WHITE,
    // No step below 900 in dark: subtle is the default tint.
    "surface/tint/subtle": A.scale[900],
    "surface/action/default": L[900], "surface/action/strong": L[800], "text/on/action-tonal": P.scale[200],
    "surface/lift/action": P.scale[800], "surface/lift/action-strong": P.scale[700], "text/on/lift-action": WHITE,
    "colors/state/error-strong": red[400], "colors/state/success-strong": green[300],
    "colors/state/warning-strong": orange[400],
    "surface/error": red[900], "surface/error-strong": red[900], "text/error": red[300],
    "surface/success": green[900], "text/success": green[300], "surface/info": L[900], "text/info": L[300],
    "surface/warning": orange[900], "text/warning": orange[300], "surface/neutral": N[800], "text/neutral": N[200],
    "chart/series/1": P.scale[400], "chart/series/2": orange[400], "chart/series/3": teal[400],
    "chart/series/4": purple[400], "chart/series/5": green[400],
    "logo/primary": WHITE, "logo/accent": WHITE, "logo/signature": WHITE, "logo/mono": WHITE, "social/ink": WHITE,
    "colors/state/info-strong": L[300], "colors/state/neutral-strong": N[400],
    "text/on/primary-subtle": black(30),
  };
  for (const [fill, text] of [
    ["colors/primary/default", "text/on/primary"], ["colors/secondary/default", "text/on/secondary"],
    ["colors/accent/default", "text/on/accent"], ["colors/accent/mark", "text/on/accent-mark"],
    ["colors/primary/dark", "text/on/primary-strong"],
  ] as const) d[text] = on(d[fill]);

  // base — brand/… tokens: the "plate" of the brand, a section painted with the primary colour.
  // Figma draws it for dark brands (white ink over the plate). The ink is picked by contrast
  // instead, so a light brand colour gets a dark plate ink and stays legible.
  const plate = l["colors/primary/default"];
  const ink = on(plate);
  const inkA = ink === WHITE ? white : black;
  const antiInk = ink === WHITE ? black : white;
  const br: Record<string, string> = {
    "colors/primary/light": P.scale[300], "colors/primary/default": ink, "colors/primary/dark": P.scale[100],
    "colors/primary/active": P.scale[200],
    "colors/secondary/light": S.scale[300], "colors/secondary/default": ink, "colors/secondary/active": S.scale[200],
    "colors/secondary/hover": S.scale[100],
    "text/heading": ink, "text/body": ink,
    "text/link": contrastRatio(l["colors/accent/invert"], plate) >= 4.5 ? l["colors/accent/invert"] : ink,
    "surface/page": plate, "surface/card": l["colors/primary/light"], "surface/panel": plate,
    "border/default": inkA(20), "surface/tint/default": inkA(10), "surface/tint/strong": inkA(20),
    "surface/tint/subtle": inkA(5),
    "text/on/action-tonal": ink, "text/on/primary": plate, "text/on/secondary": plate, "text/on/tint": ink,
    "surface/action/default": inkA(10), "surface/action/strong": inkA(20),
    "focus/ring": ink, "focus/ring-inset": plate, "surface/disabled": inkA(10),
    "text/disabled": inkA(40), "text/muted": inkA(70), "text/disabled-invert": antiInk(40), "text/action": ink,
    "surface/lift/action": inkA(10), "text/on/lift-action": ink, "surface/lift/action-strong": inkA(20),
    "text/on/primary-strong": plate, "text/subtle": inkA(60), "surface/muted": inkA(10),
    "surface/muted-strong": inkA(20), "border/strong": inkA(60), "border/strong-hover": inkA(80),
    "text/on/primary-subtle": inkA(30),
  };

  const out: RdsTheme = { light: {}, dark: {}, brand: {} };
  const pick = (src: "l" | "d" | "b", role: string) => {
    const table = src === "l" ? l : src === "d" ? d : br;
    const v = table[role] ?? l[role];
    if (v === undefined) throw new Error(`rdsTheme: no value for "${role}"`);
    return v;
  };
  for (const [role, darkSrc, brandSrc] of ROLES) {
    out.light[roleVar(role)] = pick("l", role);
    out.dark[roleVar(role)] = pick(darkSrc, role);
    out.brand[roleVar(role)] = pick(brandSrc, role);
  }
  return out;
}

export type RdsCssOptions = {
  /** Scope of the light mode. Default `:root, .ds-scope`. */
  scope?: string;
  /** Selector of the dark mode, combined with the scope. Default `.dark`. */
  dark?: string;
  /** Selector of the brand plate (a section painted with the primary). Default `.ds-plate`. */
  plate?: string;
};

/**
 * The theme as CSS. Dark and plate only carry what differs from light: they inherit the rest
 * through the cascade, like the [RDS] modes that point back to the plain token.
 */
export function emitRdsCss(theme: RdsTheme, opts: RdsCssOptions = {}): string {
  const scope = opts.scope ?? ":root, .ds-scope";
  const dark = opts.dark ?? ".dark";
  const plate = opts.plate ?? ".ds-plate";
  const block = (sel: string, map: Record<string, string>, only?: Record<string, string>) => {
    const lines = Object.entries(map)
      .filter(([k, v]) => !only || only[k] !== v)
      .map(([k, v]) => `  ${k}: ${k === "--type-font-mono" ? `"${v}", monospace` : v};`);
    return `${sel} {\n${lines.join("\n")}\n}`;
  };
  const scopes = scope.split(",").map((s) => s.trim());
  const darkSel = scopes.map((s) => (s === ":root" ? `:root${dark}, ${dark}` : `${s}${dark}, ${dark} ${s}`)).join(", ");
  return [
    block(scope, theme.light),
    block(darkSel, theme.dark, theme.light),
    block(plate, theme.brand, theme.light),
  ].join("\n\n") + "\n";
}

/** Contrast of a role pair in one mode (alpha colours are not measured: they depend on what is below). */
export function rdsContrast(theme: RdsTheme, mode: RdsMode, fg: string, bg: string): number | null {
  const a = theme[mode][roleVar(fg)], c = theme[mode][roleVar(bg)];
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(c)) return null;
  return contrastRatio(a, c);
}
