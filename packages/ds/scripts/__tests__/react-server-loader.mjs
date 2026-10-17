// Loader for the dist contract test ("todo módulo sem 'use client' carrega como Server Component"): does what the
// App Router does with a 'use client' module imported from the server. It never runs it; the importer gets a client
// reference. So each 'use client' file becomes a stub with the same export names, and only the server graph runs.
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const CLIENT = /^\s*(['"])use client\1/;

export async function load(url, context, nextLoad) {
  if (!url.startsWith("file:") || !url.endsWith(".js")) return nextLoad(url, context);
  const source = await readFile(new URL(url), "utf8");
  if (!CLIENT.test(source)) return nextLoad(url, context);
  const names = [...source.matchAll(/export\s*\{([^}]*)\}/g)].flatMap((m) =>
    m[1]
      .split(",")
      .map((s) => s.trim().split(/\s+as\s+/).pop())
      .filter(Boolean),
  );
  const stub = names.map((n) => (n === "default" ? "export default function ClientReference() {}" : `export function ${n}() {}`));
  return { format: "module", shortCircuit: true, source: stub.join("\n") };
}
