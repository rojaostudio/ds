/**
 * safe-write.ts — how the CLI writes into the project: never through a symlink, never outside the project.
 *
 * `rojao-ds init` runs inside a folder someone else may have prepared (a cloned repo, a template). A `CLAUDE.md` that
 * is a symlink to `~/.bashrc`, or an `--out` that walks out of the project, would turn "write the theme" into "write
 * over any file the user can write". So every destination is checked before anything is written:
 *   - the file itself must not be a symlink (`lstat`);
 *   - its real folder (`realpath`) must be inside the real project folder, unless `--allow-outside`;
 *   - a new file is created with `wx` (fails if something appeared there in the meantime), an existing one is opened
 *     with O_NOFOLLOW where the system has it.
 */
import { closeSync, constants, existsSync, ftruncateSync, lstatSync, mkdirSync, openSync, realpathSync, writeSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";

export class UnsafePathError extends Error {}

/** `child` is `parent` or inside it (both already real paths). */
function inside(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/** The nearest folder of `p` (or `p` itself) that exists. */
function nearestExisting(p: string): string {
  let cur = p;
  while (!existsSync(cur)) {
    const up = dirname(cur);
    if (up === cur) break;
    cur = up;
  }
  return cur;
}

const isLink = (p: string) => {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
};

/**
 * Checks a destination before anything is written. Throws UnsafePathError with a message for the terminal.
 * `label` is how the file is called in the message.
 */
export function checkDestination(cwd: string, abs: string, label: string, allowOutside = false): void {
  if (isLink(abs)) throw new UnsafePathError(`${label} é um link simbólico. Por segurança, a CLI não escreve através de links: apague o link ou aponte outro caminho.`);
  if (allowOutside) return;
  const root = realpathSync(cwd);
  const lexical = resolve(cwd, abs);
  if (!inside(resolve(cwd), lexical) && !inside(root, lexical))
    throw new UnsafePathError(`${label} fica fora da pasta do projeto (${cwd}). Use --allow-outside se é isso mesmo.`);
  const real = realpathSync(nearestExisting(dirname(abs)));
  if (!inside(root, real))
    throw new UnsafePathError(`${label} cai fora da pasta do projeto através de um link (${real}). Use --allow-outside se é isso mesmo.`);
}

/**
 * Writes `content` to `abs` after `checkDestination`, creating the folders. A new file is created exclusively (`wx`);
 * an existing one is truncated without following a link (O_NOFOLLOW where available, after an lstat everywhere).
 */
export function safeWrite(cwd: string, abs: string, content: string, label: string, allowOutside = false): void {
  checkDestination(cwd, abs, label, allowOutside);
  mkdirSync(dirname(abs), { recursive: true });
  // The folders now exist: check again, in case one of them was a link created in the meantime.
  checkDestination(cwd, abs, label, allowOutside);
  let fd: number;
  if (!existsSync(abs) && !isLink(abs)) {
    fd = openSync(abs, "wx");
  } else {
    // POSIX: O_NOFOLLOW makes the open itself fail on a link. Windows has no such flag: the lstat above is the check.
    const noFollow = (constants as { O_NOFOLLOW?: number }).O_NOFOLLOW;
    fd = noFollow ? openSync(abs, constants.O_WRONLY | noFollow) : openSync(abs, "r+");
    ftruncateSync(fd, 0);
  }
  try {
    writeSync(fd, content);
  } finally {
    closeSync(fd);
  }
}
