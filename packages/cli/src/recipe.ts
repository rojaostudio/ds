/**
 * recipe.ts — the two brand files the CLI reads (`--recipe`, `--table`), parsed strictly.
 *
 * A file is third-party input: it may come from anywhere and is written into a stylesheet and into the rules file an
 * AI agent reads. So nothing passes through as it came. Each top-level field is known, each value has the type it
 * should, and only the fields the engine uses go on. The engine (ds-core) checks every colour and name again before
 * it writes anything.
 *
 * Same rule as ds-www's `parseRecipeFile` (lib/share.ts): versioned format, known fields only, a recipe without a
 * valid brand colour does not open.
 */
import type { BrandDef, RdsBrandTable } from "@rojaostudio/ds-core/generate";

/** A file that does not parse. The message is for the person at the terminal (pt-BR) and lists every problem. */
export class BrandFileError extends Error {}

/** The recipe format versions this CLI reads (ds.rojao.ai `toRecipeFile`). */
export const RECIPE_VERSIONS = ["1"] as const;
export const TABLE_SCHEMA = "rds-brand-table/1";

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
/** A palette ref: `teal-500`, `navy-900`. */
const PALETTE_REF = /^[a-z][a-z0-9]*-\d{2,3}$/i;
const PALETTE_NAME = /^[a-z][a-z0-9]*$/i;
const PALETTE_REFS = new Set([
  "neutral", "zinc", "cream", "coal", "red", "green", "blue", "teal", "amber", "purple", "orange",
  "cobalt", "brick", "moss", "clay", "flare", "ash", "ember", "navy",
]);

