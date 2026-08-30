import { defineConfig } from "tsup";
import { copyFileSync, mkdirSync } from "node:fs";

// Pré-build (#100). O pacote publicava TSX cru: 589 KB transpilados por TODO consumidor em
// TODA build fria, e só funcionava em Next com `transpilePackages` — Vite, Remix e Astro
// quebravam. Agora a transpilação é paga uma vez, aqui.
//
// `bundle: false` é a decisão central: cada arquivo de origem vira um arquivo de saída, 1:1.
// Agrupar destruiria os deep imports (`@rojaostudio/ds/components/button`, que é o caminho
// canônico recomendado) e misturaria os 54 arquivos com `'use client'` num chunk só, o que
// arrastaria a fronteira de client sobre componentes que não a têm.
export default defineConfig({
  entry: [
    "components/**/*.ts",
    "components/**/*.tsx",
    "icons/**/*.ts",
    "targets/native/**/*.ts",
    "targets/native/**/*.tsx",
    "compat/*.ts",
    "!**/__tests__/**",
    "!**/*.test.ts",
    "!**/*.test.tsx",
  ],
  format: ["esm"],
  dts: true,
  bundle: false,
  sourcemap: false,
  clean: true,
  outDir: "dist",
  onSuccess: async () => {
    // Assets que não passam pelo transpilador: o preset do NativeWind é CJS por contrato
    // (o config do consumidor faz `require`), e o theme.css é CSS.
    mkdirSync("dist/targets/native", { recursive: true });
    copyFileSync("targets/native/preset.js", "dist/targets/native/preset.cjs");
    copyFileSync("targets/native/theme.css", "dist/targets/native/theme.css");
    // Diretivas e extensão nos imports relativos — ver o script.
    await import("./scripts/fix-dist");
  },
});
