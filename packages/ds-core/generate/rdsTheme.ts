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
import {
  buildScale, contrastRatio, hexToHsl, hslToHex, isHex, onColor, refToHex, relativeLuminance, SCALE_STEPS,
  type Scale, type ScaleStep,
} from "./scale";

export type RdsMode = "light" | "dark" | "brand";
export type RdsTheme = Record<RdsMode, Record<string, string>> & {
  /** The brand's own variables (Figma `brand` collection, `<brand>/<name>`), one value for every mode. */
  vars?: Record<string, string>;
};

type PaletteMap = Record<string, Record<number, string> | string>;
const palettes = primitives.color as PaletteMap;

const WHITE = "#ffffff";
const BLACK = "#000000";
/** black/white with alpha, as 8-digit hex (the [RDS] Primitives `black/aNN`, `white/aNN`). */
const black = (pct: number) => BLACK + Math.round((pct / 100) * 255).toString(16).padStart(2, "0");
const white = (pct: number) => WHITE + Math.round((pct / 100) * 255).toString(16).padStart(2, "0");

/** The recipe's own palettes (BrandDef.palettes): a hex (a ramp is derived) or a full 50–900 scale. */
type CustomPalettes = BrandDef["palettes"];

function palette(name: string, custom?: CustomPalettes): Scale {
  const own = custom?.[name];
  if (typeof own === "string") {
    if (!isHex(own)) throw new Error(`rdsTheme: palette "${name}" is not a hex colour`);
    return buildScale(own);
  }
  if (own) return own as unknown as Scale;
  const p = palettes[name];
  if (!p || typeof p === "string") throw new Error(`rdsTheme: unknown palette "${name}"`);
  return p as Scale;
}

/**
 * A brand colour as a ramp plus its own value. Palette ref (core or the recipe's own palettes) → that palette;
 * hex → derived ramp.
 */
function ramp(c: ColorRef, custom?: CustomPalettes): { base: string; scale: Scale } {
  if (isHex(c)) return { base: c, scale: buildScale(c) };
  const m = c.match(/^([a-zA-Z][a-zA-Z0-9]*)-(\d{2,3})$/);
  if (m) {
    const scale = palette(m[1], custom);
    return { base: scale[Number(m[2]) as ScaleStep] ?? refToHex(c), scale };
  }
  const hex = refToHex(c);
  if (!hex) throw new Error(`rdsTheme: cannot resolve colour "${c}"`);
  return { base: hex, scale: buildScale(hex) };
}

/** Best text colour on a fill: white or black, whichever contrasts more. */
const on = (bg: string) => onColor(bg);

/** WCAG AA for body text. */
const AA = 4.5;
const readsOn = (fg: string, bgs: string[]) => bgs.every((bg) => contrastRatio(fg, bg) >= AA);

/**
 * A brand colour used as text: itself when it clears AA on every background, otherwise the step of its own ramp
 * closest to it, going darker (text on light surfaces) or lighter (text on dark ones), that does. A ramp that
 * never gets there (a derived yellow ends near 3.9:1 on white) is carried on along its own hue, darker or lighter
 * by 2% of HSL lightness at a time, before `fallback` (black or white).
 */
function readableFrom(base: string, scale: Scale, bgs: string[], toward: "darker" | "lighter", fallback: string): string {
  if (readsOn(base, bgs)) return base;
  const lb = relativeLuminance(base);
  const steps = SCALE_STEPS.map((s) => scale[s])
    .filter((c): c is string => !!c && isHex(c))
    .filter((c) => (toward === "darker" ? relativeLuminance(c) < lb : relativeLuminance(c) > lb))
    // Closest to the brand colour first.
    .sort((a, b) => Math.abs(relativeLuminance(a) - lb) - Math.abs(relativeLuminance(b) - lb));
  const step = steps.find((c) => readsOn(c, bgs));
  if (step) return step;
  const [h, s, l0] = hexToHsl(steps[steps.length - 1] ?? base);
  for (let l = l0; toward === "darker" ? l >= 0 : l <= 100; l += toward === "darker" ? -2 : 2) {
    const c = hslToHex(h, s, l);
    if (readsOn(c, bgs)) return c;
  }
  return fallback;
}

