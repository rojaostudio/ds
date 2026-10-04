/* global figma */
// Extracts the [RDS] tokens from Figma into the .txt files the build reads (scripts/rds-tokens.ts).
// Run it with the Figma Plugin API (a plugin console, or an agent with use_figma), read-only:
//
//   - in the Components file (w64JuUL45DO4jGu3WEy9HU): one file per local collection,
//     packages/ds/tokens/figma/<collection>.txt (Actions → actions.txt…)
//   - in the Base Tokens file (1Xn5IkLiq5Yhas680rJQf6): packages/ds-core/figma/theme.txt and
//     packages/ds-core/figma/foundation.txt
//
// The file is told apart by its collections (a local `theme` collection means Base Tokens). The return
// value is { "<path from the repo root>": "<content>" }: save each entry as is. Set ONLY to a list of
// collection names to extract part of the Components file (a return value is capped in size).
// Client brands never leave Figma here: foundation.txt is resolved in the house mode (FOUNDATION_MODE)
// and theme.txt keeps aliases, never colours. A brand table is exported by ds-core/figma/export-brand.js.
const ONLY = null; // e.g. ["Forms", "Actions"]
const FOUNDATION_MODE = "rojao";
const FILES = { components: "w64JuUL45DO4jGu3WEy9HU", base: "1Xn5IkLiq5Yhas680rJQf6" };
const DO_NOT_EDIT = "# DO NOT EDIT. Figma is the source: publish in Figma, run the extraction, save the output here.";

const today = new Date().toISOString().slice(0, 10);
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const byId = new Map(cols.map((c) => [c.id, c]));

const TYPE = { COLOR: "C", FLOAT: "F", STRING: "S", BOOLEAN: "B" };
const hex = (c) =>
  "#" +
  [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("") +
  (c.a !== undefined && c.a < 1 ? Math.round(c.a * 255).toString(16).padStart(2, "0") : "");
const num = (n) => String(Number(n.toFixed(4)));
const isAlias = (val) => val && typeof val === "object" && val.type === "VARIABLE_ALIAS";
const pathVar = (name) => `--${name.replaceAll("/", "-")}`;

function literal(v, val) {
  if (v.resolvedType === "COLOR") return hex(val);
  if (v.resolvedType === "FLOAT") return num(val);
  return String(val);
}

const collectionNames = new Map();
async function collectionName(v) {
  if (!collectionNames.has(v.variableCollectionId)) {
    const c = byId.get(v.variableCollectionId) ?? (await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId));
    collectionNames.set(v.variableCollectionId, c ? c.name : "?");
  }
  return collectionNames.get(v.variableCollectionId);
}

/**
 * A value as the .txt writes it: `@<collection>:<name>` for an alias, the literal otherwise. An alias into
 * `viewport` (the screen modes: media queries, not custom properties) is written as its value when that is
 * the same in every mode (layout/form/max-width…); one that varies by mode has no single CSS value and fails.
 */
async function cell(v, val) {
  if (!isAlias(val)) return literal(v, val);
  const target = await figma.variables.getVariableByIdAsync(val.id);
  if (!target) throw new Error(`${v.name}: alias to a variable that cannot be read (${val.id})`);
  const collection = await collectionName(target);
  if (collection === "viewport") {
    const values = [...new Set(Object.values(target.valuesByMode).map((x) => JSON.stringify(x)))];
    if (values.length !== 1 || isAlias(JSON.parse(values[0])))
      throw new Error(`${v.name}: alias to viewport ${target.name}, which varies by mode`);
    return literal(v, JSON.parse(values[0]));
  }
  return `@${collection}:${target.name}`;
}

const vars = async (c) => {
  const out = [];
  for (const id of c.variableIds) out.push(await figma.variables.getVariableByIdAsync(id));
  return out;
};

const files = {};

