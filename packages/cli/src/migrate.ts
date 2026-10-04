/**
 * migrate.ts — `rojao-ds migrate`: forwards to the codemod (`@rojaostudio/ds-codemod`) through npx.
 *
 * The codemod parses TypeScript with ts-morph (megabytes, with the TypeScript compiler inside). Pulling that into the
 * CLI would turn a 20 KB shell into a heavy install for everyone who only wants `init`. So the CLI does not depend
 * on it: it asks npx to fetch the codemod on demand, with the arguments as they came, and exits with its code.
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/** Set at build time from packages/codemod/package.json (tsup and vitest `define`). */
declare const __CODEMOD_VERSION__: string;

/**
 * The codemod, pinned to the version released with this CLI. Not a floating tag (`@next`, `latest`): what npx
 * downloads and runs on the user's code is exactly the version this CLI was built and tested with.
 */
export const CODEMOD_PACKAGE = `@rojaostudio/ds-codemod@${__CODEMOD_VERSION__}`;

export const MIGRATE_HELP = `rojao-ds migrate — leva um projeto do @rojaostudio/ds 0.x/1.x para a 2.0

Uso:
  npx rojao-ds migrate <pasta-do-projeto> [--apply] [--verbose] [--report <arquivo.json>]

É um atalho para:
  npx ${CODEMOD_PACKAGE} <pasta-do-projeto> [...]

Sem --apply é um dry-run: mostra o plano e os casos manuais (arquivo:linha) e não escreve nada.
`;

/** Runs a command with the terminal attached and resolves with its exit code. */
export type Spawn = (command: string, args: string[]) => Promise<number>;

/**
 * How to run npx without a shell. On Windows `npx` is a .cmd, which Node 20+ only runs through `shell: true`, and a
 * shell would read the user's arguments (a folder name) as a command line. So on Windows npx is run as what it is,
 * npm's `npx-cli.js`, by this same Node (`process.execPath`). Elsewhere `npx` is an executable and runs directly.
 * Null when npx-cli.js is not found next to Node or npm.
 */
export function npxInvocation(
  args: string[],
  env: { platform: string; execPath: string; npmExecPath?: string; exists?: (p: string) => boolean } = {
    platform: process.platform,
    execPath: process.execPath,
    npmExecPath: process.env.npm_execpath,
  },
): { command: string; args: string[] } | null {
  if (env.platform !== "win32") return { command: "npx", args };
  const exists = env.exists ?? existsSync;
  const candidates = [
    // Run through npx/npm, npm_execpath is npm's own npm-cli.js (or npx-cli.js): its sibling is the one.
    ...(env.npmExecPath && /\.c?js$/i.test(env.npmExecPath) ? [join(dirname(env.npmExecPath), "npx-cli.js")] : []),
    // The npm that ships with Node.
    join(dirname(env.execPath), "node_modules", "npm", "bin", "npx-cli.js"),
  ];
  const cli = candidates.find((c) => exists(c));
  return cli ? { command: env.execPath, args: [cli, ...args] } : null;
}

/** The npx invocation for the codemod, with the user's arguments untouched. */
export function codemodCommand(args: string[]): { command: string; args: string[] } {
  // `--yes`: npx would otherwise stop to ask before installing the package, which hangs without a TTY (CI).
  return { command: "npx", args: ["--yes", CODEMOD_PACKAGE, ...args] };
}

export async function runMigrate(
  args: string[],
  io: { out: (l: string) => void; err: (l: string) => void; spawn?: Spawn },
): Promise<number> {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    io.out(MIGRATE_HELP);
    return args.length === 0 ? 1 : 0;
  }
  if (!io.spawn) {
    io.err("✗ este ambiente não consegue rodar o npx.");
    return 1;
  }
  const { command, args: forwarded } = codemodCommand(args);
  io.err(`→ ${command} ${forwarded.join(" ")}`);
  return io.spawn(command, forwarded);
}
