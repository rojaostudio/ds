/**
 * emitCss.ts — formata o output do generateTheme num theme.css legível.
 * Header + bloco light (.theme-<name>) + bloco dark (seletor duplo), agrupado
 * por seção e alinhado. Os themes/*.css passam a ser GERADOS por isto. #12.
 */
import type { BrandDef } from "../tokens/recipe.schema";
import { generateTheme, type TokenMap } from "./generateTheme";

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

export function emitCss(def: BrandDef): string {
  const { supported, light, dark, note } = generateTheme(def);
  if (!supported) throw new Error(`emitCss: ${def.name} não suportado — ${note}`);

  const Name = def.name[0].toUpperCase() + def.name.slice(1);
  const header = [
    "/* ─────────────────────────────────────────────────────────────",
    `   ROJAO DS — ${Name} theme  ·  GERADO (não editar à mão)`,
    ...(def.description ? [`   ${def.description}`] : []),
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
