#!/usr/bin/env node
/**
 * cli.ts — o binário `rojao-ds`. Liga o terminal de verdade ao `run` (init.ts) e sai com o código dele.
 * Prompt com `node:readline`: a CLI não tem dependência além do motor.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createInterface, type Interface } from "node:readline/promises";
import { run } from "./init";

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
    // npx é um .cmd no Windows, e o Node 20+ só roda .cmd com shell. Os argumentos vêm do próprio usuário.
    spawn: (command, args) =>
      new Promise((done) => {
        const win = process.platform === "win32";
        // Com shell, os argumentos viram uma linha só: uma pasta com espaço precisa de aspas.
        const argv = win ? args.map((a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)) : args;
        const child = spawn(command, argv, { stdio: "inherit", shell: win });
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
