import { readFileSync } from "node:fs";

/**
 * True while this CLI is a prerelease (0.1.0-next.x). Its DS is on the `next` tag then: a bare name
 * would install the 1.x `latest` of the DS. (The codemod is pinned at build time instead: see migrate.ts.)
 */
export function isPrerelease(): boolean {
  try {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version?: string };
    return Boolean(pkg.version?.includes("-"));
  } catch {
    return false;
  }
}

/** A package name with `@next` while prerelease. */
export const onTag = (name: string) => (isPrerelease() ? `${name}@next` : name);
