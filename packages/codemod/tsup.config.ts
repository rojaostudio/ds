import { defineConfig } from "tsup";

// One file, ESM, for Node: the engine (codemod.ts) and the map (map.ts) are bundled into the bin. ts-morph stays
// out (it is a dependency, and tsup does not bundle dependencies): it is the one runtime dependency of the package.
// The shebang of src/cli.ts is kept and tsup marks the file executable.
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
