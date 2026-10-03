import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// The native target (`@rojaostudio/ds/native/*`) is experimental in 2.0: it still follows the 1.x API and the 1.x
// theme, outside semver until 2.1. The web side must never depend on it, or a change there would break the web
// components that do follow semver.
const PKG = join(__dirname, '..', '..');
const WEB = ['components', 'icons', 'compat'];

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : files(p);
    return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

describe('native target boundary', () => {
  it('no web file imports the native target', () => {
    const offenders: string[] = [];
    for (const root of WEB) {
      for (const file of files(join(PKG, root))) {
        const src = readFileSync(file, 'utf8');
        for (const m of src.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
          const spec = m[1];
          if (/targets\/native|^@rojaostudio\/ds\/native|react-native/.test(spec)) {
            offenders.push(`${relative(PKG, file).replace(/\\/g, '/')} → ${spec}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the native entry points say they are experimental', () => {
    for (const entry of ['targets/native/index.ts', 'targets/native/components/index.ts']) {
      expect(readFileSync(join(PKG, entry), 'utf8')).toContain('@experimental');
    }
  });
});
