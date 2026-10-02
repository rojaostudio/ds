// Small pure helpers shared by the detector.

/** Normalize a hex color to lowercase `#rrggbb` (or `#rrggbbaa`). Expands shorthand. */
export function normHex(hex: string): string {
  let h = hex.trim().toLowerCase();
  if (h.startsWith('#')) h = h.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  else if (h.length === 4) h = h.split('').map((c) => c + c).join(''); // #rgba shorthand
  return '#' + h;
}

/** Convert a CSS length (`13px`, `1.5rem`, bare number) to px. Returns null if unknown/unitful. */
export function toPx(value: string): number | null {
  const m = value.trim().match(/^(-?\d+(?:\.\d+)?)(px|rem)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (m[2] === 'rem') return n * 16;
  return n; // px or bare number treated as px
}
