// Theme-aware rules — the moat. These compare against the REAL token scales in
// tokens/index.ts, so they can suggest the right token. A generic linter can't do this.
import type { Rule, RuleHit } from '../types';
import { normHex, toPx } from '../util';

const COLOR_PREFIX = 'bg|text|border|ring|fill|stroke|from|via|to|divide|outline|decoration|caret|accent';

// bg-[#0d0d0d] / text-[#fff] / ring-[rgb(...)] — hardcoded color in an arbitrary value.
export const hardcodedColor: Rule = {
  id: 'hardcoded-color',
  severity: 'error',
  appliesTo: ['tsx'],
  scan(value, ctx) {
    const hits: RuleHit[] = [];
    const hexRe = new RegExp(`(?<![\\w-])(?:${COLOR_PREFIX})-\\[(#[0-9a-fA-F]{3,8})\\]`, 'g');
    let m: RegExpExecArray | null;
    while ((m = hexRe.exec(value))) {
      const prim = ctx.hexToToken.get(normHex(m[1]));
      if (prim) {
        hits.push({
          message: `cor hardcoded que já existe como primitivo (${prim})`,
          value: m[0],
          suggestion: `use um token semântico (ex.: bg-brand-primary, text-fg-primary) — ${prim}`,
          severity: 'error',
        });
      } else {
        hits.push({
          message: 'cor hardcoded fora da paleta de tokens',
          value: m[0],
          suggestion: 'tokenize a cor ou use um token existente',
          severity: 'warning',
        });
      }
    }
    const funcRe = new RegExp(`(?<![\\w-])(?:${COLOR_PREFIX})-\\[(?:rgb|rgba|hsl|hsla)\\([^\\]]*\\)\\]`, 'g');
    while ((m = funcRe.exec(value))) {
      hits.push({ message: 'cor hardcoded (rgb/hsl) — use token', value: m[0], severity: 'warning' });
    }
    return hits;
  },
};

// bg-red-500 / text-neutral-900 — raw primitive instead of a semantic token (repo governance).
export const rawPrimitiveColor: Rule = {
  id: 'raw-primitive-color',
  severity: 'warning',
  appliesTo: ['tsx'],
  scan(value, ctx) {
    const hits: RuleHit[] = [];
    const re = new RegExp(
      `(?<![\\w-])(?:${COLOR_PREFIX})-([a-z]+)-(50|100|200|300|400|500|600|700|800|900)(?![\\w-])`,
      'g',
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(value))) {
      if (!ctx.paletteNames.has(m[1])) continue;
      hits.push({
        message: `primitivo cru (${m[1]}-${m[2]}) — use um token semântico`,
        value: m[0],
        suggestion: 'ex.: bg-brand-primary, text-fg-primary, bg-danger, text-fg-muted',
      });
    }
    return hits;
  },
};

// rounded-md / rounded-[10px] — literal radius instead of rounded-(--radius-*). Governance:
// see the comment in components/button.tsx. rounded-full/none and rounded-(--radius-*) are fine.
export const radiusHardcoded: Rule = {
  id: 'radius-hardcoded',
  severity: 'warning',
  appliesTo: ['tsx'],
  scan(value) {
    const hits: RuleHit[] = [];
    let m: RegExpExecArray | null;
    const kw = /(?<![\w-])rounded(?:-[trbl]{1,2}|-[se]{1,2})?-(sm|md|lg|xl|2xl)(?![\w-])/g;
    while ((m = kw.exec(value))) {
      hits.push({ message: `radius hardcoded (rounded-${m[1]})`, value: m[0], suggestion: 'use rounded-(--radius-*)' });
    }
    const arb = /(?<![\w-])rounded(?:-[trbl]{1,2}|-[se]{1,2})?-\[([^\]]+)\]/g;
    while ((m = arb.exec(value))) {
      const v = m[1];
      if (v.startsWith('--') || v.startsWith('var')) continue; // rounded-[--radius-x] is a token ref
      const px = toPx(v);
      if (px !== null && px >= 32) continue; // handed off to over-rounding
      hits.push({ message: `radius hardcoded (${m[0]})`, value: m[0], suggestion: 'use rounded-(--radius-*)' });
    }
    return hits;
  },
};

// p-[13px] / gap-[10px] — spacing off the token scale. On-scale bracket values are tolerated.
export const spacingHardcoded: Rule = {
  id: 'spacing-off-scale',
  severity: 'warning',
  appliesTo: ['tsx'],
  scan(value, ctx) {
    const hits: RuleHit[] = [];
    const re =
      /(?<![\w-])(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y)-\[([^\]]+)\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(value))) {
      const v = m[2];
      if (v.startsWith('--') || v.startsWith('var') || v.includes('%') || v.includes('calc')) continue;
      const px = toPx(v);
      if (px === null || ctx.spaceScale.includes(px)) continue;
      hits.push({
        message: `spacing fora da escala (${v})`,
        value: m[0],
        suggestion: `escala de space: ${ctx.spaceScale.filter((n) => n <= 48).join(', ')}…`,
      });
    }
    return hits;
  },
};

export const themeAwareRules: Rule[] = [hardcodedColor, rawPrimitiveColor, radiusHardcoded, spacingHardcoded];
