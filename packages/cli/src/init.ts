/**
 * init.ts — `rojao-ds init`: a marca vira o tema [RDS] (`rds-theme.css`) e o arquivo de regras
 * da IA (CLAUDE.md · .cursorrules · AGENTS.md).
 *
 * Casca fina sobre o motor (`@rojaostudio/ds-core/generate`): nada de regra de domínio aqui.
 * Toda E/S de terminal passa por `Io`, para os testes rodarem sem TTY.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import {
  emitClaudeMd,
  emitRdsCss,
  generateRdsTheme,
  rdsThemeFromTable,
  type BrandDef,
  type ClaudeMdTarget,
  type RdsBrandTable,
  type RdsTheme,
} from "@rojaostudio/ds-core/generate";

export type Io = {
  /** Pasta do projeto. */
  cwd: string;
  out: (linha: string) => void;
  err: (linha: string) => void;
  /** Faz uma pergunta e devolve a resposta. Só é chamado quando `interactive`. */
  ask: (pergunta: string) => Promise<string>;
  /** Há alguém no terminal para responder. Sem isso, nada é perguntado. */
  interactive: boolean;
};

export const TARGETS: Record<ClaudeMdTarget, string> = {
  claude: "CLAUDE.md",
  agents: "AGENTS.md",
  cursor: ".cursorrules",
};

const DEFAULT_OUT = "rds-theme.css";

export const HELP = `rojao-ds — o tema da sua marca no Rojão DS 2.0

Uso:
  npx rojao-ds init [opções]

Gera, na pasta atual:
  • o tema da marca (${DEFAULT_OUT}), para importar DEPOIS de @rojaostudio/ds/styles/rds.css;
  • o arquivo de regras da IA (CLAUDE.md, .cursorrules ou AGENTS.md).

De onde vem a marca (escolha uma; sem nenhuma, a cor é perguntada):
  -c, --color <hex>      a cor da marca, ex.: #7C3AED
  -r, --recipe <arquivo> o recipe.json baixado em ds.rojao.ai
  -t, --table <arquivo>  a tabela exportada do Figma (figma/export-brand.js, rds-brand-table/1)

Opções:
  -n, --name <nome>      nome da marca (padrão: o do recipe/tabela, senão o do package.json)
      --target <alvo>    claude | cursor | agents (padrão: o arquivo que já existir, senão claude)
  -o, --out <arquivo>    onde escrever o tema (padrão: ${DEFAULT_OUT})
  -y, --yes              sobrescreve sem perguntar
  -h, --help             mostra esta ajuda
  -v, --version          mostra a versão

Exemplos:
  npx rojao-ds init --color "#7C3AED"
  npx rojao-ds init --recipe ./marca.recipe.json --target cursor
  npx rojao-ds init --table ./brand/marca.rds.json --out src/styles/tema.css --yes
`;

class CliError extends Error {}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** "7c3aed" · "#7C3AED" · "#abc" → "#7C3AED"; inválido → null. */
export function normalizeHex(v: string): string | null {
  const m = v.trim().match(HEX);
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return `#${h.toUpperCase()}`;
}

