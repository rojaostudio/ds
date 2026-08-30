import { defineConfig } from "tsup";

// Pré-build (#100). O pacote publicava TypeScript cru: os `exports` apontavam pra `.ts`, e
// isso só funciona em consumidor que transpila dependência — na prática, Next com
// `transpilePackages`. Vite, Remix, Astro e Node puro quebravam. E todo consumidor pagava a
// transpilação em toda build fria; agora paga-se uma vez, aqui.
export default defineConfig({
  entry: {
    index: "index.ts",
    tokens: "tokens/index.ts",
    generate: "generate/index.ts",
    recipes: "recipes/index.ts",
    themes: "themes/index.ts",
  },
  format: ["esm"],
  dts: true,
  // Sem bundling: cada entry vira um arquivo, sem arrastar as outras junto. O motor é TS puro
  // e pequeno; o ganho de agrupar não paga a duplicação entre entries.
  splitting: true,
  treeshake: true,
  // Sem sourcemap: os mapas seriam 112 kB contra 38 kB de codigo, e a fonte esta publica
  // num repo MIT. Quem precisa depurar le o original, nao o mapa.
  sourcemap: false,
  clean: true,
  outDir: "dist",
});
