import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "generate/**/*.test.ts",
      "themes/**/*.test.ts",
      // `private/` não existe no repositório público (#101): o glob não casar é correto.
      "private/**/*.test.ts",
    ],
  },
});
