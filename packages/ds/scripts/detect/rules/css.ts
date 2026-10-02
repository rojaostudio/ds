// CSS-facing rules. Not in the default scan (default = components/**/*.tsx), because the
// generated token/theme CSS legitimately holds raw hexes. Available when a user opts to
// include authored CSS. Each item is a "prop: value" declaration.
import type { Rule, RuleHit } from '../types';
import { normHex } from '../util';

const COLOR_PROP = /(color|background|border|fill|stroke|shadow|outline)/;

export const cssHardcodedColor: Rule = {
  id: 'css-hardcoded-color',
  severity: 'warning',
  appliesTo: ['css'],
  scan(value, ctx) {
    const i = value.indexOf(':');
    if (i < 0) return [];
    const prop = value.slice(0, i).trim().toLowerCase();
    if (prop.startsWith('--') || !COLOR_PROP.test(prop)) return [];
    const val = value.slice(i + 1);
    const hits: RuleHit[] = [];
    const re = /#[0-9a-fA-F]{3,8}\b/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(val))) {
      const prim = ctx.hexToToken.get(normHex(m[0]));
      hits.push({
        message: prim ? `hex hardcoded (${prim}) — use var(--color-*)` : 'hex hardcoded fora dos tokens',
        value: m[0],
        severity: prim ? 'error' : 'warning',
      });
    }
    return hits;
  },
};

export const cssHardcodedFont: Rule = {
  id: 'overused-font',
  severity: 'warning',
  appliesTo: ['css'],
  scan(value) {
    const i = value.indexOf(':');
    if (i < 0) return [];
    const prop = value.slice(0, i).trim().toLowerCase();
    if (prop !== 'font-family' && prop !== 'font') return [];
    const val = value.slice(i + 1);
    if (val.includes('var(--font')) return [];
    if (/["'][A-Za-z]/.test(val)) {
      return [{ message: 'font-family literal — use var(--font-family*)', value: val.trim() }];
    }
    return [];
  },
};

export const cssRules: Rule[] = [cssHardcodedColor, cssHardcodedFont];
