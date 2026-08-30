// Generic "AI slop" rules — the tells that make interfaces look machine-generated.
// Behavior inspired by impeccable's detector; implemented from scratch (no code copied).
import type { Rule, RuleHit } from '../types';

// bg-clip-text + text-transparent → gradient text.
export const gradientText: Rule = {
  id: 'gradient-text',
  severity: 'error',
  appliesTo: ['tsx'],
  scan(value) {
    const hasClip = /(?<![\w-])bg-clip-text(?![\w-])/.test(value);
    const hasTransparent = /(?<![\w-])text-transparent(?![\w-])/.test(value);
    if (hasClip && hasTransparent) {
      return [{ message: 'texto com gradiente (bg-clip-text + text-transparent) — tell de AI slop', value: 'bg-clip-text + text-transparent' }];
    }
    return [];
  },
};

// backdrop-blur + translucent background → glassmorphism.
export const glassmorphism: Rule = {
  id: 'glassmorphism',
  severity: 'warning',
  appliesTo: ['tsx'],
  scan(value) {
    const blur = /(?<![\w-])backdrop-blur/.test(value);
    const translucent = /(?<![\w-])bg-[a-z0-9-]+\/\d/.test(value);
    if (blur && translucent) {
      return [{ message: 'glassmorphism (backdrop-blur + fundo translúcido) — evite o efeito vidro', value: 'backdrop-blur + bg translúcido' }];
    }
    return [];
  },
};

// border-l-4 / border-t-[6px] → thick single-side stripe.
export const sideStripeBorder: Rule = {
  id: 'side-stripe-border',
  severity: 'warning',
  appliesTo: ['tsx'],
  scan(value) {
    const hits: RuleHit[] = [];
    const re = /(?<![\w-])border-([trbl])-(?:(\d+)|\[(\d+)px\])(?![\w-])/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(value))) {
      const w = m[2] ? Number(m[2]) : Number(m[3]);
      if (w >= 4) hits.push({ message: 'borda lateral grossa (side-stripe) — tell de AI slop', value: m[0] });
    }
    return hits;
  },
};

// animate-bounce or a cubic-bezier that overshoots → bouncy easing.
export const bounceEasing: Rule = {
  id: 'bounce-easing',
  severity: 'warning',
  appliesTo: ['tsx'],
  scan(value) {
    const hits: RuleHit[] = [];
    if (/(?<![\w-])animate-bounce(?![\w-])/.test(value)) {
      hits.push({ message: 'animate-bounce — easing "bounce" é tell de AI slop', value: 'animate-bounce' });
    }
    const re = /ease-\[cubic-bezier\(([^)]*)\)\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(value))) {
      const nums = m[1].split(',').map((s) => parseFloat(s));
      if (nums.some((n) => !Number.isNaN(n) && (n > 1 || n < 0))) {
        hits.push({ message: 'cubic-bezier com overshoot (bounce)', value: m[0] });
      }
    }
    return hits;
  },
};

// rounded-3xl+ or rounded-[>=32px] → excessive rounding.
export const overRounding: Rule = {
  id: 'over-rounding',
  severity: 'warning',
  appliesTo: ['tsx'],
  scan(value) {
    const hits: RuleHit[] = [];
    let m: RegExpExecArray | null;
    const kw = /(?<![\w-])rounded(?:-[trbl]{1,2})?-(3xl|4xl)(?![\w-])/g;
    while ((m = kw.exec(value))) hits.push({ message: `arredondamento excessivo (rounded-${m[1]})`, value: m[0] });
    const arb = /(?<![\w-])rounded(?:-[trbl]{1,2})?-\[(\d+(?:\.\d+)?)(px|rem)?\]/g;
    while ((m = arb.exec(value))) {
      const px = m[2] === 'rem' ? Number(m[1]) * 16 : Number(m[1]);
      if (px >= 32) hits.push({ message: `arredondamento excessivo (${m[0]})`, value: m[0] });
    }
    return hits;
  },
};

// shadow-[...] with a heavy dark/black color and large blur → custom dark glow.
export const darkGlow: Rule = {
  id: 'dark-glow',
  severity: 'warning',
  appliesTo: ['tsx'],
  scan(value) {
    const hits: RuleHit[] = [];
    const re = /shadow-\[([^\]]+)\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(value))) {
      const s = m[1];
      const dark = /#0{3,6}(?![0-9a-f])|rgba?\(\s*0\s*,\s*0\s*,\s*0|black/i.test(s);
      const blurs = [...s.matchAll(/(\d+)px/g)].map((x) => Number(x[1]));
      if (dark && blurs.length && Math.max(...blurs) >= 20) {
        hits.push({ message: 'sombra/glow escura custom — use um token de elevação', value: m[0] });
      }
    }
    return hits;
  },
};

export const aiSlopRules: Rule[] = [
  gradientText,
  glassmorphism,
  sideStripeBorder,
  bounceEasing,
  overRounding,
  darkGlow,
];
