/**
 * validate-themes.ts — harness TDD do gerador (issue #12).
 * Pra cada recipe: generateTheme(def) vs o styles/themes/<name>.css à mão.
 * Reporta missing / extra / diff por bloco (light + dark). Roda: pnpm tsx scripts/validate-themes.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { recipes } from '@rojaostudio/ds-core/recipes';
import { generateTheme, type TokenMap } from '@rojaostudio/ds-core/generate';
import { isNeutralBrand } from '@rojaostudio/ds-core/generate';

const THEMES = join(process.cwd(), "styles", "themes");

const norm = (v: string) => v.replace(/;$/, "").replace(/\s+/g, " ").trim();

/** Extrai { seletor → {var:value} } de um css de tema. */
function parseTheme(css: string): { light: TokenMap; dark: TokenMap } {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, ""); // tira comentários
  const light: TokenMap = {};
  const dark: TokenMap = {};
  const blockRe = /([^{}]+)\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(clean))) {
    const selector = m[1].trim();
    const target = selector.includes(".dark") ? dark : light;
    for (const decl of m[2].split(";")) {
      const i = decl.indexOf(":");
      if (i < 0) continue;
      const key = decl.slice(0, i).trim();
      if (!key.startsWith("--")) continue;
      target[key] = norm(decl.slice(i + 1));
    }
  }
  return { light, dark };
}

function diff(hand: TokenMap, gen: TokenMap, ignore: Set<string>, redundantBase?: TokenMap) {
  const missing: string[] = []; // no hand, falta no gen
  const extra: string[] = [];   // no gen, não existe no hand
  const differ: string[] = [];  // valor diverge
  for (const k of Object.keys(hand)) {
    if (ignore.has(k)) continue;
    // re-declaração redundante no hand (dark == light) → o gen omite de propósito, não é erro
    if (!(k in gen) && redundantBase && redundantBase[k] === hand[k]) continue;
    if (!(k in gen)) missing.push(k);
    else if (norm(gen[k]) !== hand[k]) differ.push(`${k}: hand="${hand[k]}" gen="${norm(gen[k])}"`);
  }
  for (const k of Object.keys(gen)) {
    if (!(k in hand) && !ignore.has(k)) extra.push(k);
  }
  return { missing, extra, differ };
}

let totalOk = 0, totalThemes = 0;
for (const [name, def] of Object.entries(recipes)) {
  totalThemes++;
  const res = generateTheme(def);
  console.log(`\n━━━ ${name} (${def.scaleMode === "mix" ? "mix" : isNeutralBrand(def) ? "neutral" : "chromatic"}) ━━━`);
  if (!res.supported) { console.log(`  ⏭️  ${res.note}`); continue; }

  const hand = parseTheme(readFileSync(join(THEMES, `${name}.css`), "utf8"));
  const ignore = new Set<string>(); // extras agora são gerados+validados (não mais patch)

  let ok = true;
  for (const block of ["light", "dark"] as const) {
    const d = diff(hand[block], res[block], ignore, block === "dark" ? hand.light : undefined);
    const clean = !d.missing.length && !d.extra.length && !d.differ.length;
    if (clean) { console.log(`  ✅ ${block}`); continue; }
    ok = false;
    console.log(`  ❌ ${block}:`);
    if (d.differ.length) d.differ.forEach((x) => console.log(`     ~ ${x}`));
    if (d.missing.length) console.log(`     − falta no gen: ${d.missing.join(", ")}`);
    if (d.extra.length) console.log(`     + sobra no gen: ${d.extra.join(", ")}`);
  }
  if (ok) totalOk++;
}
console.log(`\n═══ ${totalOk}/${totalThemes} temas reproduzidos diff-clean ═══`);

// Exit non-zero when any theme drifts, so this can gate CI (issue #74).
process.exit(totalOk === totalThemes ? 0 : 1);
