/**
 * build-brands.ts — gera os arquivos de ENTREGA das marcas de produto e de cliente.
 * Roda: pnpm build:brands  →  brands-out/
 *
 * Contexto (#101): o pacote público deixou de carregar tema de cliente. Cada consumidor
 * passa a commitar o próprio CSS no seu repo e congela nele. Este script é como a
 * congelada é produzida — e como ela é REFEITA quando uma melhoria do motor justifica
 * reentregar (a correção de contraste da #91/#109, por exemplo).
 *
 * `brands-out/` está no .gitignore: é saída de entrega, não fonte.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { emitCss } from '@rojaostudio/ds-core/generate';

// require dinamico, nao import estatico: `private/` NAO existe no repositorio publico (#97),
// e um import estatico faria o typecheck de la falhar num script que nem se aplica. Falha com
// mensagem, nao com stack. Mesmo padrao do build-native.ts.
const req = createRequire(import.meta.url);
let brands: Record<string, any>;
try {
  brands = req("../private/brands").brands;
} catch {
  console.error("build:brands só roda no repositório de bancada — `private/brands.ts` não existe aqui.");
  process.exit(1);
}

const OUT = join(process.cwd(), "brands-out");
mkdirSync(OUT, { recursive: true });

for (const [name, def] of Object.entries(brands)) {
  const css = emitCss(def);
  writeFileSync(join(OUT, `${name}.css`), css);
  console.log(`✓ brands-out/${name}.css (${css.split("\n").length} linhas)`);
}
// O mapa nativo de cada marca sai junto: o alvo publicado é neutro e tem menos tokens, então
// um app RN com marca própria precisa do mapa completo para passar em <DSThemeProvider theme=…>.
// Iterando as marcas em vez de nomear uma: nome de marca não entra em script versionado.
const reqTsx = createRequire(import.meta.url);
for (const nome of Object.keys(brands)) {
  try {
    execFileSync(process.execPath, [reqTsx.resolve("tsx/cli"), "scripts/build-native.ts", `--brand=${nome}`], { stdio: "pipe" });
  } catch {
    /* marca sem alvo nativo — segue */
  }
}

console.log(`\n${Object.keys(brands).length} marcas geradas em brands-out/.`);
console.log(`Entrega: copie o arquivo para o repo do consumidor e importe de lá.`);