export type RdsThemeOptions = {
  /** Where the warnings go (an explicit BrandDef.heading that fails AA). Default console.warn. */
  warn?: (message: string) => void;
};

/** console.warn where there is one (ds-core is typed without DOM or Node). */
const defaultWarn = (m: string) => (globalThis as { console?: { warn(m: string): void } }).console?.warn(m);

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

export function generateRdsTheme(def: BrandDef, opts: RdsThemeOptions = {}): RdsTheme {
  const warn = opts.warn ?? defaultWarn;
  const b = def.brand;
  const own = def.palettes;
  const P = ramp(b.primary, own);
  const S = b.secondary ? ramp(b.secondary, own) : P;
  const A = b.accent ? ramp(b.accent, own) : P;
  const N = def.text && (own?.[def.text] || (palettes[def.text] && typeof palettes[def.text] !== "string"))
    ? palette(def.text, own)
    : palette("zinc");
  const L = palette("blue");
  const red = palette("red"), green = palette("green"), orange = palette("orange");
  const teal = palette("teal"), purple = palette("purple");
  // text/heading on light: an explicit BrandDef.heading is kept as given (a warning when it fails AA); without one,
  // the primary, or the step of its ramp closest to it that clears AA on surface/card and surface/page.
  const lightBgs = [WHITE, N[100]];
  let heading: string;
  if (b.heading) {
    heading = ramp(b.heading, own).base;
    if (!readsOn(heading, lightBgs)) {
      const worst = Math.min(...lightBgs.map((bg) => contrastRatio(heading, bg)));
      warn(`generateRdsTheme(${def.name}): heading ${heading} is ${worst.toFixed(2)}:1 on surface/card or surface/page (AA asks 4.5:1). Kept as given.`);
    }
  } else heading = readableFrom(P.base, P.scale, lightBgs, "darker", BLACK);
  const invert = b.invert ? ramp(b.invert, own).base : WHITE;

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
    "surface/tint/default": A.scale[TINT_DEFAULT], "surface/tint/strong": A.scale[300],
    // Light selection fill (pressed Toggle, choice tile): one step lighter than the default tint
    // (200 → 100, 100 → 50).
    "surface/tint/subtle": A.scale[lighterStep(TINT_DEFAULT)],
    "surface/action/default": L[100], "surface/action/strong": L[200],
    "text/on/action-tonal": readableFrom(P.scale[700], P.scale, [L[100]], "darker", BLACK),
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
    ["surface/tint/default", "text/on/tint"],
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
    "text/heading": readableFrom(N[50], N, [N[900]], "lighter", WHITE), "text/body": N[100], "text/muted": N[300], "text/subtle": N[400],
    "text/disabled": white(40), "text/disabled-invert": black(40), "text/link": L[300], "text/action": L[300],
    "focus/ring": N[100], "focus/ring-inset": N[900],
    "shadow/ambient": black(20), "shadow/key": black(40), "shadow/strong": black(60),
    "colors/primary/default": P.scale[200], "colors/primary/active": P.scale[300], "colors/primary/dark": P.scale[100],
    "colors/primary/light": P.scale[400],
    "colors/secondary/default": S.scale[400], "colors/secondary/hover": S.scale[300],
    "colors/secondary/active": S.scale[200], "colors/secondary/light": S.scale[500],
    "colors/accent/default": A.scale[300], "colors/accent/hover": A.scale[200], "colors/accent/highlight": A.scale[800],
    "colors/accent/mark": A.scale[300],
    "surface/tint/default": A.scale[900], "surface/tint/strong": A.scale[800],
    // No step below 900 in dark: subtle is the default tint.
    "surface/tint/subtle": A.scale[900],
    "surface/action/default": L[900], "surface/action/strong": L[800],
    "text/on/action-tonal": readableFrom(P.scale[200], P.scale, [L[900]], "lighter", WHITE),
    "surface/lift/action": P.scale[800], "surface/lift/action-strong": P.scale[700],
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
    ["colors/primary/dark", "text/on/primary-strong"], ["surface/tint/default", "text/on/tint"],
    ["surface/lift/action", "text/on/lift-action"],
  ] as const) d[text] = on(d[fill]);

  // base — brand/… tokens: the "plate" of the brand, a section painted with the primary colour.
  // Figma draws it for dark brands (white ink over the plate). The ink is picked by contrast
  // instead, so a light brand colour gets a dark plate ink and stays legible.
  const plate = l["colors/primary/default"];
  const ink = on(plate);
  const inkA = ink === WHITE ? white : black;
  const antiInk = ink === WHITE ? black : white;
  // The card on the plate: the step of the primary ramp nearest to the plate that still carries the ink at AA
  // (navy/800 on a navy/900 plate, as Figma draws it). The plate itself when no step does.
  const lp = relativeLuminance(plate);
  const plateCard =
    SCALE_STEPS.map((st) => P.scale[st])
      .filter((c): c is string => !!c && isHex(c) && c.toLowerCase() !== plate.toLowerCase())
      .sort((a, b2) => Math.abs(relativeLuminance(a) - lp) - Math.abs(relativeLuminance(b2) - lp))
      .find((c) => contrastRatio(ink, c) >= AA) ?? plate;
  // Text on colors/primary/dark (P[100]) on the plate: the plate colour when it reads there, else black or white.
  const onPrimaryStrong = contrastRatio(plate, P.scale[100]) >= AA ? plate : on(P.scale[100]);
  const br: Record<string, string> = {
    "colors/primary/light": P.scale[300], "colors/primary/default": ink, "colors/primary/dark": P.scale[100],
    "colors/primary/active": P.scale[200],
    "colors/secondary/light": S.scale[300], "colors/secondary/default": ink, "colors/secondary/active": S.scale[200],
    "colors/secondary/hover": S.scale[100],
    "text/heading": ink, "text/body": ink,
    "text/link": contrastRatio(l["colors/accent/invert"], plate) >= 4.5 ? l["colors/accent/invert"] : ink,
    "surface/page": plate, "surface/card": plateCard, "surface/panel": plate,
    "border/default": inkA(20), "surface/tint/default": inkA(10), "surface/tint/strong": inkA(20),
    "surface/tint/subtle": inkA(5),
    "text/on/action-tonal": ink, "text/on/primary": plate, "text/on/secondary": plate, "text/on/tint": ink,
    "surface/action/default": inkA(10), "surface/action/strong": inkA(20),
    "focus/ring": ink, "focus/ring-inset": plate, "surface/disabled": inkA(10),
    "text/disabled": inkA(40), "text/muted": inkA(70), "text/disabled-invert": antiInk(40), "text/action": ink,
    "surface/lift/action": inkA(10), "text/on/lift-action": ink, "surface/lift/action-strong": inkA(20),
    "text/on/primary-strong": onPrimaryStrong, "text/subtle": inkA(60), "surface/muted": inkA(10),
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

/**
 * The selectors on which @rojaostudio/ds redeclares its component tokens (styles/rds/components.css and
 * foundation.css). A component token holds `var(--theme-role)`, and a custom property is resolved on the element
 * where it is declared: a theme scope that none of these match would repaint the roles but not the components
 * inside it, which keep the colours resolved at :root. The attributes are the generic way in: put
 * `data-rds-scope` on a scope element, `data-rds-mode="dark"` on a dark one, `data-rds-plate` on a plate.
 */
export const RDS_SCOPE_SELECTORS = [
  ":root", ".ds-scope", "[data-rds-scope]", ".dark", "[data-rds-mode]", ".ds-plate", "[data-rds-plate]",
] as const;
/** RDS_SCOPE_SELECTORS as one selector list, as the component token layer is emitted. */
export const RDS_TOKEN_SCOPE = RDS_SCOPE_SELECTORS.join(", ");

export type RdsCssOptions = {
  /** Scope of the light mode. Default `:root, .ds-scope, [data-rds-scope]`. */
  scope?: string;
  /**
   * Selector of the dark mode, combined with each scope. Default `.dark, [data-rds-mode="dark"]`. A selector
   * anchored at the root (`:root[data-theme="dark"]`, `html.dark`) is used as is: the theme switches on <html>,
   * as next-themes does.
   */
  dark?: string;
  /** Selector of the brand plate (a section painted with the primary). Default `.ds-plate, [data-rds-plate]`. */
  plate?: string;
  /**
   * Skip the check that every selector is covered by the component tokens of @rojaostudio/ds (RDS_SCOPE_SELECTORS).
   * Only for a theme read by your own CSS, without the components.
   */
  allowUncovered?: boolean;
};

const split = (list: string) => list.split(",").map((s) => s.trim()).filter(Boolean);
const rootAnchored = (sel: string) => /^(:root|html)(?![\w-])/i.test(sel);
/** The compound selector that picks the element (the last one, after any combinator). */
const subject = (sel: string) => sel.trim().split(/\s*[>+~]\s*|\s+/).pop() ?? sel;
const COVERING = /\.(ds-scope|dark|ds-plate)(?![\w-])|\[\s*data-rds-(scope|mode|plate)\s*([~|^$*]?=[^\]]*)?\]/;
const covered = (sel: string) => {
  const s = subject(sel);
  return /^(:root|html)(?![\w-])/i.test(s) || COVERING.test(s);
};

