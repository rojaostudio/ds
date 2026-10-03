import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RDS_ROLES as ROLES } from "@rojaostudio/ds-core/generate";
import { BLOCK_END, BLOCK_START, mergeRulesBlock, normalizeHex, run, type Io } from "../init";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "rojao-cli-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** Io de teste: respostas enfileiradas, saída capturada. */
function io(opts: { answers?: string[]; interactive?: boolean } = {}) {
  const answers = [...(opts.answers ?? [])];
  const out: string[] = [];
  const err: string[] = [];
  const asked: string[] = [];
  const value: Io = {
    cwd: dir,
    out: (l) => out.push(l),
    err: (l) => err.push(l),
    ask: async (q) => {
      asked.push(q);
      if (!answers.length) throw new Error(`pergunta sem resposta: ${q}`);
      return answers.shift()!;
    },
    interactive: opts.interactive ?? false,
  };
  return { io: value, out, err, asked, text: () => out.join("\n"), errText: () => err.join("\n") };
}

const read = (f: string) => readFileSync(join(dir, f), "utf8");
const write = (f: string, c: string) => writeFileSync(join(dir, f), c);

function brandTable(name = "sample") {
  const mode = (primary: string) =>
    Object.fromEntries(
      ROLES.map(([role]) => [
        role,
        role === "type/font/mono" ? "Roboto Mono" : role === "colors/primary/default" ? primary : "zinc/500",
      ]),
    );
  return {
    $schema: "rds-brand-table/1",
    name,
    primitives: { "brand/400": "#22BBF2", "brand/500": "#00AEEF", "zinc/500": "#71717a" },
    modes: { light: mode("brand/500"), dark: mode("brand/400"), brand: mode("brand/500") },
  };
}

describe("rojao-ds — ajuda e argumentos", () => {
  it("--help mostra o uso em português", async () => {
    const t = io();
    expect(await run(["--help"], t.io)).toBe(0);
    expect(t.text()).toContain("npx rojao-ds init");
    expect(t.text()).toContain("--recipe");
  });

  it("sem comando mostra a ajuda e sai com erro", async () => {
    const t = io();
    expect(await run([], t.io)).toBe(1);
    expect(t.text()).toContain("Uso:");
  });

  it("comando ou opção desconhecidos falham", async () => {
    expect(await run(["deploy"], io().io)).toBe(1);
    const t = io();
    expect(await run(["init", "--cor", "#fff"], t.io)).toBe(1);
    expect(t.errText()).toContain("--cor");
  });

  it("--version", async () => {
    const t = io();
    expect(await run(["--version"], t.io, "1.2.3")).toBe(0);
    expect(t.text()).toBe("1.2.3");
  });

  it("normaliza hex", () => {
    expect(normalizeHex("7c3aed")).toBe("#7C3AED");
    expect(normalizeHex(" #abc ")).toBe("#AABBCC");
    expect(normalizeHex("roxo")).toBeNull();
  });
});