/** A hex as the engine reads it (#rrggbb): kept as given when it already is one, normalised otherwise. */
const asHex = (v: string) => (/^#[0-9a-f]{6}$/i.test(v) ? v : normalizeHex(v));

/** "7c3aed" · "#7C3AED" · "#abc" → "#7C3AED"; invalid → null. */
export function normalizeHex(v: string): string | null {
  const m = v.trim().match(HEX);
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return `#${h.toUpperCase()}`;
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const show = (v: unknown) => {
  const s = (typeof v === "string" ? v : JSON.stringify(v) ?? String(v)).replace(/[\r\n\t]+/g, " ");
  return JSON.stringify(s.length > 40 ? `${s.slice(0, 40)}…` : s);
};

/** Every field of BrandDef, plus `$version`. Anything else is refused: it is not a recipe of ds.rojao.ai. */
const RECIPE_FIELDS = new Set([
  "$version", "name", "description", "archetype", "scaleMode", "allowLiteral", "surfaceTint", "surfaceGradient",
  "darkenFill", "brand", "palettes", "type", "surface", "text", "fonts", "display", "radius", "surfacePattern", "card",
  "hero", "layout", "dark", "extras",
]);
/** Fields the CLI reads, with their type; the other known fields are checked for type and left out. */
const OTHER_TYPES: Record<string, "string" | "number" | "boolean" | "object" | "string|object"> = {
  archetype: "string", scaleMode: "string", allowLiteral: "boolean", surfaceTint: "number", surfaceGradient: "number",
  darkenFill: "boolean", type: "object", display: "object", radius: "string|object", surfacePattern: "string",
  card: "object", hero: "object", layout: "string", dark: "object", extras: "object",
};
const BRAND_COLORS = new Set([
  "primary", "hover", "onPrimary", "secondary", "onSecondary", "accent", "accentLight", "onAccent", "borderFocus",
  "heading", "invert",
]);
/** The brand colours the [RDS] theme reads. */
const BRAND_USED = ["secondary", "accent", "heading", "invert"] as const;

const typeOk = (v: unknown, t: string) =>
  t.split("|").some((one) => (one === "object" ? isObject(v) : typeof v === one));

/**
 * The recipe.json of ds.rojao.ai (`{ $version, ...BrandDef }`) → the BrandDef the engine reads. Throws a
 * BrandFileError listing every problem.
 */
export function parseRecipe(raw: unknown, slug: (v: string) => string): BrandDef {
  if (!isObject(raw)) throw new BrandFileError("recipe inválido: esperava um objeto JSON.");
  const problems: string[] = [];

  const unknown = Object.keys(raw).filter((k) => !RECIPE_FIELDS.has(k));
  if (unknown.length) problems.push(`campo desconhecido: ${unknown.map(show).join(", ")}`);

  if (raw.$version === undefined) problems.push(`falta $version (esperava ${RECIPE_VERSIONS.map((v) => `"${v}"`).join(" ou ")})`);
  else if (!(RECIPE_VERSIONS as readonly unknown[]).includes(raw.$version))
    problems.push(`$version ${show(raw.$version)} não é suportada (esperava ${RECIPE_VERSIONS.map((v) => `"${v}"`).join(" ou ")})`);

  if (raw.name !== undefined && typeof raw.name !== "string") problems.push("name: esperava texto");
  if (raw.description !== undefined && (typeof raw.description !== "string" || raw.description.length > 1000))
    problems.push("description: esperava texto de até 1000 caracteres");

  for (const [field, t] of Object.entries(OTHER_TYPES))
    if (raw[field] !== undefined && !typeOk(raw[field], t)) problems.push(`${field}: tipo inválido (esperava ${t.replace("|", " ou ")})`);

  for (const axis of ["surface", "text"] as const)
    if (raw[axis] !== undefined && !(typeof raw[axis] === "string" && PALETTE_REFS.has(raw[axis] as string)))
      problems.push(`${axis}: ${show(raw[axis])} não é uma paleta do Rojão DS`);

  let fonts: BrandDef["fonts"] = { body: "inter" };
  if (raw.fonts !== undefined) {
    if (!isObject(raw.fonts)) problems.push("fonts: esperava um objeto");
    else {
      const bad = Object.entries(raw.fonts).filter(
        ([k, v]) => !["body", "display", "editorial", "mono", "displayKind"].includes(k) || typeof v !== "string" || !/^[a-z0-9-]{1,40}$/i.test(v),
      );
      if (bad.length) problems.push(`fonts: ${bad.map(([k]) => show(k)).join(", ")} inválido (nome de fonte: letras, dígitos e hífen)`);
      else fonts = { body: "inter", ...(raw.fonts as Partial<BrandDef["fonts"]>) } as BrandDef["fonts"];
    }
  }

  const brand: BrandDef["brand"] = { primary: "" };
  if (!isObject(raw.brand)) problems.push("falta brand.primary (a cor da marca).");
  else {
    const extra = Object.keys(raw.brand).filter((k) => !BRAND_COLORS.has(k));
    if (extra.length) problems.push(`brand: campo desconhecido ${extra.map(show).join(", ")}`);
    const primary = typeof raw.brand.primary === "string" ? normalizeHex(raw.brand.primary) : null;
    if (!primary) problems.push(`falta brand.primary (a cor da marca) em hex, ex.: #7C3AED${raw.brand.primary ? ` — veio ${show(raw.brand.primary)}` : ""}.`);
    else brand.primary = primary;
    for (const [k, v] of Object.entries(raw.brand)) {
      if (k === "primary" || v === undefined) continue;
      const ok = typeof v === "string" && (normalizeHex(v) || PALETTE_REF.test(v));
      if (!ok) problems.push(`brand.${k}: ${show(v)} não é uma cor (hex ou paleta-passo, ex.: teal-500)`);
      else if ((BRAND_USED as readonly string[]).includes(k)) (brand as Record<string, string>)[k] = asHex(v as string) ?? (v as string);
    }
  }

  let palettes: BrandDef["palettes"];
  if (raw.palettes !== undefined) {
    if (!isObject(raw.palettes)) problems.push("palettes: esperava um objeto");
    else {
      palettes = {};
      for (const [name, value] of Object.entries(raw.palettes)) {
        if (!PALETTE_NAME.test(name)) problems.push(`palettes: nome ${show(name)} inválido (letras e dígitos)`);
        else if (typeof value === "string") {
          const hex = asHex(value);
          if (!hex) problems.push(`palettes.${name}: ${show(value)} não é hex`);
          else palettes[name] = hex;
        } else if (isObject(value)) {
          const bad = Object.entries(value).filter(([step, v]) => !/^(50|[1-9]00|950)$/.test(step) || typeof v !== "string" || !normalizeHex(v));
          if (bad.length) problems.push(`palettes.${name}: passo ${bad.map(([s]) => show(s)).join(", ")} inválido (50–900, valor hex)`);
          else palettes[name] = Object.fromEntries(Object.entries(value).map(([s, v]) => [s, asHex(v as string)!]));
        } else problems.push(`palettes.${name}: esperava hex ou escala 50–900`);
      }
    }
  }

  if (problems.length) throw new BrandFileError(`recipe inválido:\n  ${problems.join("\n  ")}`);

  const own = typeof raw.name === "string" ? slug(raw.name) : "";
  return {
    name: own || "marca",
    ...(typeof raw.description === "string" ? { description: raw.description } : {}),
    brand,
    ...(palettes ? { palettes } : {}),
    surface: (raw.surface as BrandDef["surface"]) ?? "zinc",
    text: (raw.text as BrandDef["text"]) ?? "zinc",
    fonts,
  };
}

const TABLE_FIELDS = new Set(["$schema", "name", "primitives", "modes", "vars"]);
const MODES = ["light", "dark", "brand"] as const;

const stringMap = (v: unknown, field: string, problems: string[]): v is Record<string, string> => {
  if (!isObject(v)) {
    problems.push(`${field}: esperava um objeto`);
    return false;
  }
  const bad = Object.entries(v).filter(([, x]) => typeof x !== "string");
  if (bad.length) problems.push(`${field}: ${bad.slice(0, 5).map(([k]) => show(k)).join(", ")} não é texto`);
  return bad.length === 0;
};

/** The brand table exported from Figma (`rds-brand-table/1`). Throws a BrandFileError listing every problem. */
export function parseTable(raw: unknown): RdsBrandTable {
  if (!isObject(raw) || !("modes" in raw) || !("primitives" in raw)) {
    throw new BrandFileError(
      `tabela inválida: esperava o formato ${TABLE_SCHEMA} (com $schema, modes e primitives), exportado por figma/export-brand.js.`,
    );
  }
  const problems: string[] = [];
  if (raw.$schema === undefined) problems.push(`falta $schema (esperava "${TABLE_SCHEMA}")`);
  else if (raw.$schema !== TABLE_SCHEMA) problems.push(`formato desconhecido: ${show(raw.$schema)} (esperava ${TABLE_SCHEMA})`);
  const unknown = Object.keys(raw).filter((k) => !TABLE_FIELDS.has(k));
  if (unknown.length) problems.push(`campo desconhecido: ${unknown.map(show).join(", ")}`);
  if (raw.name !== undefined && typeof raw.name !== "string") problems.push("name: esperava texto");
  stringMap(raw.primitives, "primitives", problems);
  if (!isObject(raw.modes)) problems.push("modes: esperava um objeto");
  else {
    const extra = Object.keys(raw.modes).filter((m) => !(MODES as readonly string[]).includes(m));
    if (extra.length) problems.push(`modes: modo desconhecido ${extra.map(show).join(", ")}`);
    for (const m of MODES) if (raw.modes[m] !== undefined) stringMap(raw.modes[m], `modes.${m}`, problems);
  }
  if (raw.vars !== undefined) stringMap(raw.vars, "vars", problems);
  if (problems.length) throw new BrandFileError(`tabela inválida:\n  ${problems.join("\n  ")}`);
  return raw as unknown as RdsBrandTable;
}