/**
 * The theme as CSS. Dark and plate only carry what differs from light: they inherit the rest
 * through the cascade, like the [RDS] modes that point back to the plain token.
 *
 * Throws when a selector would leave the components of @rojaostudio/ds on the root colours (see
 * RDS_SCOPE_SELECTORS), unless `allowUncovered`.
 */
export function emitRdsCss(theme: RdsTheme, opts: RdsCssOptions = {}): string {
  const scopes = split(opts.scope ?? ":root, .ds-scope, [data-rds-scope]");
  const darks = split(opts.dark ?? '.dark, [data-rds-mode="dark"]');
  const plates = split(opts.plate ?? ".ds-plate, [data-rds-plate]");
  const block = (sels: string[], map: Record<string, string>, only?: Record<string, string>) => {
    const lines = Object.entries(map)
      .filter(([k, v]) => !only || only[k] !== v)
      .map(([k, v]) => `  ${k}: ${k === "--type-font-mono" ? `"${v}", monospace` : v};`);
    return `${sels.join(", ")} {\n${lines.join("\n")}\n}`;
  };
  const darkSels = scopes.flatMap((s) =>
    darks.flatMap((d) => {
      if (rootAnchored(d)) return s === ":root" ? [d] : [`${d} ${s}`];
      return s === ":root" ? [`:root${d}`, d] : [`${s}${d}`, `${d} ${s}`];
    }),
  );
  if (!opts.allowUncovered) {
    const bad = [...new Set([...scopes, ...darkSels, ...plates].filter((sel) => !covered(sel)))];
    if (bad.length)
      throw new Error(
        `emitRdsCss: ${bad.map((b) => `"${b}"`).join(", ")} ${bad.length > 1 ? "are" : "is"} not covered by the ` +
          `component tokens of @rojaostudio/ds, redeclared only on ${RDS_TOKEN_SCOPE}. The components inside would keep ` +
          `the colours resolved at :root. Anchor the selector at the root (':root[data-theme="dark"]', as next-themes ` +
          `sets it on <html>), or add the attribute the tokens cover: data-rds-scope on a scope ('.my-scope[data-rds-scope]'), ` +
          `data-rds-mode on a dark element ('[data-rds-mode="dark"]'), data-rds-plate on a plate. ` +
          `Pass allowUncovered: true only for a theme without the components.`,
      );
  }
  return [
    block(scopes, { ...theme.light, ...theme.vars }),
    block(darkSels, theme.dark, theme.light),
    block(plates, theme.brand, theme.light),
  ].join("\n\n") + "\n";
}

