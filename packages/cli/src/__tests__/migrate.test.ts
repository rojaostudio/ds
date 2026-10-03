import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { run, type Io } from "../init";
import { CODEMOD_PACKAGE, codemodCommand } from "../migrate";

function io(exit = 0) {
  const out: string[] = [];
  const err: string[] = [];
  const calls: { command: string; args: string[] }[] = [];
  const value: Io = {
    cwd: process.cwd(),
    out: (l) => out.push(l),
    err: (l) => err.push(l),
    ask: async () => "",
    interactive: false,
    spawn: async (command, args) => {
      calls.push({ command, args });
      return exit;
    },
  };
  return { io: value, out, err, calls };
}

describe("rojao-ds migrate", () => {
  it("forwards every argument, untouched, to npx @rojaostudio/ds-codemod", async () => {
    const t = io();
    const code = await run(["migrate", "../app", "--apply", "--report", "r.json"], t.io);
    expect(code).toBe(0);
    expect(t.calls).toEqual([{ command: "npx", args: ["--yes", CODEMOD_PACKAGE, "../app", "--apply", "--report", "r.json"] }]);
  });

  it("exits with the codemod's code", async () => {
    const t = io(3);
    expect(await run(["migrate", "."], t.io)).toBe(3);
  });

  it("without a folder, shows its help and runs nothing", async () => {
    const t = io();
    expect(await run(["migrate"], t.io)).toBe(1);
    expect(t.out.join("\n")).toContain(`npx ${CODEMOD_PACKAGE}`);
    expect(t.calls).toEqual([]);
  });

  it("the main help lists migrate", async () => {
    const t = io();
    await run(["--help"], t.io);
    expect(t.out.join("\n")).toContain("rojao-ds migrate");
  });

  it("codemodCommand never asks npx to confirm (it would hang in CI)", () => {
    expect(codemodCommand(["x"]).args.slice(0, 2)).toEqual(["--yes", CODEMOD_PACKAGE]);
  });

  it("the CLI does not depend on the codemod (ts-morph stays out of it)", () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, "..", "..", "package.json"), "utf8"));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies });
    expect(deps).not.toContain(CODEMOD_PACKAGE);
    expect(deps).not.toContain("ts-morph");
  });
});
