#!/usr/bin/env node
/**
 * cli.ts — o binário `rojao-ds`. Liga o terminal de verdade ao `run` (init.ts) e sai com o código dele.
 * Prompt com `node:readline`: a CLI não tem dependência além do motor.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createInterface, type Interface } from "node:readline/promises";
import { run } from "./init";
import { npxInvocation } from "./migrate";

function version(): string {
  try {
    // dist/cli.js e src/cli.ts estão ambos a um nível do package.json.
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

// Criado só se algo for perguntado: sem isso, o readline segura o processo aberto.
const prompt: { rl?: Interface } = {};
const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);

const code = await run(
  process.argv.slice(2),
  {
    cwd: process.cwd(),
    out: (l) => process.stdout.write(`${l}\n`),
    err: (l) => process.stderr.write(`${l}\n`),
    ask: (q) => {
      prompt.rl ??= createInterface({ input: process.stdin, output: process.stdout });
      return prompt.rl.question(q);
    },
    interactive,
    // Nunca com shell: os argumentos (uma pasta, vindos de quem roda) não podem virar linha de comando. No Windows o
    // npx é um .cmd, então roda como o que ele é, o npx-cli.js do npm, por este mesmo Node (npxInvocation).
    spawn: (command, args) =>
      new Promise((done) => {
        const inv = command === "npx" ? npxInvocation(args) : { command, args };
        if (!inv) {
          process.stderr.write(
            `✗ não achei o npx-cli.js do npm ao lado do Node (${process.execPath}). Rode direto: npx ${args.join(" ")}\n`,
          );
          done(1);
          return;
        }
        const child = spawn(inv.command, inv.args, { stdio: "inherit", shell: false });
        child.on("error", (e) => {
          process.stderr.write(`✗ não consegui rodar ${command}: ${e.message}\n`);
          done(1);
        });
        child.on("exit", (code) => done(code ?? 1));
      }),
  },
  version(),
).catch((e: unknown) => {
  process.stderr.write(`✗ erro inesperado: ${e instanceof Error ? e.message : String(e)}\n`);
  return 1;
});

prompt.rl?.close();
process.exitCode = code;
