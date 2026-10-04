import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

// Um arquivo só, ESM, para Node. O `@rojaostudio/ds-core` fica de fora do bundle (é dependência,
// e o tsup não embute dependências): a CLI é casca fina sobre o motor publicado.
// O shebang de src/cli.ts é preservado e o tsup marca o arquivo como executável.
//
// A versão do codemod que o `rojao-ds migrate` baixa é FIXADA aqui, no build, a partir do package.json do codemod:
// o npx roda exatamente a versão lançada junto com esta CLI, não uma tag que anda (`@next`, `latest`).
const codemod = JSON.parse(readFileSync(new URL("../codemod/package.json", import.meta.url), "utf8")) as { version: string };

export default defineConfig({
  entry: { cli: "src/cli.ts" },
  format: ["esm"],
  platform: "node",
  target: "node20",
  dts: false,
  sourcemap: false,
  clean: true,
  outDir: "dist",
  define: { __CODEMOD_VERSION__: JSON.stringify(codemod.version) },
});
