// Builds the RuleContext (sources of truth) from tokens/index.ts + styles/base.css.
// This is the theme-aware core: rules compare against the REAL token scales, not guesses.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { primitives } from '@rojaostudio/ds-core/tokens';
import type { RuleContext } from './types';
import { normHex } from './util';

const ALPHA_PALETTES = new Set(['blackAlpha', 'whiteAlpha']);

export function buildContext(root: string, brand: string | null): RuleContext {
  const hexToToken = new Map<string, string>();
  const knownHexes = new Set<string>();
  const paletteNames = new Set<string>();

  const colors = primitives.color as Record<string, unknown>;
  for (const [name, val] of Object.entries(colors)) {
    if (typeof val === 'string') {
      // white / black
      const n = normHex(val);
      if (!hexToToken.has(n)) hexToToken.set(n, name);
      knownHexes.add(n);
      continue;
    }
    if (val && typeof val === 'object') {
      if (!ALPHA_PALETTES.has(name)) paletteNames.add(name);
      for (const [step, hex] of Object.entries(val as Record<string, string>)) {
        const n = normHex(hex);
        if (!hexToToken.has(n)) hexToToken.set(n, `${name}-${step}`);
        knownHexes.add(n);
      }
    }
  }

  const radiusScale = Object.values(primitives.radius) as number[];
  const spaceScale = Object.values(primitives.space) as number[];

  // Semantic color utilities available in Tailwind come from base.css `@theme inline`
  // (`--color-<name>` → `bg-<name>`/`text-<name>`/`border-<name>`).
  const semanticColorUtilities = new Set<string>();
  try {
    const css = readFileSync(join(root, 'styles', 'base.css'), 'utf8');
    const start = css.indexOf('@theme inline');
    const block = start >= 0 ? css.slice(start) : '';
    const re = /--color-([a-z0-9-]+)\s*:/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(block))) semanticColorUtilities.add(m[1]);
  } catch {
    // base.css is optional for the context; rules degrade gracefully.
  }

  return {
    hexToToken,
    knownHexes,
    paletteNames,
    radiusScale,
    spaceScale,
    semanticColorUtilities,
    brand,
  };
}
