/* global figma */
// Exports one brand of the [RDS] Base Tokens file as a brand table for rdsThemeFromTable().
// Run inside the Base Tokens file with the Figma Plugin API (a plugin console or an agent with use_figma),
// after setting BRAND to the mode name of the `base` collection. The return value is the JSON to save.
//
// Each theme role is followed through the aliases of the `base` collection (in the brand's mode) down to a
// primitive of the [RDS] Primitives library, kept by name ("accyan/400") with the colour Figma resolves.
const BRAND = "rojao";

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const base = cols.find((c) => c.name === "base");
const theme = cols.find((c) => c.name === "theme");
if (!base || !theme) throw new Error("open the [RDS] Base Tokens file");
const brandMode = base.modes.find((m) => m.name === BRAND);
if (!brandMode) throw new Error(`no brand "${BRAND}" in base: ${base.modes.map((m) => m.name).join(", ")}`);
const local = new Set(cols.map((c) => c.id));

const hex = (c) =>
  "#" +
  [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("") +
  (c.a !== undefined && c.a < 1 ? Math.round(c.a * 255).toString(16).padStart(2, "0") : "");
const literal = (v, val) => (v.resolvedType === "COLOR" ? hex(val) : String(val));
const isAlias = (val) => val && typeof val === "object" && val.type === "VARIABLE_ALIAS";

const primitives = {};
async function resolve(v, themeMode) {
  if (!local.has(v.variableCollectionId)) {
    // A Primitives library variable: keep its name, record what it resolves to.
    const val = Object.values(v.valuesByMode)[0];
    if (isAlias(val)) return resolve(await figma.variables.getVariableByIdAsync(val.id), themeMode);
    primitives[v.name] = literal(v, val);
    return v.name;
  }
  const modeId = v.variableCollectionId === base.id ? brandMode.modeId
    : v.variableCollectionId === theme.id ? themeMode : Object.keys(v.valuesByMode)[0];
  const val = v.valuesByMode[modeId] ?? Object.values(v.valuesByMode)[0];
  if (isAlias(val)) return resolve(await figma.variables.getVariableByIdAsync(val.id), themeMode);
  return literal(v, val);
}

const modes = {};
for (const m of theme.modes) {
  const roles = {};
  for (const id of theme.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    roles[v.name] = await resolve(v, m.modeId);
  }
  modes[m.name] = roles;
}
const sorted = Object.fromEntries(Object.entries(primitives).sort(([a], [b]) => a.localeCompare(b)));
return { $schema: "rds-brand-table/1", name: BRAND, primitives: sorted, modes };
