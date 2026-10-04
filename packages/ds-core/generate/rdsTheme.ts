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
import { assertSafeTheme, collector, isSafeSelectorList, preview } from "./validate";

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

/** Steps a full palette scale may carry. */
const PALETTE_STEPS = new Set([...SCALE_STEPS.map(String), "950"]);

/**
 * The recipe's own palettes, checked before anything is derived from them: a name of letters and digits, and a
 * value that is a hex or a scale of steps 50–900 (950 tolerated) whose every value is a colour of the allow list.
 */
function checkPalettes(custom: unknown, where: string): void {
  if (custom === undefined) return;
  const c = collector(where);
  if (!custom || typeof custom !== "object" || Array.isArray(custom)) {
    c.problems.push("palettes: not an object");
    c.done();
  }
  for (const [name, value] of Object.entries(custom as Record<string, unknown>)) {
    if (!/^[a-z][a-z0-9]*$/i.test(name)) {
      c.problems.push(`palettes: ${preview(name)} is not a valid palette name (letters and digits)`);
      continue;
    }
    if (typeof value === "string") {
      if (!isHex(value)) c.problems.push(`palettes.${name}: ${preview(value)} is not a hex colour`);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [step, v] of Object.entries(value as Record<string, unknown>)) {
        if (!PALETTE_STEPS.has(step)) c.problems.push(`palettes.${name}: ${preview(step)} is not a scale step (50–900)`);
        else c.color(`palettes.${name}.${step}`, v);
      }
    } else c.problems.push(`palettes.${name}: expected a hex or a scale of steps 50–900`);
  }
  c.done();
}

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
/** WCAG 1.4.11 for what is not text (a field border, a chart mark). */
const NON_TEXT = 3;
const readsOn = (fg: string, bgs: string[], min = AA) => bgs.every((bg) => contrastRatio(fg, bg) >= min);

/**
 * A brand colour used as text: itself when it clears AA on every background, otherwise the step of its own ramp
 * closest to it, going darker (text on light surfaces) or lighter (text on dark ones), that does. A ramp that
 * never gets there (a derived yellow ends near 3.9:1 on white) is carried on along its own hue, darker or lighter
 * by 2% of HSL lightness at a time, before `fallback` (black or white). `min` is the ratio asked (AA by default;
 * NON_TEXT for a border or a chart mark).
 */
function readableFrom(
  base: string, scale: Scale, bgs: string[], toward: "darker" | "lighter", fallback: string, min = AA,
): string {
  if (readsOn(base, bgs, min)) return base;
  const lb = relativeLuminance(base);
  const steps = SCALE_STEPS.map((s) => scale[s])
    .filter((c): c is string => !!c && isHex(c))
    .filter((c) => (toward === "darker" ? relativeLuminance(c) < lb : relativeLuminance(c) > lb))
    // Closest to the brand colour first.
    .sort((a, b) => Math.abs(relativeLuminance(a) - lb) - Math.abs(relativeLuminance(b) - lb));
  const step = steps.find((c) => readsOn(c, bgs, min));
  if (step) return step;
  const [h, s, l0] = hexToHsl(steps[steps.length - 1] ?? base);
  for (let l = l0; toward === "darker" ? l >= 0 : l <= 100; l += toward === "darker" ? -2 : 2) {
    const c = hslToHex(h, s, l);
    if (readsOn(c, bgs, min)) return c;
  }
  return fallback;
}

/**
 * The interaction tones of a fill (hover, active) under the text picked for it. The text is chosen first, by
 * contrast with the default fill (text/on/*); every tone then has to carry that same text at AA, or the label of a
 * hovered or pressed button drops below 4.5:1 (a light brand: black text on cyan, then a hover darkened to 2.6:1).
 *
 * `preferred` are the template's steps (Figma's drawing). Each is kept when it carries the text and differs from the
 * fill. Otherwise the tones move along the ramp in the template's direction, as far as they still carry the text
 * (the darkest step that passes under black text, the lightest under white), keeping their order and staying apart.
 * When that direction has no room for all of them, they go the other way, away from the text, where every step passes.
 */
