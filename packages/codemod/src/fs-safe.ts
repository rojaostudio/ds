/**
 * fs-safe.ts — how the codemod reads the project tree and writes into it.
 *
 *  - One walk of the tree, never following a symbolic link (a link can point outside the project, or into a
 *    `node_modules`, and the codemod would read or rewrite someone else's files).
 *  - Every write stays inside the project root (checked on the real path of the folder it lands in) and never goes
 *    through a link: a target that is a link, or anything but a plain file, is refused.
 *  - Every write is atomic: a temporary file in the same folder, then a rename over the target. An interrupted run
 *    leaves each file either as it was or as the codemod meant it, never half written.
 */
import { lstatSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { randomBytes } from 'node:crypto';

/** Build output, dependencies and VCS folders; dot folders are skipped too (`.claude/worktrees` holds copies). */
const IGNORED = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.turbo', 'out', 'coverage']);

/** Declarations carry no JSX usage to migrate. */
const DECLARATION = /\.d\.[mc]?ts$/;

export interface ScannedFile {
  /** Relative to the root, with forward slashes. */
  rel: string;
  text: string;
}

export interface Scan {
  /** The `.css` files. */
  css: ScannedFile[];
  /** The code files with one of the requested extensions (declarations left out). */
  code: ScannedFile[];
  /** Links the walk saw and did not follow (relative paths). */
  links: string[];
}

/**
 * The one walk of the project. A file-system walk, not `git grep`: `git grep` only sees TRACKED files, and in one
 * consumer the `app/globals.css` was never committed — the theme migration would have been skipped, silently.
 */
export function scanTree(root: string, extensions: string[]): Scan {
  const scan: Scan = { css: [], code: [], links: [] };
  const visit = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) {
        scan.links.push(rel);
        continue;
      }
      if (entry.isDirectory()) {
        if (IGNORED.has(entry.name) || entry.name.startsWith('.')) continue;
        visit(join(dir, entry.name), rel);
      } else if (entry.isFile()) {
        if (entry.name.endsWith('.css')) {
          scan.css.push({ rel, text: readFileSync(join(dir, entry.name), 'utf8') });
        } else if (extensions.some((e) => entry.name.endsWith(e)) && !DECLARATION.test(entry.name)) {
          scan.code.push({ rel, text: readFileSync(join(dir, entry.name), 'utf8') });
        }
      }
    }
  };
  visit(root, '');
  return scan;
}

function within(root: string, path: string): boolean {
  const rel = relative(root, path);
  return rel === '' || (!isAbsolute(rel) && rel.split(sep)[0] !== '..');
}

/**
 * Why the codemod must not write `rel` (a link, not a plain file, outside the root), or undefined when it may.
 * `mustNotExist`: the target is new (the frozen theme) and an existing file is not overwritten.
 */
export function unsafeTarget(root: string, rel: string, mustNotExist = false): string | undefined {
  const abs = resolve(root, rel);
  let parent: string;
  try {
    parent = realpathSync(dirname(abs));
  } catch {
    return `a pasta de ${rel} não existe`;
  }
  if (!within(realpathSync(root), join(parent, basename(abs)))) return `${rel} fica fora de ${root} (link no caminho?)`;
  let stat;
  try {
    stat = lstatSync(abs);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw err;
  }
  if (stat.isSymbolicLink()) return `${rel} é um link simbólico: o codemod não escreve através de links`;
  if (!stat.isFile()) return `${rel} não é um arquivo comum`;
  if (mustNotExist) return `${rel} já existe`;
  return undefined;
}

/** Writes `content` to `path` atomically: a temporary file next to it, then a rename. */
export function writeAtomic(path: string, content: string): void {
  const tmp = join(dirname(path), `.${basename(path)}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`);
  try {
    writeFileSync(tmp, content, { encoding: 'utf8', flag: 'wx' });
    renameSync(tmp, path);
  } catch (err) {
    rmSync(tmp, { force: true });
    throw err;
  }
}

/** Writes a file of the project: inside the root, never through a link, atomically. Throws on refusal. */
export function writeProjectFile(root: string, rel: string, content: string, mustNotExist = false): void {
  const why = unsafeTarget(root, rel, mustNotExist);
  if (why) throw new Error(why);
  writeAtomic(join(realpathSync(dirname(resolve(root, rel))), basename(rel)), content);
}

/** Removes a file of the project, with the same checks as a write. */
export function removeProjectFile(root: string, rel: string): void {
  const why = unsafeTarget(root, rel);
  if (why) throw new Error(why);
  unlinkSync(resolve(root, rel));
}