/** Contrast of a role pair in one mode (alpha colours are not measured: they depend on what is below). */
export function rdsContrast(theme: RdsTheme, mode: RdsMode, fg: string, bg: string): number | null {
  const a = theme[mode][roleVar(fg)], c = theme[mode][roleVar(bg)];
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(c)) return null;
  return contrastRatio(a, c);
}

/**
 * The main text pairs of the theme: [text role, the surface it sits on]. Measured in every mode; a pair with an
 * alpha colour is skipped (its contrast depends on what is below).
 */
export const RDS_CONTRAST_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["text/heading", "surface/page"], ["text/heading", "surface/card"],
  ["text/body", "surface/page"], ["text/body", "surface/card"],
  ["text/muted", "surface/card"], ["text/link", "surface/card"],
  ["text/on/primary", "colors/primary/default"], ["text/on/secondary", "colors/secondary/default"],
  ["text/on/accent", "colors/accent/default"], ["text/on/accent-mark", "colors/accent/mark"],
  ["text/on/tint", "surface/tint/default"], ["text/on/action-tonal", "surface/action/default"],
  ["text/on/lift-action", "surface/lift/action"], ["text/on/primary-strong", "colors/primary/dark"],
  ["text/on/cover", "surface/cover"], ["text/on/error", "colors/state/error"],
  ["text/on/success", "colors/state/success"], ["text/on/info", "colors/state/info"],
  ["text/on/warning", "colors/state/warning"], ["text/on/neutral", "colors/state/neutral"],
  ["text/error", "surface/error"],
];

