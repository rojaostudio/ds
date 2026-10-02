import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { describe, expect, it } from 'vitest';

// The barrel (@rojaostudio/ds/components) must not reach an optional peer dependency, not even
// through another file: importing { Button } would make every consumer install it (#2).
const COMPONENTS = join(__dirname, '..');
const pkg = JSON.parse(readFileSync(join(COMPONENTS, '..', 'package.json'), 'utf8'));
const OPTIONAL = Object.entries(pkg.peerDependenciesMeta ?? {})
  .filter(([, meta]) => (meta as { optional?: boolean }).optional)
  .map(([name]) => name)
  // Components draw their icons inline; lucide is only a peer for the legacy icon re-exports.
  .filter((name) => !name.startsWith('react-native') && !name.startsWith('expo-'));

function resolve(from: string, spec: string): string | null {
  const base = join(dirname(from), spec);
  for (const ext of ['.ts', '.tsx', '/index.ts']) if (existsSync(base + ext)) return base + ext;
  return null;
}

function reach(file: string, seen = new Set<string>()): Map<string, string> {
  const found = new Map<string, string>();
  if (seen.has(file)) return found;
  seen.add(file);
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/^\s*(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]/gm)) {
    if (/^\s*(?:import|export)\s+type\s/.test(m[0])) continue;
    const spec = m[1];
    if (spec.startsWith('.')) {
      const next = resolve(file, spec);
      if (next) for (const [k, v] of reach(next, seen)) found.set(k, v);
    } else {
      const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
      if (OPTIONAL.includes(name)) found.set(name, file.replace(COMPONENTS, 'components'));
    }
  }
  return found;
}

describe('components barrel', () => {
  it('reaches no optional peer dependency', () => {
    expect(OPTIONAL.length).toBeGreaterThan(0);
    expect(Object.fromEntries(reach(join(COMPONENTS, 'index.ts')))).toEqual({});
  });
});
