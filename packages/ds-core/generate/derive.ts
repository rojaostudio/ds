/**
 * derive.ts — the accent a recipe did not name, derived from its primary.
 *
 * In the [RDS], colors/secondary is the action colour (Button tone=action, the action Tile, links) and colors/accent
 * the highlight (Badge accent, the highlighter, the selection tints). A recipe may name only its primary (the
 * generator's "your colour", a logo). The secondary is then the primary itself: the action is the colour chosen, and
 * the theme only walks its hover, active and text until they hold their contrast (rdsTheme). The accent is drawn from
 * the primary here, in OKLCH, by a fixed rule, so the same primary always gives the same accent.
 *
 * accent (highlight): a hue contrast with the primary, ACCENT_TURN (150°) along the OKLCH wheel: the complement
 *   minus 30°. The full complement pits red against green and orange against blue at equal weight; 150° keeps the
 *   warm/cool opposition without it, and is the house pairing (navy at 264° with the flare orange at 45°, 141°
 *   apart). Fixed lightness ACCENT_L (0.72, a bright fill under black text, light enough for its tints) and a chroma of
 *   at least ACCENT_C_MIN (a pale primary still gets a vivid accent), at most ACCENT_C_MAX, reduced to the sRGB gamut
 *   with the hue kept. A neutral primary has no hue to turn (a grey's hue is noise): its accent takes the fixed
 *   NEUTRAL_ACCENT_HUE (55°, the highlighter orange of the house).
 *
 * Every pair of the contrast report (rdsContrastReport) is then held by the theme itself, as for any colour named in
 * a recipe; the tests run the hard colours through it in light, dark, plate and print.
 */
import { hexToOklch, isHex, oklchToHex } from "./scale";

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/** The turn of the accent's hue from the primary's, in degrees. */
export const ACCENT_TURN = 150;
/** Lightness of the accent. */
export const ACCENT_L = 0.72;
/** Chroma of the accent: the primary's, kept between these two. */
export const ACCENT_C_MIN = 0.14;
export const ACCENT_C_MAX = 0.22;
/** Below this chroma a primary is neutral: its hue is noise. */
export const NEUTRAL_C = 0.04;
/** The accent hue of a neutral primary, in degrees. */
export const NEUTRAL_ACCENT_HUE = 55;

/** The accent (highlight) of a primary hex (#rrggbb). See the rule above. */
export function deriveAccent(primary: string): string {
  if (!isHex(primary)) throw new Error(`deriveAccent: ${JSON.stringify(String(primary).slice(0, 40))} is not a #rrggbb colour`);
  const [, C, h] = hexToOklch(primary);
  const hue = C < NEUTRAL_C ? NEUTRAL_ACCENT_HUE : (((h * DEG + ACCENT_TURN) % 360) + 360) % 360;
  const chroma = Math.min(ACCENT_C_MAX, Math.max(ACCENT_C_MIN, C));
  return oklchToHex(ACCENT_L, chroma, hue * RAD).toLowerCase();
}
