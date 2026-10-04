import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

// The same pin as tsup.config.ts: the codemod version comes from its package.json.
const codemod = JSON.parse(readFileSync(new URL("../codemod/package.json", import.meta.url), "utf8")) as { version: string };

export default defineConfig({
  define: { __CODEMOD_VERSION__: JSON.stringify(codemod.version) },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