/** Nome seguro para título e arquivo: minúsculas, dígitos e hífen. */
function slug(v: string): string {
  return v
    .replace(/^@[^/]+\//, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function readJson(cwd: string, file: string, what: string): unknown {
  const path = resolve(cwd, file);
  if (!existsSync(path)) throw new CliError(`${what} não encontrado: ${file}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new CliError(`${what} não é um JSON válido (${file}): ${(e as Error).message}`);
  }
}

function projectName(cwd: string): string | null {
  const pkg = join(cwd, "package.json");
  if (!existsSync(pkg)) return null;
  try {
    const name = (JSON.parse(readFileSync(pkg, "utf8")) as { name?: unknown }).name;
    return typeof name === "string" && slug(name) ? slug(name) : null;
  } catch {
    return null;
  }
}

/** Uma BrandDef mínima de uma cor só: o resto o motor deriva. */
function fromColor(hex: string, name: string): BrandDef {
  return { name, brand: { primary: hex }, surface: "zinc", text: "zinc", fonts: { body: "inter" } };
}

/** O recipe.json do site é `{ $version, ...BrandDef }`. Arquivo é entrada de terceiro: confere o mínimo. */
function fromRecipe(raw: unknown, name: string | undefined): BrandDef {
  if (!raw || typeof raw !== "object") throw new CliError("recipe inválido: esperava um objeto JSON.");
  const { $version: _v, ...rest } = raw as Record<string, unknown>;
  const brand = rest.brand as Record<string, unknown> | undefined;
  if (!brand || typeof brand.primary !== "string" || !brand.primary) {
    throw new CliError("recipe inválido: falta brand.primary (a cor da marca).");
  }
  const primary = normalizeHex(brand.primary) ?? brand.primary;
  const own = typeof rest.name === "string" ? slug(rest.name) : "";
  return {
    surface: "zinc",
    text: "zinc",
    fonts: { body: "inter" },
    ...(rest as Partial<BrandDef>),
    name: name ?? (own || "marca"),
    brand: { ...(brand as BrandDef["brand"]), primary },
  };
}

function asTable(raw: unknown): RdsBrandTable {
  const t = raw as Partial<RdsBrandTable> | null;
  if (!t || typeof t !== "object" || !t.modes || !t.primitives) {
    throw new CliError("tabela inválida: esperava o formato rds-brand-table/1 (com modes e primitives), exportado por figma/export-brand.js.");
  }
  if (t.$schema && t.$schema !== "rds-brand-table/1") {
    throw new CliError(`tabela em formato desconhecido: ${t.$schema} (esperava rds-brand-table/1).`);
  }
  return t as RdsBrandTable;
}

type Brand = { label: string; name: string; theme: RdsTheme; source: BrandDef | RdsBrandTable };

async function askColor(io: Io): Promise<string> {
  for (let i = 0; i < 3; i++) {
    const hex = normalizeHex(await io.ask("Cor da marca (hex, ex.: #7C3AED): "));
    if (hex) return hex;
    io.err("  Não é uma cor hex. Use 6 dígitos, como #7C3AED.");
  }
  throw new CliError("cor não informada.");
}

async function resolveBrand(v: Values, io: Io): Promise<Brand> {
  const modes = [v.color, v.recipe, v.table].filter((x) => x !== undefined);
  if (modes.length > 1) throw new CliError("use só uma fonte de marca: --color, --recipe ou --table.");
  const name = v.name !== undefined ? slug(v.name) || undefined : undefined;

  try {
    if (v.table !== undefined) {
      const table = asTable(readJson(io.cwd, v.table, "tabela"));
      const n = name ?? (slug(table.name ?? "") || "marca");
      const theme = rdsThemeFromTable(table);
      return { label: `tabela do Figma (${v.table})`, name: n, theme, source: { ...table, name: n } };
    }
    if (v.recipe !== undefined) {
      const def = fromRecipe(readJson(io.cwd, v.recipe, "recipe"), name);
      return { label: `recipe (${v.recipe})`, name: def.name, theme: generateRdsTheme(def), source: def };
    }
    let hex: string;
    if (v.color !== undefined) {
      const h = normalizeHex(v.color);
      if (!h) throw new CliError(`cor inválida: ${v.color} (use hex, ex.: #7C3AED).`);
      hex = h;
    } else if (io.interactive) {
      hex = await askColor(io);
    } else {
      throw new CliError("informe a marca: --color <hex>, --recipe <arquivo> ou --table <arquivo>.");
    }
    const def = fromColor(hex, name ?? projectName(io.cwd) ?? "marca");
    return { label: `cor ${hex}`, name: def.name, theme: generateRdsTheme(def), source: def };
  } catch (e) {
    if (e instanceof CliError) throw e;
    // Erro do motor (papel faltando, primitivo desconhecido, cor que não resolve): a mensagem dele já lista tudo.
    throw new CliError(`não foi possível gerar o tema: ${(e as Error).message}`);
  }
}

async function resolveTarget(v: Values, io: Io): Promise<ClaudeMdTarget> {
  if (v.target !== undefined) {
    const t = v.target.toLowerCase();
    const byFile = (Object.keys(TARGETS) as ClaudeMdTarget[]).find((k) => TARGETS[k].toLowerCase() === t);
    if (t in TARGETS) return t as ClaudeMdTarget;
    if (byFile) return byFile;
    throw new CliError(`alvo inválido: ${v.target} (use claude, cursor ou agents).`);
  }
  const found = (Object.keys(TARGETS) as ClaudeMdTarget[]).filter((k) => existsSync(join(io.cwd, TARGETS[k])));
  if (found.length <= 1) return found[0] ?? "claude";
  if (!io.interactive || v.yes) {
    io.out(`Encontrei ${found.map((k) => TARGETS[k]).join(", ")}; uso ${TARGETS[found[0]]} (--target escolhe outro).`);
    return found[0];
  }
  const lista = found.map((k, i) => `${i + 1}) ${TARGETS[k]}`).join("  ");
  const r = (await io.ask(`Encontrei mais de um arquivo de regras: ${lista}. Qual usar? [1] `)).trim();
  const i = r === "" ? 0 : Number(r) - 1;
  if (!Number.isInteger(i) || !found[i]) throw new CliError(`opção inválida: ${r}`);
  return found[i];
}

async function confirm(io: Io, pergunta: string): Promise<boolean> {
  const r = (await io.ask(`${pergunta} (s/N) `)).trim().toLowerCase();
  return r === "s" || r === "sim" || r === "y" || r === "yes";
}

/** Caminho para colar no @import: relativo ao projeto, com barra normal. */
function importPath(cwd: string, abs: string): string {
  const rel = relative(cwd, abs).split(sep).join("/");
  return rel.startsWith(".") ? rel : `./${rel}`;
}

function installCommand(cwd: string): string {
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm add @rojaostudio/ds";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn add @rojaostudio/ds";
  if (existsSync(join(cwd, "bun.lockb")) || existsSync(join(cwd, "bun.lock"))) return "bun add @rojaostudio/ds";
  if (existsSync(join(cwd, "package-lock.json"))) return "npm install @rojaostudio/ds";
  return "pnpm add @rojaostudio/ds";
}

const OPTIONS = {
  color: { type: "string", short: "c" },
  recipe: { type: "string", short: "r" },
  table: { type: "string", short: "t" },
  name: { type: "string", short: "n" },
  target: { type: "string" },
  out: { type: "string", short: "o" },
  yes: { type: "boolean", short: "y" },
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
} as const;

type Values = {
  color?: string;
  recipe?: string;
  table?: string;
  name?: string;
  target?: string;
  out?: string;
  yes?: boolean;
  help?: boolean;
  version?: boolean;
};

/** Roda a CLI. Devolve o código de saída. */
export async function run(argv: string[], io: Io, version = "0.0.0"): Promise<number> {
  let values: Values;
  let positionals: string[];
  try {
    ({ values, positionals } = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true, strict: true }));
  } catch (e) {
    io.err(`✗ ${(e as Error).message.replace(/\. To specify.*$/s, "")}`);
    io.err("  Veja: npx rojao-ds --help");
    return 1;
  }

  if (values.version) {
    io.out(version);
    return 0;
  }
  const [command, ...extra] = positionals;
  if (values.help || command === undefined || command === "help") {
    io.out(HELP);
    return command === undefined && !values.help ? 1 : 0;
  }
  if (command !== "init") {
    io.err(`✗ comando desconhecido: ${command}. O único comando é init.`);
    io.err("  Veja: npx rojao-ds --help");
    return 1;
  }
  if (extra.length) {
    io.err(`✗ argumento a mais: ${extra.join(" ")}`);
    return 1;
  }

  try {
    return await init(values, io);
  } catch (e) {
    if (e instanceof CliError) {
      io.err(`✗ ${e.message}`);
      return 1;
    }
    throw e;
  }
}