function stateFills(scale: Scale, fill: string, text: string, preferred: string[]): string[] {
  const lf = relativeLuminance(fill);
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const ramp = SCALE_STEPS.map((s) => scale[s])
    .filter((c): c is string => !!c && isHex(c))
    .map((c) => c.toLowerCase())
    .sort((a, b) => relativeLuminance(a) - relativeLuminance(b));
  // Past the ends of the ramp, its hue carried on (3% of HSL lightness at a time): the dark end of a yellow ramp is
  // not dark enough to carry yellow text on a black ink.
  const beyond: string[] = [];
  if (ramp.length) {
    const [hd, sd, ld] = hexToHsl(ramp[0]);
    for (let x = ld - 3; x >= 0; x -= 3) beyond.push(hslToHex(hd, sd, x));
    const [hl, sl, ll] = hexToHsl(ramp[ramp.length - 1]);
    for (let x = ll + 3; x <= 100; x += 3) beyond.push(hslToHex(hl, sl, x));
  }
  const steps = [...new Set([...ramp, ...beyond.map((c) => c.toLowerCase())])].filter(
    (c) => !same(c, fill) && relativeLuminance(c) !== lf,
  );
  // One side of the fill, nearest step first.
  const side = (dir: 1 | -1) =>
    steps
      .filter((c) => Math.sign(relativeLuminance(c) - lf) === dir)
      .sort((a, b) => Math.abs(relativeLuminance(a) - lf) - Math.abs(relativeLuminance(b) - lf));
  // The steps of a side that carry the text: a run from the fill outward (contrast with a fixed text is monotone).
  const carrying = (list: string[]) => {
    const out: string[] = [];
    for (const c of list) {
      if (contrastRatio(text, c) < AA) break;
      out.push(c);
    }
    return out;
  };
  const awayFromText: 1 | -1 = relativeLuminance(text) <= lf ? 1 : -1;
  const lp = relativeLuminance(preferred[0]);
  const dir: 1 | -1 = lp === lf ? awayFromText : lp > lf ? 1 : -1;
  const n = preferred.length;
  for (const d of [dir, -dir as 1 | -1]) {
    const all = side(d);
    const ok = carrying(all);
    if (ok.length < n) continue;
    // Where each tone sits on this side: the template's own step, or the next ones out from the fill.
    const wants = preferred.map((p, i) => {
      const k = d === dir ? all.findIndex((c) => same(c, p)) : -1;
      return k >= 0 ? k : i;
    });
    const order = wants.map((_, i) => i).sort((x, y) => wants[x] - wants[y] || x - y);
    const idx: number[] = new Array(n);
    let next = 0;
    order.forEach((i, rank) => {
      idx[i] = Math.min(Math.max(wants[i], next), ok.length - (n - rank));
      next = idx[i] + 1;
    });
    return idx.map((k) => ok[k]);
  }
  // A ramp too short on both sides (not reached by a 10-step ramp): every step that carries the text, nearest first.
  const ok = [...carrying(side(dir)), ...carrying(side(-dir as 1 | -1))];
  return preferred.map((p, i) => ok[i] ?? p);
}

/** A state fill kept when it already carries the text at AA, otherwise moved along the ramp (stateFills). */
const carry = (scale: Scale, fill: string, text: string, value: string): string =>
  contrastRatio(text, value) >= AA ? value : stateFills(scale, fill, text, [value])[0];

/** `top` (#rrggbb or #rrggbbaa) composited over an opaque `below`: the colour the eye gets. */
function over(top: string, below: string): string {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16);
  const a = top.length === 9 ? ch(top, 3) / 255 : 1;
  return `#${[0, 1, 2].map((i) => Math.round(ch(top, i) * a + ch(below, i) * (1 - a)).toString(16).padStart(2, "0")).join("")}`;
}

/** Contrast between the plate (and its card) and its ink: AA with room for the ink's overlays under ink text. */
const PLATE_MIN = 6;

/**
 * Two fills told apart at a glance: 1.5:1 between them, or a colour beside a grey (40 points of HSL saturation
 * apart: a yellow and a light grey are as light as each other and still two different buttons).
 */