describe("rojao-ds init — modos de entrada", () => {
  it("--color: escreve o tema e o CLAUDE.md num projeto vazio", async () => {
    const t = io();
    expect(await run(["init", "--color", "#7C3AED", "--name", "Acme"], t.io)).toBe(0);
    const css = read("rds-theme.css");
    expect(css).toMatch(/^:root, \.ds-scope, \[data-rds-scope\] \{/);
    expect(css).toContain("--colors-primary-default: #7C3AED");
    expect(css).toContain(".ds-plate, [data-rds-plate] {");
    const md = read("CLAUDE.md");
    expect(md).toContain("# Design System — Acme");
    expect(md).toContain('@import "./rds-theme.css";');
    expect(t.text()).toContain('@import "@rojaostudio/ds/styles/rds.css";');
    expect(t.text()).toContain('@import "./rds-theme.css";');
    expect(t.text()).toContain("pnpm add @rojaostudio/ds");
  });

  it("sem cor e com terminal: pergunta até receber um hex válido", async () => {
    const t = io({ interactive: true, answers: ["roxo", "7c3aed"] });
    expect(await run(["init"], t.io)).toBe(0);
    expect(t.asked).toHaveLength(2);
    expect(t.errText()).toContain("Não é uma cor hex");
    expect(read("rds-theme.css")).toContain("--colors-primary-default: #7C3AED");
  });

  it("sem cor e sem terminal: falha sem escrever nada", async () => {
    const t = io();
    expect(await run(["init"], t.io)).toBe(1);
    expect(t.errText()).toContain("--color");
    expect(existsSync(join(dir, "rds-theme.css"))).toBe(false);
  });

  it("o nome vem do package.json quando não é informado", async () => {
    write("package.json", JSON.stringify({ name: "@empresa/Meu App" }));
    expect(await run(["init", "-c", "#0EA5E9"], io().io)).toBe(0);
    expect(read("CLAUDE.md")).toContain("# Design System — Meu-app");
  });

  it("--recipe: lê o recipe.json do site ({ $version, ...BrandDef })", async () => {
    write(
      "marca.recipe.json",
      JSON.stringify({
        $version: "1",
        name: "demo",
        brand: { primary: "#d4476a", accent: "#0ea5e9" },
        surface: "neutral",
        text: "neutral",
        fonts: { body: "inter" },
      }),
    );
    const t = io();
    expect(await run(["init", "--recipe", "marca.recipe.json"], t.io)).toBe(0);
    expect(read("rds-theme.css")).toContain("--colors-primary-default: #D4476A");
    expect(read("rds-theme.css")).toContain("--colors-accent-default: #0ea5e9");
    expect(read("CLAUDE.md")).toContain("# Design System — Demo");
  });

  it("--recipe sem cor de marca falha com mensagem clara", async () => {
    write("r.json", JSON.stringify({ name: "x", brand: {} }));
    const t = io();
    expect(await run(["init", "--recipe", "r.json"], t.io)).toBe(1);
    expect(t.errText()).toContain("brand.primary");
  });

  it("--recipe inexistente ou JSON quebrado", async () => {
    const a = io();
    expect(await run(["init", "--recipe", "nada.json"], a.io)).toBe(1);
    expect(a.errText()).toContain("não encontrado");
    write("quebrado.json", "{");
    const b = io();
    expect(await run(["init", "--recipe", "quebrado.json"], b.io)).toBe(1);
    expect(b.errText()).toContain("JSON válido");
  });

  it("--table: gera um para um da tabela do Figma", async () => {
    write("marca.rds.json", JSON.stringify(brandTable()));
    const t = io();
    expect(await run(["init", "--table", "marca.rds.json"], t.io)).toBe(0);
    const css = read("rds-theme.css");
    expect(css).toContain("--colors-primary-default: #00aeef");
    expect(css).toContain("--colors-primary-default: #22bbf2"); // dark
    expect(read("CLAUDE.md")).toContain("# Design System — Sample");
  });

  it("--table com papel faltando lista o problema", async () => {
    const table = brandTable();
    delete (table.modes.dark as Record<string, string>)["surface/page"];
    write("t.json", JSON.stringify(table));
    const t = io();
    expect(await run(["init", "--table", "t.json"], t.io)).toBe(1);
    expect(t.errText()).toContain('dark: role "surface/page" is missing');
  });

  it("--table que não é tabela é recusada", async () => {
    write("t.json", JSON.stringify({ name: "x", brand: { primary: "#000000" } }));
    const t = io();
    expect(await run(["init", "--table", "t.json"], t.io)).toBe(1);
    expect(t.errText()).toContain("rds-brand-table/1");
  });

  it("duas fontes de marca ao mesmo tempo falham", async () => {
    const t = io();
    expect(await run(["init", "--color", "#000000", "--table", "t.json"], t.io)).toBe(1);
    expect(t.errText()).toContain("só uma fonte");
  });
});

describe("rojao-ds init — alvos", () => {
  it("sem arquivo de regras: CLAUDE.md", async () => {
    await run(["init", "-c", "#7C3AED"], io().io);
    expect(existsSync(join(dir, "CLAUDE.md"))).toBe(true);
  });

  it("detecta o .cursorrules existente", async () => {
    write(".cursorrules", "regras antigas");
    expect(await run(["init", "-c", "#7C3AED", "--yes"], io().io)).toBe(0);
    expect(read(".cursorrules")).toContain("file: .cursorrules");
    expect(read(".cursorrules")).toMatch(/^regras antigas\n\n<!-- rojao-ds:start -->/);
    expect(existsSync(join(dir, "CLAUDE.md"))).toBe(false);
  });

  it("detecta o AGENTS.md existente", async () => {
    write("AGENTS.md", "x");
    expect(await run(["init", "-c", "#7C3AED", "-y"], io().io)).toBe(0);
    expect(read("AGENTS.md")).toContain("file: AGENTS.md");
  });

  it("--target força o alvo (por nome ou por arquivo)", async () => {
    write("CLAUDE.md", "x");
    expect(await run(["init", "-c", "#7C3AED", "--target", "agents"], io().io)).toBe(0);
    expect(read("AGENTS.md")).toContain("file: AGENTS.md");
    expect(read("CLAUDE.md")).toBe("x");
    rmSync(join(dir, "rds-theme.css"));
    expect(await run(["init", "-c", "#7C3AED", "--target", ".cursorrules"], io().io)).toBe(0);
    expect(read(".cursorrules")).toContain("file: .cursorrules");
  });

  it("--target inválido falha", async () => {
    const t = io();
    expect(await run(["init", "-c", "#7C3AED", "--target", "copilot"], t.io)).toBe(1);
    expect(t.errText()).toContain("alvo inválido");
  });

  it("vários arquivos de regras: pergunta qual usar", async () => {
    write("CLAUDE.md", "a");
    write("AGENTS.md", "b");
    const t = io({ interactive: true, answers: ["2"] });
    expect(await run(["init", "-c", "#7C3AED"], t.io)).toBe(0);
    expect(read("AGENTS.md")).toContain("file: AGENTS.md");
    expect(read("CLAUDE.md")).toBe("a");
  });
});

describe("rojao-ds init — tema existente", () => {
  it("sem terminal e sem --yes: recusa e não escreve nada", async () => {
    write("rds-theme.css", "/* meu tema */");
    const t = io();
    expect(await run(["init", "-c", "#7C3AED"], t.io)).toBe(1);
    expect(t.errText()).toContain("rds-theme.css já existe");
    expect(t.errText()).toContain("--yes");
    expect(read("rds-theme.css")).toBe("/* meu tema */");
    // Nem o arquivo de regras: a recusa vem antes de qualquer escrita.
    expect(existsSync(join(dir, "CLAUDE.md"))).toBe(false);
  });

  it("com terminal: pergunta e respeita o não", async () => {
    write("rds-theme.css", "/* meu tema */");
    const t = io({ interactive: true, answers: ["n"] });
    expect(await run(["init", "-c", "#7C3AED"], t.io)).toBe(0);
    expect(t.asked).toEqual(["rds-theme.css já existe. Sobrescrever? (s/N) "]);
    expect(read("rds-theme.css")).toBe("/* meu tema */");
    expect(t.text()).toContain("– rds-theme.css mantido");
  });

  it("com terminal: o sim sobrescreve", async () => {
    write("rds-theme.css", "/* meu tema */");
    const t = io({ interactive: true, answers: ["s"] });
    expect(await run(["init", "-c", "#7C3AED"], t.io)).toBe(0);
    expect(read("rds-theme.css")).toContain("--colors-primary-default");
  });

  it("--yes sobrescreve sem perguntar", async () => {
    write("rds-theme.css", "/* meu tema */");
    const t = io({ interactive: true });
    expect(await run(["init", "-c", "#7C3AED", "--yes"], t.io)).toBe(0);
    expect(t.asked).toEqual([]);
    expect(read("rds-theme.css")).toContain("--colors-primary-default");
    expect(t.text()).toContain("✓ rds-theme.css atualizado");
  });
});

describe("rojao-ds init — bloco no arquivo de regras", () => {
  it("arquivo novo nasce só com o bloco entre marcadores", async () => {
    await run(["init", "-c", "#7C3AED"], io().io);
    const md = read("CLAUDE.md");
    expect(md.startsWith(`${BLOCK_START}\n# Design System`)).toBe(true);
    expect(md.endsWith(`${BLOCK_END}\n`)).toBe(true);
  });

  it("arquivo sem bloco: acrescenta no fim, sem perguntar, mesmo sem terminal", async () => {
    write("CLAUDE.md", "# Meu projeto\n\nRegras minhas.\n");
    const t = io();
    expect(await run(["init", "-c", "#7C3AED"], t.io)).toBe(0);
    const md = read("CLAUDE.md");
    expect(md.startsWith(`# Meu projeto\n\nRegras minhas.\n\n${BLOCK_START}\n# Design System`)).toBe(true);
    expect(md.endsWith(`${BLOCK_END}\n`)).toBe(true);
    expect(t.text()).toContain("acrescentado no fim");
  });

  it("arquivo com bloco: substitui só o bloco e mantém o texto antes e depois", async () => {
    write("CLAUDE.md", `antes\n\n${BLOCK_START}\nconteúdo velho\n${BLOCK_END}\n\ndepois\n`);
    const t = io();
    expect(await run(["init", "-c", "#7C3AED", "--name", "acme"], t.io)).toBe(0);
    const md = read("CLAUDE.md");
    expect(md.startsWith(`antes\n\n${BLOCK_START}\n# Design System — Acme`)).toBe(true);
    expect(md.endsWith(`${BLOCK_END}\n\ndepois\n`)).toBe(true);
    expect(md).not.toContain("conteúdo velho");
    expect(md.split(BLOCK_START)).toHaveLength(2);
    expect(t.text()).toContain("bloco do Rojão DS atualizado");
  });

  it("reexecução é idempotente", async () => {
    write("CLAUDE.md", "minhas regras\n");
    await run(["init", "-c", "#7C3AED"], io().io);
    const first = read("CLAUDE.md");
    const t = io();
    expect(await run(["init", "-c", "#7C3AED", "--yes"], t.io)).toBe(0);
    expect(read("CLAUDE.md")).toBe(first);
    expect(first.split(BLOCK_START)).toHaveLength(2);
    expect(t.text()).toContain("CLAUDE.md já está em dia");
  });

  it("mergeRulesBlock: arquivo vazio vira só o bloco", () => {
    expect(mergeRulesBlock("", "B")).toEqual({ text: "B\n", mode: "appended" });
  });
});

describe("rojao-ds init — saída", () => {
  it("--out cria a pasta e aponta o @import e o CLAUDE.md para ela", async () => {
    const t = io();
    expect(await run(["init", "-c", "#7C3AED", "--out", "src/styles/tema.css"], t.io)).toBe(0);
    expect(read("src/styles/tema.css")).toContain("--colors-primary-default");
    expect(t.text()).toContain('@import "./src/styles/tema.css";');
    expect(read("CLAUDE.md")).toContain('@import "./src/styles/tema.css";');
  });

  it("--out precisa ser .css", async () => {
    const t = io();
    expect(await run(["init", "-c", "#7C3AED", "--out", "tema.txt"], t.io)).toBe(1);
  });

  it("o comando de instalação segue o lockfile", async () => {
    write("package-lock.json", "{}");
    const t = io();
    await run(["init", "-c", "#7C3AED"], t.io);
    expect(t.text()).toContain("npm install @rojaostudio/ds");
  });
});