if (!cols.some((c) => c.name === "theme")) {
  // ── Components file: one .txt per collection ──────────────────────────────────────────────
  for (const c of cols) {
    if (ONLY && !ONLY.includes(c.name)) continue;
    const lines = [
      `# [RDS] Components · collection ${c.name} · file ${FILES.components} · extracted ${today}`,
      DO_NOT_EDIT,
      '# Format: name|type (C colour, F number, S string, B boolean)|@collection:target (alias) OR raw value|WEB codeSyntax ("=" when it is the path with hyphens)[|obsolete]',
      "# obsolete: the Figma description starts with \"Obsoleto\"; the token stays for old code and no stylesheet has to read it.",
    ];
    const mode = c.defaultModeId;
    for (const v of await vars(c)) {
      const web = v.codeSyntax.WEB ?? "";
      // `var(--path)` is the same custom property as `--path`: both are the path rule.
      const cs = web === pathVar(v.name) || web === `var(${pathVar(v.name)})` ? "=" : web;
      const obsolete = /^obsolet/i.test(v.description.trim()) ? "|obsolete" : "";
      lines.push(`${v.name}|${TYPE[v.resolvedType]}|${await cell(v, v.valuesByMode[mode])}|${cs}${obsolete}`);
    }
    files[`packages/ds/tokens/figma/${c.name.toLowerCase()}.txt`] = lines.join("\n") + "\n";
  }
} else {
  // ── Base Tokens file: theme.txt (the roles, aliases per mode) ─────────────────────────────
  const theme = cols.find((c) => c.name === "theme");
  const themeLines = [
    `# [RDS] Base Tokens · collection theme · file ${FILES.base} · extracted ${today}`,
    DO_NOT_EDIT,
    `# Modes: ${theme.modes.map((m) => m.name).join("|")}. Each role points to a token of the base collection (drawn per brand).`,
    "# Format: name|type (C colour, F number, S string, B boolean)|WEB codeSyntax|" + theme.modes.map((m) => m.name).join("|"),
  ];
  for (const v of await vars(theme)) {
    const values = [];
    for (const m of theme.modes) values.push(await cell(v, v.valuesByMode[m.modeId]));
    themeLines.push(`${v.name}|${TYPE[v.resolvedType]}|${v.codeSyntax.WEB ?? ""}|${values.join("|")}`);
  }
  files["packages/ds-core/figma/theme.txt"] = themeLines.join("\n") + "\n";

  // ── foundation.txt (the non-colour tokens, flattened, in a fixed order) ───────────────────
  // Taken: the non-colour variables of base, scale, motion and layer that carry a WEB codeSyntax,
  // and the drop-shadow effect styles (elevation/*). Left out: email/* (the e-mail templates read them
  // from Figma), breakpoint and viewport (media queries, not custom properties), the colours (theme.txt).
  const base = cols.find((c) => c.name === "base");
  const baseMode = base.modes.find((m) => m.name === FOUNDATION_MODE);
  if (!baseMode) throw new Error(`no mode "${FOUNDATION_MODE}" in base`);
  const GROUPS = ["radius", "border-width", "focus", "type", "space", "size", "blur", "motion", "z", "elevation"];
  const TYPE_ROLES = ["font", "heading", "lead", "body", "label", "button", "small", "caption", "footer", "value", "band"];
  const TYPE_PROPS = ["family", "stack", "size", "line", "weight"];
  const group = (name) => GROUPS.indexOf(name.split("/")[0].replace(/-strong$/, ""));
  const rank = (name) => {
    const p = name.split("/");
    if (p[0] === "type") return TYPE_ROLES.indexOf(p[1]) * 10 + TYPE_PROPS.indexOf(p[2]);
    if (p[0] === "space" || p[0] === "size") return Number(p[1]);
    return 0; // Figma order
  };
  const rows = [];
  for (const name of ["base", "scale", "motion", "layer"]) {
    const c = cols.find((x) => x.name === name);
    const mode = c === base ? baseMode.modeId : c.defaultModeId;
    for (const v of await vars(c)) {
      if (v.resolvedType === "COLOR" || !v.codeSyntax.WEB || v.name.startsWith("email/")) continue;
      let val = v.valuesByMode[mode];
      // Follow aliases down to the value: foundation.txt holds values, not references.
      let t = v;
      while (isAlias(val)) {
        t = await figma.variables.getVariableByIdAsync(val.id);
        const tm = t.variableCollectionId === base.id ? baseMode.modeId : Object.keys(t.valuesByMode)[0];
        val = t.valuesByMode[tm] ?? Object.values(t.valuesByMode)[0];
      }
      rows.push({ name: v.name, line: `${v.name}|${TYPE[v.resolvedType]}|${literal(v, val)}|${v.codeSyntax.WEB}` });
    }
  }
  for (const s of await figma.getLocalEffectStylesAsync()) {
    const shadows = s.effects.filter((e) => e.type === "DROP_SHADOW" && e.visible !== false);
    if (!shadows.length) continue;
    const parts = [];
    for (const e of shadows) {
      const bound = e.boundVariables && e.boundVariables.color;
      const colour = bound
        ? await (async () => {
            const t = await figma.variables.getVariableByIdAsync(bound.id);
            return `@${await collectionName(t)}:${t.name}`;
          })()
        : hex({ ...e.color });
      parts.push(`${num(e.offset.x)} ${num(e.offset.y)} ${num(e.radius)} ${num(e.spread ?? 0)} ${colour}`);
    }
    rows.push({ name: s.name, line: `${s.name}|E|${parts.join("; ")}|${pathVar(s.name)}` });
  }
  rows.forEach((r, i) => (r.i = i));
  rows.sort((a, b) => group(a.name) - group(b.name) || rank(a.name) - rank(b.name) || a.i - b.i);
  const unknown = rows.filter((r) => group(r.name) < 0).map((r) => r.name);
  if (unknown.length) throw new Error(`foundation: no group for ${unknown.join(", ")} (add it to GROUPS)`);
  files["packages/ds-core/figma/foundation.txt"] = [
    `# [RDS] Base Tokens · non-colour tokens (base, scale, breakpoint, motion, layer, effect styles) · file ${FILES.base} · extracted ${today}`,
    DO_NOT_EDIT,
    `# base tokens are resolved in the ${FOUNDATION_MODE} mode; they do not vary with the brand colour.`,
    "# Format: name|type (F number in px or ms, S string, E effect)|value|WEB codeSyntax",
    ...rows.map((r) => r.line),
  ].join("\n") + "\n";
}

return files;