export function distinct(a: string, b: string): boolean {
  return contrastRatio(a, b) >= 1.5 || Math.abs(hexToHsl(a)[1] - hexToHsl(b)[1]) >= 40;
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
 * mode's own variant (`d` = base dark/…, `b` = base brand/…) or back to another one (`l` = plain), or straight
 * to a primitive of the [RDS] Primitives library (`p`: the same colour for every brand, see FIXED in the generator).
 */
export const ROLES: ReadonlyArray<readonly [string, "l" | "d" | "p", "l" | "d" | "b" | "p"]> = [
  ["colors/primary/light", "d", "b"], ["colors/primary/default", "d", "b"], ["colors/primary/dark", "d", "b"],
  ["colors/secondary/light", "d", "b"], ["colors/secondary/default", "d", "b"], ["colors/secondary/active", "d", "b"],
  ["colors/accent/highlight", "d", "d"], ["colors/accent/default", "d", "d"], ["colors/accent/hover", "d", "d"],
  ["colors/accent/invert", "l", "l"],
  ["text/heading", "d", "b"], ["text/body", "d", "b"], ["text/link", "d", "b"],
  ["surface/page", "d", "b"], ["surface/card", "d", "b"], ["surface/panel", "d", "b"],
  ["border/default", "d", "b"], ["surface/tint/default", "d", "b"], ["text/on/action-tonal", "d", "b"],
  ["text/on/primary", "d", "b"], ["text/on/secondary", "d", "b"], ["text/on/accent", "d", "d"],
  ["text/on/tint", "d", "b"], ["colors/state/error", "l", "l"], ["colors/state/error-strong", "p", "p"],
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
  ["text/on/primary-subtle", "d", "b"], ["surface/tint/subtle", "d", "b"], ["border/error", "d", "d"],
];

/** Toward the side of the ramp that contrasts with a background: darker on a light one, lighter on a dark one. */
const awayFrom = (bg: string): "darker" | "lighter" => (contrastRatio(bg, BLACK) >= contrastRatio(bg, WHITE) ? "darker" : "lighter");

/** The tint steps of the base collection. `surface/tint/subtle` sits one step lighter than the default. */
const TINT_DEFAULT: ScaleStep = 200;
const lighterStep = (s: ScaleStep): ScaleStep => (s >= 200 ? ((s - 100) as ScaleStep) : 50);

/** CSS custom property of a role: the Figma path with hyphens (the [RDS] codeSyntax rule). */
export const roleVar = (role: string) => `--${role.replaceAll("/", "-")}`;

export function generateRdsTheme(def: BrandDef, opts: RdsThemeOptions = {}): RdsTheme {
  const warn = opts.warn ?? defaultWarn;
  const where = `generateRdsTheme(${preview(def?.name)})`;
  if (!def?.brand || typeof def.brand !== "object") throw new Error(`${where}: brand is missing`);
  checkPalettes(def.palettes, where);
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
  // the primary, or the step of its ramp closest to it that clears AA on surface/card and surface/page, and on what it
  // is drawn over as a label: the pressed neutral outline and ghost Buttons (surface/muted-strong) and the accent
  // highlight of the Badge.
  const lightBgs = [WHITE, N[100], N[200], A.scale[200]];
  let heading: string;
  if (b.heading) {
    heading = ramp(b.heading, own).base;
    if (!readsOn(heading, lightBgs)) {
      const worst = Math.min(...lightBgs.map((bg) => contrastRatio(heading, bg)));
      warn(`generateRdsTheme(${def.name}): heading ${heading} is ${worst.toFixed(2)}:1 on surface/card, surface/page, surface/muted-strong or colors/accent/highlight (AA asks 4.5:1). Kept as given.`);
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
    "chart/series/2": orange[600], "chart/series/3": teal[500],
    "chart/series/4": purple[500], "chart/series/5": green[500],
    "shadow/ambient": black(5), "shadow/key": black(10), "shadow/strong": black(20),
    "type/font/mono": "Roboto Mono",
    "logo/mono": BLACK, "logo/inverse": WHITE, "logo/inverse-signature": WHITE, "social/ink": BLACK,
  };
  // The neutral ink: colors/primary/* is the fill of the neutral Button and Badge, the bars, the Tooltip, the selected
  // day. A recipe with a secondary drew its own primary (Rojão: navy, an ink already) and it is kept. With one colour
  // only (the showroom's "your colour"), that colour is the action (colors/secondary/*) and the accent; the neutral
  // roles take a neutral ink from the text ramp instead, never the brand colour, far enough from the action fill to
  // tell the two Buttons apart (a near-black brand gets a lighter ink).
  const single = !b.secondary;
  const K: Scale = single ? N : P.scale;
  if (single) {
    const steps = [900, 800, 700, 600, 500] as const;
    const k = Math.max(0, steps.findIndex((s) => distinct(N[s], l["colors/secondary/default"])));
    l["colors/primary/default"] = N[steps[Math.min(k, 2)]];
    l["colors/primary/dark"] = N[steps[Math.min(k, 2) + 1]];
    l["colors/primary/active"] = N[steps[Math.min(k, 2) + 2]];
    l["colors/primary/light"] = N[500];
  }
  // Text on fills: by contrast, never copied. text/on/primary-strong is the label of the neutral Button and Badge
  // (on colors/primary/default, then colors/primary/dark on hover): picked on the default fill.
  for (const [fill, text] of [
    ["colors/primary/default", "text/on/primary"], ["colors/secondary/default", "text/on/secondary"],
    ["colors/accent/default", "text/on/accent"], ["colors/accent/mark", "text/on/accent-mark"],
    ["colors/state/error", "text/on/error"], ["colors/state/success", "text/on/success"],
    ["colors/state/info", "text/on/info"], ["colors/state/warning", "text/on/warning"],
    ["colors/state/neutral", "text/on/neutral"], ["surface/cover", "text/on/cover"],
    ["surface/lift/action", "text/on/lift-action"], ["colors/primary/default", "text/on/primary-strong"],
    ["surface/tint/default", "text/on/tint"],
  ] as const) l[text] = on(l[fill]);
  // Hover and active carry the same text as the default fill (see stateFills). colors/primary/dark is the hover of
  // the neutral Button, colors/primary/light the lighter step of the same ink: both under that label.
  for (const role of ["colors/primary/dark", "colors/primary/light"])
    l[role] = carry(K, l["colors/primary/default"], l["text/on/primary-strong"], l[role]);
  [l["colors/primary/active"]] = stateFills(K, l["colors/primary/default"], l["text/on/primary"], [l["colors/primary/active"]]);
  [l["colors/secondary/hover"], l["colors/secondary/active"]] = stateFills(
    S.scale, l["colors/secondary/default"], l["text/on/secondary"], [l["colors/secondary/hover"], l["colors/secondary/active"]],
  );
  [l["colors/accent/hover"]] = stateFills(A.scale, l["colors/accent/default"], l["text/on/accent"], [l["colors/accent/hover"]]);
  // border/error (a field in error) and chart/series/1 (the brand's own series) are marks, not text: 3:1 (WCAG
  // 1.4.11) on surface/card, which is also the field background (input/background/default → surface/card).
  // border/error starts from the state red, series 1 from the primary's 600; each walks its ramp until it clears.
  l["border/error"] = readableFrom(l["colors/state/error"], red, [l["surface/card"]], awayFrom(l["surface/card"]), BLACK, NON_TEXT);
  l["chart/series/1"] = readableFrom(P.scale[600], P.scale, [l["surface/card"], l["surface/page"]], awayFrom(l["surface/card"]), BLACK, NON_TEXT);
  // The logo is the brand colour (not the neutral ink), and the mark has to be seen: 3:1 on the light surfaces it is
  // placed on (the Sidebar's panel, the card, the page), darker along its ramp when it is too light.
  l["logo/primary"] = readableFrom(P.base, P.scale, [l["surface/card"], l["surface/page"], l["surface/panel"]], "darker", BLACK, NON_TEXT);
  l["logo/signature"] = l["logo/primary"];
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
    "colors/state/success-strong": green[300],
    "colors/state/warning-strong": orange[400],
    "surface/error": red[900], "surface/error-strong": red[900], "text/error": red[300],
    "surface/success": green[900], "text/success": green[300], "surface/info": L[900], "text/info": L[300],
    "surface/warning": orange[900], "text/warning": orange[300], "surface/neutral": N[800], "text/neutral": N[200],
    "chart/series/2": orange[400], "chart/series/3": teal[400],
    "chart/series/4": purple[400], "chart/series/5": green[400],
    "logo/primary": WHITE, "logo/accent": WHITE, "logo/signature": WHITE, "logo/mono": WHITE, "social/ink": WHITE,
    "colors/state/info-strong": L[300], "colors/state/neutral-strong": N[400],
    "text/on/primary-subtle": black(30),
  };
  // The neutral ink in dark: a light neutral (one colour only), the one of the neutral steps far enough from the
  // action fill. See the light mode.
  if (single) {
    const steps = [200, 300, 100, 400] as const;
    const s = steps.find((st) => distinct(N[st], d["colors/secondary/default"])) ?? 200;
    d["colors/primary/default"] = N[s];
    d["colors/primary/dark"] = N[s === 100 ? 50 : ((s - 100) as ScaleStep)];
    d["colors/primary/active"] = N[(s + 100) as ScaleStep];
    d["colors/primary/light"] = N[(s + 200) as ScaleStep];
  }
  // The selection tint carries the text that sits on it (the selected entry of a Sidebar, a Listbox, a Toggle: body,
  // muted and the brand ink), and the accent highlight the heading of its Badge: a light ramp (a yellow, whose 900 is
  // still a gold) goes on darker along its hue.
  d["surface/tint/default"] = readableFrom(d["surface/tint/default"], A.scale, [d["text/body"], d["text/muted"], d["colors/primary/default"]], "darker", N[900]);
  d["surface/tint/subtle"] = d["surface/tint/default"];
  d["colors/accent/highlight"] = readableFrom(d["colors/accent/highlight"], A.scale, [d["text/heading"]], "darker", N[900]);
  for (const [fill, text] of [
    ["colors/primary/default", "text/on/primary"], ["colors/secondary/default", "text/on/secondary"],
    ["colors/accent/default", "text/on/accent"], ["colors/accent/mark", "text/on/accent-mark"],
    ["colors/primary/default", "text/on/primary-strong"], ["surface/tint/default", "text/on/tint"],
    ["surface/lift/action", "text/on/lift-action"],
  ] as const) d[text] = on(d[fill]);
  for (const role of ["colors/primary/dark", "colors/primary/light"])
    d[role] = carry(K, d["colors/primary/default"], d["text/on/primary-strong"], d[role]);
  [d["colors/primary/active"]] = stateFills(K, d["colors/primary/default"], d["text/on/primary"], [d["colors/primary/active"]]);
  [d["colors/secondary/hover"], d["colors/secondary/active"]] = stateFills(
    S.scale, d["colors/secondary/default"], d["text/on/secondary"], [d["colors/secondary/hover"], d["colors/secondary/active"]],
  );
  [d["colors/accent/hover"]] = stateFills(A.scale, d["colors/accent/default"], d["text/on/accent"], [d["colors/accent/hover"]]);
  // In dark, border/error starts from error-strong (red/400) and series 1 from the primary's 400.
  d["border/error"] = readableFrom(red[400], red, [d["surface/card"]], awayFrom(d["surface/card"]), WHITE, NON_TEXT);
  d["chart/series/1"] = readableFrom(P.scale[400], P.scale, [d["surface/card"]], awayFrom(d["surface/card"]), WHITE, NON_TEXT);

  // base — brand/… tokens: the "plate" of the brand, a section painted with the brand colour itself (the primary as
  // given, not the neutral ink). Figma draws it for dark brands (white ink over the plate). The ink is picked by
  // contrast instead, so a light brand colour gets a dark plate ink and stays legible.
  // The plate leaves room for what is drawn over it: the ink 12–20% over it under ink text (a hover, an active filter
  // chip). A brand colour already PLATE_MIN from its ink is the plate as is (Rojão's navy, an orange under black); a
  // mid one (a crimson, a violet, a grey, 4.5–6:1 under white) is taken along its ramp, away from the ink, until it is.
  const ink0 = on(P.base);
  const plate = contrastRatio(ink0, P.base) >= PLATE_MIN
    ? P.base
    : readableFrom(P.base, P.scale, [ink0], ink0 === WHITE ? "darker" : "lighter", ink0 === WHITE ? BLACK : WHITE, PLATE_MIN);
  const ink = on(plate);
  const inkA = ink === WHITE ? white : black;
  const antiInk = ink === WHITE ? black : white;
  // The card on the plate: the primary's 800, as Figma draws it (navy/800 on a navy/900 plate), when it is not the
  // plate itself and carries the ink with the plate's own room (PLATE_MIN). Otherwise (a light plate, where 800 is
  // dark under a dark ink) the step of the primary ramp nearest to the plate that does; the plate itself when none does.
  const lp = relativeLuminance(plate);
  const isPlate = (c: string) => c.toLowerCase() === plate.toLowerCase();
  const plateCard =
    P.scale[800] && !isPlate(P.scale[800]) && contrastRatio(ink, P.scale[800]) >= PLATE_MIN
      ? P.scale[800]
      : SCALE_STEPS.map((st) => P.scale[st])
          .filter((c): c is string => !!c && isHex(c) && !isPlate(c))
          .sort((a, b2) => Math.abs(relativeLuminance(a) - lp) - Math.abs(relativeLuminance(b2) - lp))
          .find((c) => contrastRatio(ink, c) >= PLATE_MIN) ?? plate;
  const plateBgs = [plate, plateCard];
  // The overlays of the plate (hover, pressed, the selected entry): the ink at 5–20%, as Figma draws them, while the
  // ink still reads AA on them. On a plate too close to its ink for that (a violet under white text), the other ink
  // shades it instead, which only adds contrast to the text above.
  const ov =
    plateBgs.every((bg) => contrastRatio(ink, over(inkA(20), bg)) >= AA) ? inkA : ink === WHITE ? black : white;
  // What quiet and state text sits on in the plate: the plate, its card, and the 10% overlay over either (a hovered
  // menu entry, the current entry of a Sidebar).
  const under = [...plateBgs, ...plateBgs.map((bg) => over(ov(10), bg))];
  // Quiet text (text/muted, text/subtle: hints, the header of a Table, the labels of a Sidebar): the ink at 70% and
  // 60% as Figma draws them, more opaque, 5% at a time, until it reads AA on the plate, its card and the overlays.
  const quiet = (pct: number, min = AA, bgs = under) => {
    for (let p = pct; p < 100; p += 5) if (bgs.every((bg) => contrastRatio(over(inkA(p), bg), bg) >= min)) return inkA(p);
    return ink;
  };
  // border/strong, the border of a field: 3:1 (WCAG 1.4.11) the same way, from Figma's 60%; its hover 20% over it.
  const fieldBorder = quiet(60, NON_TEXT, plateBgs);
  const fieldAlpha = fieldBorder.length === 9 ? Math.round((parseInt(fieldBorder.slice(7), 16) / 255) * 100) : 100;
  const br: Record<string, string> = {
    "colors/primary/light": P.scale[300], "colors/primary/default": ink, "colors/primary/dark": P.scale[100],
    "colors/primary/active": P.scale[200],
    "colors/secondary/light": S.scale[300], "colors/secondary/default": ink, "colors/secondary/active": S.scale[200],
    "colors/secondary/hover": S.scale[100],
    "text/heading": ink, "text/body": ink,
    "text/link": contrastRatio(l["colors/accent/invert"], plate) >= 4.5 ? l["colors/accent/invert"] : ink,
    "surface/page": plate, "surface/card": plateCard, "surface/panel": plate,
    "border/default": inkA(20), "surface/tint/default": ov(10), "surface/tint/strong": ov(20),
    "surface/tint/subtle": ov(5),
    "text/on/action-tonal": ink, "text/on/primary": plate, "text/on/secondary": plate, "text/on/tint": ink,
    "surface/action/default": ov(10), "surface/action/strong": ov(20),
    "focus/ring": ink, "focus/ring-inset": plate, "surface/disabled": inkA(10),
    "text/disabled": inkA(40), "text/muted": quiet(70), "text/disabled-invert": antiInk(40), "text/action": ink,
    "surface/lift/action": ov(10), "text/on/lift-action": ink, "surface/lift/action-strong": ov(20),
    // The label of the neutral Button on the plate, whose fill is the ink: the plate colour.
    "text/on/primary-strong": plate, "text/subtle": quiet(60), "surface/muted": ov(10),
    "surface/muted-strong": ov(20), "border/strong": fieldBorder,
    "border/strong-hover": fieldAlpha + 20 < 100 ? inkA(fieldAlpha + 20) : ink,
    "text/on/primary-subtle": inkA(30),
  };
  // On the plate the fills are the ink and their text is the plate: hover and active have to carry the plate colour
  // (a light plate has a black ink, so the template's near-white steps would hide its text). colors/primary/dark is
  // the hover of the neutral Button, colors/primary/light the lighter step of the same ink.
  for (const role of ["colors/primary/dark", "colors/primary/light"])
    br[role] = carry(P.scale, br["colors/primary/default"], br["text/on/primary-strong"], br[role]);
  // colors/primary/dark is also the Spinner's indicator: a mark, 3:1 on the plate's card.
  br["colors/primary/dark"] = readableFrom(br["colors/primary/dark"], P.scale, [plateCard], awayFrom(plateCard), ink, NON_TEXT);
  [br["colors/primary/active"]] = stateFills(P.scale, br["colors/primary/default"], br["text/on/primary"], [br["colors/primary/active"]]);
  [br["colors/secondary/hover"], br["colors/secondary/active"]] = stateFills(
    S.scale, br["colors/secondary/default"], br["text/on/secondary"], [br["colors/secondary/hover"], br["colors/secondary/active"]],
  );
  // border/error on the plate starts from the light red Figma uses there (red/300, the dark text/error) and keeps
  // 3:1 on the plate's card, the field background.
  const brandError = readableFrom(red[300], red, plateBgs.slice().reverse(), awayFrom(plateCard), ink, NON_TEXT);

  // The rest of the plate Figma points at the dark tokens (state texts and their soft surfaces, the accent highlight,
  // the logos, series 1): right on a dark plate, not on a light one (red/300 on a yellow plate). A light plate (dark
  // ink) takes the light tokens instead, and every state text is then walked along its ramp until it reads AA on the
  // plate, its card, the overlays and its own soft surface (the danger Button's hover, the soft Badge).
  const lightPlate = ink === BLACK;
  const plateOwn: Record<string, string> = {};
  for (const [st, rampOf] of [["error", red], ["success", green], ["info", L], ["warning", orange], ["neutral", N]] as const) {
    const from = lightPlate ? l : d;
    const soft = [`surface/${st}`, ...(st === "error" ? ["surface/error-strong"] : [])];
    for (const s of soft) plateOwn[s] = from[s];
    plateOwn[`text/${st}`] = readableFrom(from[`text/${st}`], rampOf, [...under, ...soft.map((s) => from[s])], awayFrom(plate), ink);
  }
  plateOwn["colors/accent/highlight"] =
    [d["colors/accent/highlight"], l["colors/accent/highlight"]].find((c) => contrastRatio(ink, c) >= AA) ??
    readableFrom(l["colors/accent/highlight"], A.scale, [ink], lightPlate ? "lighter" : "darker", ink === WHITE ? BLACK : WHITE);
  plateOwn["chart/series/1"] = readableFrom(d["chart/series/1"], P.scale, plateBgs, awayFrom(plate), ink, NON_TEXT);
  // colors/state/neutral-strong is a mark on the plate's panel and card (the Sidebar's neutral dot in the rail, the
  // neutral Toast's icon): 3:1, walking the neutral ramp away from the plate.
  plateOwn["colors/state/neutral-strong"] = readableFrom(d["colors/state/neutral-strong"], N, plateBgs, awayFrom(plate), ink, NON_TEXT);
  for (const logo of ["logo/primary", "logo/signature", "logo/accent", "logo/mono", "social/ink"]) plateOwn[logo] = ink;

  // Roles that point straight at a primitive in dark and on the plate (`p` in ROLES), the same for every brand.
  // error-strong is the hover of the danger Button under text/on/error (white on red/600): red/700 carries it at AA.
  const fixed: Record<string, string> = { "colors/state/error-strong": red[700] };
  const out: RdsTheme = { light: {}, dark: {}, brand: {} };
  const pick = (src: "l" | "d" | "b" | "p", role: string) => {
    const table = src === "l" ? l : src === "d" ? d : src === "p" ? fixed : br;
    const v = table[role] ?? l[role];
    if (v === undefined) throw new Error(`rdsTheme: no value for "${role}"`);
    return v;
  };
  for (const [role, darkSrc, brandSrc] of ROLES) {
    out.light[roleVar(role)] = pick("l", role);
    out.dark[roleVar(role)] = pick(darkSrc, role);
    out.brand[roleVar(role)] = pick(brandSrc, role);
  }
  // Figma points the plate's border/error at a dark token (base dark/text/error), not at dark/border/error.
  out.brand[roleVar("border/error")] = brandError;
  for (const [role, v] of Object.entries(plateOwn)) out.brand[roleVar(role)] = v;
  // Whatever the inputs resolved to, only allow-listed values leave the generator.
  assertSafeTheme(out, where);
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
  // Defence in depth: the theme may have been built by hand, not by the generators. Nothing reaches the stylesheet
  // without passing the allow list again.
  assertSafeTheme(theme, "emitRdsCss");
  const badSel = (["scope", "dark", "plate"] as const).filter((k) => opts[k] !== undefined && !isSafeSelectorList(opts[k]));
  if (badSel.length)
    throw new Error(
      `emitRdsCss: invalid selector in ${badSel.map((k) => `${k} ${preview(opts[k])}`).join(", ")} ` +
        `(no braces, ";", comments, backslash, "@", "<" or line breaks).`,
    );
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
  ["text/on/primary", "colors/primary/default"], ["text/on/primary", "colors/primary/active"],
  ["text/on/secondary", "colors/secondary/default"], ["text/on/secondary", "colors/secondary/hover"],
  ["text/on/secondary", "colors/secondary/active"],
  ["text/on/accent", "colors/accent/default"], ["text/on/accent", "colors/accent/hover"],
  ["text/on/accent-mark", "colors/accent/mark"],
  ["text/on/tint", "surface/tint/default"], ["text/on/action-tonal", "surface/action/default"],
  ["text/on/lift-action", "surface/lift/action"], ["text/on/primary-strong", "colors/primary/dark"],
  ["text/on/cover", "surface/cover"], ["text/on/error", "colors/state/error"],
  ["text/on/success", "colors/state/success"], ["text/on/info", "colors/state/info"],
  ["text/on/warning", "colors/state/warning"], ["text/on/neutral", "colors/state/neutral"],
  ["text/error", "surface/error"],
  // The pairs the components join (packages/ds, styles/rds/components.css): the label of the neutral Button and
  // Badge on its fill and hovers, the brand ink as text (colors/primary/default) on the card, the pressed outline Button,
  // the Badge highlight, the selected entry, quiet text and state text where they are placed.
  ["text/on/primary-strong", "colors/primary/default"], ["text/on/primary-strong", "colors/primary/light"],
  ["text/on/primary-strong", "colors/primary/active"], ["colors/primary/default", "surface/card"],
  ["colors/primary/default", "surface/tint/default"], ["text/heading", "surface/muted-strong"],
  ["text/heading", "colors/accent/highlight"], ["text/body", "surface/tint/default"], ["text/muted", "surface/tint/default"],
  ["text/on/tint", "surface/tint/subtle"], ["text/action", "surface/action/strong"],
  ["text/muted", "surface/page"], ["text/muted", "surface/panel"], ["text/subtle", "surface/card"], ["text/subtle", "surface/panel"],
  ["text/error", "surface/card"], ["text/error", "surface/page"], ["text/error", "surface/error-strong"],
  ["text/success", "surface/success"], ["text/success", "surface/card"], ["text/info", "surface/info"],
  ["text/warning", "surface/warning"], ["text/neutral", "surface/neutral"],
];

/**
 * What is not text but has to be seen (WCAG 1.4.11, 3:1): the border of a field and of a field in error, the focus
 * ring, the brand's logo and its chart series, on the surfaces they are placed on.
 */
export const RDS_NON_TEXT_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["border/strong", "surface/card"], ["border/strong", "surface/page"], ["border/error", "surface/card"],
  ["focus/ring", "surface/page"], ["focus/ring", "surface/card"],
  ["logo/primary", "surface/card"], ["logo/primary", "surface/page"], ["logo/primary", "surface/panel"],
  ["chart/series/1", "surface/card"], ["chart/series/1", "surface/page"],
  ["colors/state/neutral-strong", "surface/panel"], ["colors/state/neutral-strong", "surface/card"],
];

