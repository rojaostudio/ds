/**
 * build-themes.ts — regenera os styles/themes/*.css PÚBLICOS a partir das receitas.
 * Roda: pnpm build:themes
 *
 * Só o tema público sai aqui. As marcas de produto e de cliente saem por
 * `pnpm build:brands`, para `brands-out/` — pasta de ENTREGA, fora do git e fora do
 * pacote. Ver rojao-ds#101.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { recipes } from '@rojaostudio/ds-core/recipes';
import { emitCss } from '@rojaostudio/ds-core/generate';

const THEMES = join(process.cwd(), "styles", "themes");

for (const [name, def] of Object.entries(recipes)) {
  const css = emitCss(def);
  writeFileSync(join(THEMES, `${name}.css`), css);
  console.log(`✓ gerado styles/themes/${name}.css (${css.split("\n").length} linhas)`);
}
console.log(`\n${Object.keys(recipes).length} tema(s) público(s) regenerado(s).`);
