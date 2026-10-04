import { defineConfig } from "tsup";

// Um arquivo só, ESM, para Node. O `@rojaostudio/ds-core` fica de fora do bundle (é dependência,
// e o tsup não embute dependências): a CLI é casca fina sobre o motor publicado.
// O shebang de src/cli.ts é preservado e o tsup marca o arquivo como executável.

export default defineConfig({
  entry: { cli: "src/cli.ts" },
  format: ["esm"],
  platform: "node",
  target: "node20",
  dts: false,
  sourcemap: false,
  clean: true,
  outDir: "dist",
});
