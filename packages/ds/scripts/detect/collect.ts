// Walks the included directories and returns repo-relative posix paths of .tsx/.css files.
import { readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import type { DetectConfig } from './types';

const SCANNABLE = /\.(tsx|css)$/;

export function matchIgnore(relPath: string, patterns: string[]): boolean {
  const base = relPath.split('/').pop() ?? relPath;
  return patterns.some((p) => {
    if (p.includes('*')) {
      const re = new RegExp('^' + p.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
      return re.test(relPath) || re.test(base);
    }
    return relPath.includes(p);
  });
}

function walk(abs: string, root: string, out: string[], seen: Set<string>): void {
  let entries;
  try {
    entries = readdirSync(abs, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      walk(join(abs, e.name), root, out, seen);
    } else if (SCANNABLE.test(e.name)) {
      const rel = relative(root, join(abs, e.name)).replace(/\\/g, '/');
      if (!seen.has(rel)) {
        seen.add(rel);
        out.push(rel);
      }
    }
  }
}

export function collectFiles(root: string, config: DetectConfig): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const inc of config.include) {
    const dir = inc.split(/[*?[]/)[0].replace(/\/+$/, ''); // strip any glob suffix → base dir
    walk(resolve(root, dir), root, out, seen);
  }
  return out.filter((p) => !matchIgnore(p, config.ignoreFiles)).sort();
}
