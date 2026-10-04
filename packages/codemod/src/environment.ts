/**
 * environment.ts — what the codemod reads about the project around the code: the DS version declared in
 * package.json, the git state, where `node_modules` is (a hoisted monorepo keeps it above the app) and which package
 * manager the project uses.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export type From = '1.x' | 'next';

export const DS_NAMES = ['@rojaostudio/ds', '@rojao/ds'] as const;
const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const;

/** The DS dependency declared in a package.json, if any: its name and version range. */
export function dsDependency(pkg: unknown): { name: string; version: string } | undefined {
  if (!pkg || typeof pkg !== 'object') return undefined;
  for (const field of DEP_FIELDS) {
    const deps = (pkg as Record<string, unknown>)[field];
    if (!deps || typeof deps !== 'object') continue;
    for (const name of DS_NAMES) {
      const version = (deps as Record<string, unknown>)[name];
      if (typeof version === 'string') return { name, version };
    }
  }
  return undefined;
}

/**
 * The migration a version range calls for: 0.x/1.x → `'1.x'`, 2.x (2.0.0-next included) → `'next'`. Undefined when
 * the range does not say (`workspace:*`, `latest`, a git URL, a tag, 3.x): the person has to tell with `--from`.
 */
export function fromForVersion(range: string): From | undefined {
  const m = /^\s*(?:[\^~]|[<>]=?|=)?\s*v?(\d+)(?:\.|$|\s)/.exec(range);
  if (!m) return undefined;
  const major = Number(m[1]);
  if (major <= 1) return '1.x';
  if (major === 2) return 'next';
  return undefined;
}

export type GitState = { kind: 'clean' } | { kind: 'dirty'; lines: string[] } | { kind: 'none'; reason: string };

/**
 * The working tree state. git runs with the repository's fsmonitor off (a `core.fsmonitor` in a hostile repo's
 * config is a command git would execute), with `safe.directory` reset (a repository owned by someone else is not
 * trusted, and counts as no git), without the caller's GIT_* variables (which could point git at another tree),
 * and with its output piped, never on the terminal.
 */
export function gitState(root: string, env: NodeJS.ProcessEnv = process.env): GitState {
  const cleanEnv = Object.fromEntries(Object.entries(env).filter(([k]) => !k.startsWith('GIT_')));
  try {
    const out = execFileSync('git', ['-c', 'core.fsmonitor=false', '-c', 'safe.directory=', '-C', root, 'status', '--porcelain'], {
      encoding: 'utf8',
      stdio: 'pipe',
      env: cleanEnv,
    });
    const lines = out.split(/\r?\n/).filter(Boolean);
    return lines.length ? { kind: 'dirty', lines } : { kind: 'clean' };
  } catch (err) {
    const stderr = String((err as { stderr?: unknown }).stderr ?? '').trim().split(/\r?\n/)[0];
    return { kind: 'none', reason: stderr || (err as Error).message };
  }
}

/** The first `rel` found from `start` up to the file-system root (a hoisted monorepo keeps node_modules above). */
export function findUp(start: string, rel: string): string | undefined {
  let dir = resolve(start);
  for (;;) {
    const candidate = join(dir, rel);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

const LOCKFILES: [string, string][] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['package-lock.json', 'npm'],
  ['npm-shrinkwrap.json', 'npm'],
];

/**
 * The project's package manager: the nearest lockfile, from the project folder up (in a monorepo it is at the root);
 * without one, the manager that ran the codemod (`npm_config_user_agent`: `pnpm/9.0.0 npm/? node/…`); npm last.
 */
export function packageManager(root: string, env: NodeJS.ProcessEnv = process.env): string {
  let dir = resolve(root);
  for (;;) {
    for (const [file, manager] of LOCKFILES) if (existsSync(join(dir, file))) return manager;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const agent = /^(pnpm|yarn|bun|npm)\//.exec(env.npm_config_user_agent ?? '');
  return agent ? agent[1] : 'npm';
}
