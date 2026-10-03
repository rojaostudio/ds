/**
 * migrate.ts — `rojao-ds migrate`: forwards to the codemod (`@rojaostudio/ds-codemod`) through npx.
 *
 * The codemod parses TypeScript with ts-morph (megabytes, with the TypeScript compiler inside). Pulling that into the
 * CLI would turn a 20 KB shell into a heavy install for everyone who only wants `init`. So the CLI does not depend
 * on it: it asks npx to fetch the codemod on demand, with the arguments as they came, and exits with its code.
 */

import { onTag } from "./prerelease";

/** The codemod, on the `next` tag while this CLI is a prerelease. */
export const CODEMOD_PACKAGE = onTag("@rojaostudio/ds-codemod");

export const MIGRATE_HELP = `rojao-ds migrate — leva um projeto do @rojaostudio/ds 0.x/1.x para a 2.0

Uso:
  npx rojao-ds migrate <pasta-do-projeto> [--apply] [--verbose] [--report <arquivo.json>]

É um atalho para:
  npx ${CODEMOD_PACKAGE} <pasta-do-projeto> [...]

Sem --apply é um dry-run: mostra o plano e os casos manuais (arquivo:linha) e não escreve nada.
`;

/** Runs a command with the terminal attached and resolves with its exit code. */
export type Spawn = (command: string, args: string[]) => Promise<number>;

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