export type RdsContrastFailure = { mode: RdsMode; fg: string; bg: string; ratio: number };

/** The pairs of RDS_CONTRAST_PAIRS that fail WCAG AA (4.5:1), mode by mode. Empty means every pair passes. */
export function rdsContrastReport(theme: RdsTheme): RdsContrastFailure[] {
  const out: RdsContrastFailure[] = [];
  for (const mode of ["light", "dark", "brand"] as RdsMode[])
    for (const [fg, bg] of RDS_CONTRAST_PAIRS) {
      const ratio = rdsContrast(theme, mode, fg, bg);
      if (ratio !== null && ratio < AA) out.push({ mode, fg, bg, ratio: Math.round(ratio * 100) / 100 });
    }
  return out;
}

/**
 * A brand as drawn in the [RDS] Base Tokens file: for each theme mode, every role points to a primitive of the
 * [RDS] Primitives library by name ("accyan/400"), and `primitives` holds the colour Figma resolves for each.
 * Exported by `figma/export-brand.js`. The theme comes out one to one with the Figma brand mode.
 */
export type RdsBrandTable = {
  $schema?: "rds-brand-table/1";
  name: string;
  primitives: Record<string, string>;
  modes: Record<RdsMode, Record<string, string>>;
  /** The brand's own variables of the `brand` collection, by Figma path ("marca/ciano") → primitive or value. */
  vars?: Record<string, string>;
};

const isColourRef = (v: string) => /^[a-z][a-z0-9-]*\/[a-z]?\d+$/i.test(v);

/**
 * The theme of a brand table. Fails on a missing role or an unknown primitive, listing them all. The contrast of
 * the main text pairs (rdsContrastReport) is only reported, through `opts.warn`: the table is the brand as drawn
 * in Figma, kept one to one even where a pair fails.
 */
export function rdsThemeFromTable(table: RdsBrandTable, opts: RdsThemeOptions = {}): RdsTheme {
  const out: RdsTheme = { light: {}, dark: {}, brand: {} };
  const problems: string[] = [];
  for (const mode of ["light", "dark", "brand"] as RdsMode[]) {
    const roles = table.modes?.[mode];
    if (!roles) {
      problems.push(`mode "${mode}" is missing`);
      continue;
    }
    for (const [role] of ROLES) {
      const ref = roles[role];
      if (ref === undefined) problems.push(`${mode}: role "${role}" is missing`);
      else if (isColourRef(ref)) {
        const value = table.primitives[ref];
        if (value === undefined) problems.push(`${mode}: "${role}" points to unknown primitive "${ref}"`);
        else out[mode][roleVar(role)] = value.toLowerCase();
      } else out[mode][roleVar(role)] = ref;
    }
  }
  const valueOf = (where: string, ref: string) => {
    if (!isColourRef(ref)) return ref;
    const value = table.primitives[ref];
    if (value === undefined) problems.push(`${where} points to unknown primitive "${ref}"`);
    return value?.toLowerCase();
  };
  if (table.vars) {
    out.vars = {};
    for (const [name, ref] of Object.entries(table.vars)) {
      const value = valueOf(`var "${name}"`, ref);
      if (value !== undefined) out.vars[roleVar(name)] = value;
    }
  }
  if (problems.length) throw new Error(`rdsThemeFromTable(${table.name}):\n  ${problems.join("\n  ")}`);
  const fails = rdsContrastReport(out);
  if (fails.length)
    (opts.warn ?? defaultWarn)(
      `rdsThemeFromTable(${table.name}): ${fails.length} text pair(s) below 4.5:1\n  ` +
        fails.map((f) => `${f.mode}: ${f.fg} on ${f.bg} ${f.ratio}:1`).join("\n  "),
    );
  return out;
}