async function init(v: Values, io: Io): Promise<number> {
  const brand = await resolveBrand(v, io);
  const target = await resolveTarget(v, io);

  const out = v.out ?? DEFAULT_OUT;
  if (!out.endsWith(".css")) throw new CliError(`--out precisa terminar em .css: ${out}`);
  const cssAbs = isAbsolute(out) ? out : resolve(io.cwd, out);
  const rulesAbs = join(io.cwd, TARGETS[target]);
  const cssImport = importPath(io.cwd, cssAbs);

  const files = [
    { abs: cssAbs, label: importPath(io.cwd, cssAbs).replace(/^\.\//, ""), content: emitRdsCss(brand.theme) },
    {
      abs: rulesAbs,
      label: TARGETS[target],
      content: emitClaudeMd(brand.source, { theme: brand.theme, cssFile: cssImport.replace(/^\.\//, ""), target }),
    },
  ];

  // Antes de escrever qualquer coisa: o que já existe? Sem --yes e sem terminal, recusa tudo.
  const existing = files.filter((f) => existsSync(f.abs));
  if (existing.length && !v.yes && !io.interactive) {
    for (const f of existing) io.err(`✗ ${f.label} já existe.`);
    io.err("  Nada foi escrito. Rode de novo com --yes para sobrescrever.");
    return 1;
  }

  io.out(`Marca: ${brand.name} — ${brand.label}`);
  for (const f of files) {
    const exists = existsSync(f.abs);
    if (exists && !v.yes && !(await confirm(io, `${f.label} já existe. Sobrescrever?`))) {
      io.out(`– ${f.label} mantido`);
      continue;
    }
    mkdirSync(dirname(f.abs), { recursive: true });
    writeFileSync(f.abs, f.content);
    io.out(`✓ ${f.label} ${exists ? "atualizado" : "criado"}`);
  }

  io.out("");
  io.out("Próximos passos:");
  io.out(`  1. ${installCommand(io.cwd)}`);
  io.out("  2. No CSS raiz do app (o tema vem DEPOIS):");
  io.out('       @import "@rojaostudio/ds/styles/rds.css";');
  io.out(`       @import "${cssImport}";`);
  if (cssImport.slice(2).includes("/") || cssImport.startsWith("../")) {
    io.out("     (caminho a partir da raiz do projeto: ajuste ao lugar do seu CSS)");
  }
  io.out(`  3. Peça a tela para a IA: ela lê o ${TARGETS[target]}.`);
  return 0;
}
