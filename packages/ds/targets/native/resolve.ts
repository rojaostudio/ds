/**
 * resolve.ts — resolve a saída do gerador (generateTheme) para cores utilizáveis no
 * React Native. RN não tem CSS vars nem color-mix, então:
 *   var(--color-coal-900)                          → '#1a1a1a'
 *   color-mix(in srgb, var(--color-red-500) 8%, transparent) → 'rgba(244,67,54,0.08)'
 *
 * Puro e determinístico (testável). Não conhece o gerador nem o RN — só strings de cor.
 */

export type Rgba = { r: number; g: number; b: number; a: number };

/** primitives.color (nested) → mapa plano keyed pelo nome do ref: 'coal-900', 'white', 'whiteAlpha-100'. */
export function flattenPrimitives(color: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, val] of Object.entries(color)) {
    if (typeof val === 'string') {
      out[name] = val;
    } else if (val && typeof val === 'object') {
      for (const [step, hex] of Object.entries(val as Record<string, string>)) {
        out[`${name}-${step}`] = hex;
      }
    }
  }
  return out;
}

function hexToRgba(hex: string): Rgba {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function toCss({ r, g, b, a }: Rgba): string {
  if (a >= 1) {
    const hx = (n: number) => n.toString(16).padStart(2, '0');
    return `#${hx(r)}${hx(g)}${hx(b)}`;
  }
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(4))})`;
}

/** Resolve um operando: transparent | var(--color-X) | #hex | rgb(a)(...). */
function resolveColor(token: string, prims: Record<string, string>): Rgba {
  const t = token.trim();
  if (t === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  const varMatch = t.match(/^var\(--color-([a-zA-Z]+(?:-\d+)?)\)$/);
  if (varMatch) {
    const hex = prims[varMatch[1]];
    if (!hex) throw new Error(`Primitiva não encontrada: --color-${varMatch[1]}`);
    return hexToRgba(hex);
  }
  if (t.startsWith('#')) return hexToRgba(t);

  const rgb = t.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const p = rgb[1].split(',').map((s) => s.trim());
    return { r: +p[0], g: +p[1], b: +p[2], a: p[3] !== undefined ? +p[3] : 1 };
  }
  throw new Error(`Cor não reconhecida: "${token}"`);
}

/** color-mix(in srgb, A [p%], B [q%]) — mistura sRGB ponderada por alpha; B=transparent vira alpha. */
function resolveColorMix(expr: string, prims: Record<string, string>): Rgba {
  const inner = expr.replace(/^color-mix\(in srgb,\s*/, '').replace(/\)\s*$/, '');
  const comma = inner.indexOf(','); // gerador produz exatamente 2 operandos, sem nesting
  const [aTok, aPct] = splitPct(inner.slice(0, comma));
  const [bTok, bPct] = splitPct(inner.slice(comma + 1));
  const A = resolveColor(aTok, prims);
  const B = resolveColor(bTok, prims);

  const wa = (aPct ?? (bPct !== undefined ? 100 - bPct : 50)) / 100;
  const a = wa * A.a + (1 - wa) * B.a;
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const mix = (ca: number, cb: number) => Math.round((wa * A.a * ca + (1 - wa) * B.a * cb) / a);
  return { r: mix(A.r, B.r), g: mix(A.g, B.g), b: mix(A.b, B.b), a: Number(a.toFixed(4)) };
}

function splitPct(s: string): [string, number | undefined] {
  const m = s.trim().match(/^(.*?)\s+(\d+(?:\.\d+)?)%$/);
  return m ? [m[1].trim(), +m[2]] : [s.trim(), undefined];
}

/** Resolve um valor de token para cor RN (hex ou rgba()). Valores não-cor passam direto. */
export function resolveValue(value: string, prims: Record<string, string>): string {
  const v = value.trim();
  if (v.startsWith('color-mix(')) return toCss(resolveColorMix(v, prims));
  if (v.startsWith('var(--color-')) return toCss(resolveColor(v, prims));
  if (v.startsWith('#')) return toCss(hexToRgba(v));
  return v; // rgba()/rgb() literal, fontes etc.
}

/** Resolve um TokenMap inteiro, descartando tokens de fonte (não são cor). */
export function resolveTokenMap(
  map: Record<string, string>,
  prims: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(map)) {
    if (key.startsWith('--font')) continue;
    // Decoração das faixas de identidade da vitrine/Bio (web-only): texture é um radial-gradient —
    // não existe/renderiza no RN (o storefront público é web). Descarta, como as fontes.
    if (key.startsWith('--brand-secondary-texture')) continue;
    out[key] = resolveValue(val, prims);
  }
  return out;
}