/** A pair below its minimum: 4.5:1 for text (RDS_CONTRAST_PAIRS), 3:1 for the rest (RDS_NON_TEXT_PAIRS). */
export type RdsContrastFailure = { mode: RdsMode; fg: string; bg: string; ratio: number; min: number };

/**
 * The pairs of RDS_CONTRAST_PAIRS below WCAG AA (4.5:1) and of RDS_NON_TEXT_PAIRS below 3:1, mode by mode. Empty
 * means every pair passes. A pair with an alpha colour is skipped (rdsContrast).
 */
export function rdsContrastReport(theme: RdsTheme): RdsContrastFailure[] {
  const out: RdsContrastFailure[] = [];
  for (const mode of ["light", "dark", "brand"] as RdsMode[])
    for (const [pairs, min] of [[RDS_CONTRAST_PAIRS, AA], [RDS_NON_TEXT_PAIRS, NON_TEXT]] as const)
      for (const [fg, bg] of pairs) {
        const ratio = rdsContrast(theme, mode, fg, bg);
        if (ratio !== null && ratio < min) out.push({ mode, fg, bg, ratio: Math.round(ratio * 100) / 100, min });
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
 * Roles added to the [RDS] theme after tables were already exported, with the role each mode aliases in Figma.
 * A table without one still loads: the role is taken from that same mode's alias (the colour Figma resolves),
 * with a warning to export the table again. Any other missing role fails.
 */
const ADDED_ROLES: Record<string, Record<RdsMode, string>> = {
  // Figma: light → base colors/state/error, dark → base dark/colors/state/error-strong, brand → base dark/text/error.
  "border/error": { light: "colors/state/error", dark: "colors/state/error-strong", brand: "text/error" },
};

/**
 * The theme of a brand table. Fails on a missing role or an unknown primitive, listing them all. A table exported
 * before a role of ADDED_ROLES existed is the exception: the role is taken from the token Figma aliases it to, and
 * `opts.warn` asks to export the table again. The contrast of the main text pairs (rdsContrastReport) is only
 * reported, through `opts.warn`: the table is the brand as drawn in Figma, kept one to one even where a pair fails.
 */
export function rdsThemeFromTable(table: RdsBrandTable, opts: RdsThemeOptions = {}): RdsTheme {
  const where = `rdsThemeFromTable(${preview(table?.name)})`;
  if (!table || typeof table !== "object") throw new Error(`${where}: the table is not an object`);
  // The primitives and the brand variables come from a file: names and colours go through the allow list first.
  const check = collector(where);
  if (!table.primitives || typeof table.primitives !== "object" || Array.isArray(table.primitives))
    check.problems.push("primitives: not an object");
  else
    for (const [name, value] of Object.entries(table.primitives)) {
      check.name(`primitives ${preview(name)}`, name);
      check.color(`primitives.${name}`, value);
    }
  if (table.vars !== undefined) {
    if (!table.vars || typeof table.vars !== "object" || Array.isArray(table.vars)) check.problems.push("vars: not an object");
    else
      for (const [name, value] of Object.entries(table.vars)) {
        check.name(`vars ${preview(name)}`, name);
        if (typeof value !== "string") check.problems.push(`vars.${name}: not a string`);
      }
  }
  check.done();
  const out: RdsTheme = { light: {}, dark: {}, brand: {} };
  const problems: string[] = [];
  const derived = new Set<string>();
  for (const mode of ["light", "dark", "brand"] as RdsMode[]) {
    const roles = table.modes?.[mode];
    if (!roles) {
      problems.push(`mode "${mode}" is missing`);
      continue;
    }
    for (const [role] of ROLES) {
      let ref = roles[role];
      const added = ADDED_ROLES[role]?.[mode];
      if (ref === undefined && added && roles[added] !== undefined) {
        ref = roles[added];
        derived.add(role);
      }
      if (ref === undefined) problems.push(`${mode}: role "${role}" is missing`);
      else if (isColourRef(ref)) {
        const value = table.primitives[ref];
        if (value === undefined) problems.push(`${mode}: "${role}" points to unknown primitive "${ref}"`);
        else out[mode][roleVar(role)] = value.toLowerCase();
      } else out[mode][roleVar(role)] = ref;
    }
  }
  const valueOf = (field: string, ref: string) => {
    if (!isColourRef(ref)) return ref;
    const value = table.primitives[ref];
    if (value === undefined) problems.push(`${field} points to unknown primitive "${ref}"`);
    return value?.toLowerCase();
  };
  if (table.vars) {
    out.vars = {};
    for (const [name, ref] of Object.entries(table.vars)) {
      const value = valueOf(`var "${name}"`, ref);
      if (value !== undefined) out.vars[roleVar(name)] = value;
    }
  }
  if (problems.length) throw new Error(`${where}:\n  ${problems.join("\n  ")}`);
  // A role written as a literal (not a primitive ref) is checked here, with the rest of the output.
  assertSafeTheme(out, where);
  const warn = opts.warn ?? defaultWarn;
  if (derived.size)
    warn(
      `${where}: the table was exported before ${[...derived].map((r) => `"${r}"`).join(", ")} ` +
        `existed in the [RDS] theme. Taken from the tokens Figma aliases it to (` +
        [...derived].map((r) => Object.entries(ADDED_ROLES[r]).map(([m, src]) => `${m}: ${src}`).join(", ")).join("; ") +
        `). Export the table again with figma/export-brand.js.`,
    );
  const fails = rdsContrastReport(out);
  if (fails.length)
    warn(
      `${where}: ${fails.length} pair(s) below WCAG (4.5:1 text, 3:1 non-text)\n  ` +
        fails.map((f) => `${f.mode}: ${f.fg} on ${f.bg} ${f.ratio}:1 (min ${f.min}:1)`).join("\n  "),
    );
  return out;
}
