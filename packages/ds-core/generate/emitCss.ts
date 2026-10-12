/**
 * emitCss.ts — formata o output do generateTheme num theme.css legível.
 * Header + bloco light (.theme-<name>) + bloco dark (seletor duplo), agrupado
 * por seção e alinhado. Os themes/*.css passam a ser GERADOS por isto. #12.
 */
import type { BrandDef } from "../tokens/recipe.schema";
import { generateTheme, type TokenMap } from "./generateTheme";
import { collector, isSafeCssValue, isSafeThemeName, isSafeVarName, oneLine, preview } from "./validate";

const SECTIONS: { label: string; test: (k: string) => boolean }[] = [
  { label: "Tipografia", test: (k) => k.startsWith("--font-") },
  { label: "Brand", test: (k) => k.startsWith("--brand-") },
  { label: "Surface", test: (k) => k.startsWith("--surface-") },
  { label: "Border", test: (k) => k.startsWith("--border-") },
  { label: "Text", test: (k) => k.startsWith("--text-") },
  { label: "Icon", test: (k) => k.startsWith("--icon-") },
  { label: "Radius", test: (k) => k.startsWith("--radius-") },
];

function block(map: TokenMap, indent = "  "): string {
  const keys = Object.keys(map);
  const pad = Math.max(...keys.map((k) => k.length));
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const s of SECTIONS) {
    const inSec = keys.filter(s.test);
    if (!inSec.length) continue;
    lines.push(`${indent}/* ── ${s.label} ── */`);
    for (const k of inSec) { lines.push(`${indent}${k.padEnd(pad)}: ${map[k]};`); seen.add(k); }
    lines.push("");
  }
  // Catch-all — tokens de decisão explícita (extras: shell, feedback, etc.)
  const rest = keys.filter((k) => !seen.has(k));
  if (rest.length) {
    lines.push(`${indent}/* ── Extras (decisões do tema) ── */`);
    for (const k of rest) lines.push(`${indent}${k.padEnd(pad)}: ${map[k]};`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

/**
 * Checks a recipe before it becomes CSS (a public API: the recipe may come from a user): the name goes into a
 * selector, the fonts into `var(--font-<name>)`, the palettes into variable names and values. Throws an
 * RdsValidationError listing every field that fails.
 */
function assertSafeRecipe(def: BrandDef): void {
  const c = collector("emitCss");
  if (!isSafeThemeName(def.name)) c.problems.push(`name: ${preview(def.name)} is not a valid theme name (a-z, 0-9 and "-", up to 32)`);
  const f = def.fonts ?? ({} as BrandDef["fonts"]);
  for (const key of ["body", "display", "editorial", "mono"] as const) {
    const v = (f as Record<string, unknown>)[key];
    if (v !== undefined) c.name(`fonts.${key}`, v);
  }
  for (const [name, val] of Object.entries(def.palettes ?? {})) {
    if (!isSafeVarName(name)) c.problems.push(`palettes: ${preview(name)} is not a valid name`);
    if (typeof val === "string") c.color(`palettes.${name}`, val);
    else if (val && typeof val === "object") for (const [step, hex] of Object.entries(val)) {
      if (!/^\d{2,3}$/.test(step)) c.problems.push(`palettes.${name}: ${preview(step)} is not a step`);
      c.color(`palettes.${name}.${step}`, hex);
    }
  }
  c.done();
}

/** Defence in depth: every generated key is a custom property and every value a plain CSS value. */
function assertSafeOutput(map: TokenMap, mode: string): void {
  const c = collector(`emitCss (${mode})`);
  for (const [k, v] of Object.entries(map)) {
    if (!k.startsWith("--") || !isSafeVarName(k.slice(2))) c.problems.push(`${preview(k)} is not a valid CSS variable name`);
    else if (!isSafeCssValue(v)) c.problems.push(`${k}: ${preview(v)} is not a safe CSS value`);
  }
  c.done();
}

export function emitCss(def: BrandDef): string {
  assertSafeRecipe(def);
  const { supported, light, dark, note } = generateTheme(def);
  if (supported) {
    assertSafeOutput(light, "light");
    assertSafeOutput(dark, "dark");
  }
  if (!supported) throw new Error(`emitCss: ${def.name} não suportado — ${note}`);

  const Name = def.name[0].toUpperCase() + def.name.slice(1);
  const header = [
    "/* ─────────────────────────────────────────────────────────────",
    `   ROJAO DS — ${Name} theme  ·  GERADO (não editar à mão)`,
    // One line, and it cannot close the comment it sits in.
    ...(def.description ? [`   ${oneLine(def.description).replace(/\*\//g, "* /")}`] : []),
    "",
    `   Fonte: recipes/index.ts (${def.name}) → generate/emitCss.ts`,
    "   Regerar: pnpm build:themes",
    "",
    `     <html class="theme-${def.name}">       → light`,
    `     <html class="theme-${def.name} dark">  → dark`,
    "",
    // Propriedade do OUTPUT (#98). O gerador é MIT, mas o que sai dele é da marca de quem
    // gerou — e isso precisa estar escrito NO arquivo, não só na página: quem recebe o
    // theme.css de um colega meses depois não viu a página nenhuma.
    "   Este arquivo é seu. Gerado a partir da sua marca, sem amarra de licença:",
    "   use, edite e redistribua como quiser. O gerador é MIT; o resultado é seu.",
    "   ───────────────────────────────────────────────────────────── */",
  ].join("\n");

  const lightBlock = `.theme-${def.name} {\n${block(light)}\n}`;
  const darkBlock = Object.keys(dark).length
    ? `\n\n.theme-${def.name}.dark,\n:is(.dark).theme-${def.name} {\n${block(dark)}\n}`
    : "";

  return `${header}\n\n${lightBlock}${darkBlock}\n`;
}
