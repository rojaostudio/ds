/**
 * emitClaudeMd.ts — recipe (BrandDef) → arquivo de regras (CLAUDE.md / .cursorrules /
 * AGENTS.md) que ensina a IA (Claude Code, Cursor) a construir com a marca.
 *
 * É O PRODUTO (DS-5). Achado do spike DS-0: cor sozinha não basta — o arquivo carrega
 * cor (semântica, light+dark) + spacing + type scale + radius + do/don't + receita
 * shadcn. Cor resolvida em hex pra IA "ver" a marca; spacing/type vêm dos primitivos.
 *
 * Função pura (sem I/O). Formato derivado de _spike-ds-claudemd/CLAUDE.md (validado).
 */
import { generateTheme, type TokenMap } from "./generateTheme";
import { isNeutralBrand } from "./scale";
import { primitives } from "../tokens/index";
import type { BrandDef } from "../tokens/recipe.schema";

export type ClaudeMdTarget = "claude" | "cursor" | "agents";

export interface ClaudeMdOptions {
  /** URL de um CSS de tema hospedado, se houver. Sem default: o padrão é arquivo local. */
  cssUrl?: string;
}

// var(--color-neutral-900) → #171717 ; color-mix(...) → descrição legível
function resolveColor(v: string): string {
  if (!v) return v;
  // color-mix primeiro — senão o regex de var() casa o token interno e perde a opacidade
  if (v.startsWith("color-mix")) {
    const mix = v.match(/var\(--color-([a-zA-Z]+)(?:-(\d+))?\)\s+(\d+)%/);
    return mix ? `${mix[1]}${mix[2] ? "-" + mix[2] : ""} a ${mix[3]}%` : v;
  }
  const scale = v.match(/var\(--color-([a-zA-Z]+)-(\d+)\)/);
  if (scale) {
    const pal = (primitives.color as unknown as Record<string, Record<string, string>>)[scale[1]];
    return pal?.[scale[2]] ?? v;
  }
  const flat = v.match(/var\(--color-(white|black)\)/);
  if (flat) return (primitives.color as unknown as Record<string, string>)[flat[1]] ?? v;
  return v;
}

// tokens semânticos principais, com a intenção de uso (o "use for" do spike)
const TOKEN_DOCS: { key: string; use: string }[] = [
  { key: "--brand-primary", use: "botão primário, fills de marca" },
  { key: "--brand-on-primary", use: "texto/ícone sobre o primário" },
  { key: "--brand-hover", use: "hover do primário" },
  { key: "--brand-secondary", use: "2ª cor de marca — SÓ como fill (com --brand-on-secondary); nunca borda/texto sobre superfície" },
  { key: "--brand-on-secondary", use: "texto sobre o fill secundário" },
  { key: "--brand-accent", use: "destaque, links, sucesso (use com parcimônia)" },
  { key: "--brand-accent-light", use: "fundo tingido do accent" },
  { key: "--brand-on-accent", use: "texto sobre o accent" },
  { key: "--surface-page", use: "fundo da página" },
  { key: "--surface-default", use: "cards, painéis" },
  { key: "--surface-raised", use: "superfície elevada/hover" },
  { key: "--border-subtle", use: "divisórias fracas" },
  { key: "--border-default", use: "bordas de inputs e cards" },
  { key: "--border-strong", use: "bordas enfatizadas" },
  { key: "--border-focus", use: "anel de foco" },
  { key: "--text-primary", use: "títulos, corpo" },
  { key: "--text-secondary", use: "texto de apoio" },
  { key: "--text-muted", use: "legendas, metadados" },
  { key: "--text-inverse", use: "texto sobre superfícies invertidas" },
  { key: "--icon-default", use: "cor padrão de ícone" },
];

function tokenTable(light: TokenMap, dark: TokenMap): string {
  const rows = TOKEN_DOCS.filter((t) => t.key in light).map((t) => {
    const l = resolveColor(light[t.key]);
    const d = t.key in dark ? resolveColor(dark[t.key]) : "—";
    return `| \`${t.key}\` | ${t.use} | \`${l}\` | \`${d}\` |`;
  });
  return [
    "| Token | Use para | Light | Dark |",
    "|---|---|---|---|",
    ...rows,
  ].join("\n");
}

function scaleLine(obj: Record<string, number>, unit = "px"): string {
  return Object.entries(obj)
    .map(([k, v]) => `\`${k}\`=${v}${v === 9999 ? "" : unit}`)
    .join(" · ");
}

function fileLabel(target: ClaudeMdTarget): string {
  return target === "cursor" ? ".cursorrules" : target === "agents" ? "AGENTS.md" : "CLAUDE.md";
}

export function emitClaudeMd(def: BrandDef, opts: ClaudeMdOptions = {}): string {
  const { supported, light, dark, note } = generateTheme(def);
  if (!supported) throw new Error(`emitClaudeMd: ${def.name} não suportado — ${note}`);

  const Name = def.name[0].toUpperCase() + def.name.slice(1);
  // Sem `cssUrl`, o tema é um ARQUIVO do consumidor — o `theme.css` que ele baixou junto deste
  // arquivo. O default apontava pra um serving ao vivo por conta, que não existe mais;
  // ele foi pro studio (#70) e a rota responde 404, então todo CLAUDE.md gerado saía mandando o
  // leitor linkar uma URL morta. Quem TEM serving próprio continua passando `cssUrl` e recebe o
  // bloco de link ao vivo.
  const cssUrl = opts.cssUrl ?? null;
  const bodyFont = typeof def.fonts?.body === "string" ? def.fonts.body : "inter";
  const displayFont =
    typeof def.fonts?.display === "string" ? def.fonts.display : bodyFont;
  const fontTitle = (s: string) => s.split("-").map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");

  const neutral = primitives.color.neutral;

  return `# Design System — ${Name} (brand: \`${def.name}\`)

> This project uses the **${Name}** design system. When you build any UI —
> components, pages, screens — follow the rules below so every screen looks like the
> same product. Do not invent colors, fonts, spacing, or radii.

## Brand identity
- **Name:** ${Name}
- **Look:** ${isNeutralBrand(def) ? "neutral — black & white lead, the accent does the talking" : "chromatic — the brand color leads"}${def.description ? ` — ${def.description}` : ""}
- **Body font:** ${fontTitle(bodyFont)} · **Display font:** ${fontTitle(displayFont)} (load from Google Fonts; never substitute)
- **Default radius:** \`${primitives.radius.md}px\` (\`rounded-lg\`). Pills/avatars fully round.
- **Light AND dark are first-class** — every screen must work in both.

## How to apply
1. ${cssUrl
    ? `Import the brand stylesheet once at the app root:
   \`\`\`html
   <link rel="stylesheet" href="${cssUrl}" />
   \`\`\``
    : `Put \`${def.name}.css\` (downloaded with this file) in your project and import it
   once at the app root:
   \`\`\`css
   @import "./${def.name}.css";
   \`\`\`
   The theme is a file **you own** — commit it. Nothing here depends on an external host.`}
2. Put the theme class on \`<html>\`:
   \`\`\`html
   <html class="theme-${def.name}">       <!-- light -->
   <html class="theme-${def.name} dark">  <!-- dark -->
   \`\`\`
   > One sheet can hold **several themes** — each as its own \`theme-<name>\` class.
   > Switch with the class (one product per app, or many on one page).${cssUrl
    ? `
   > Edit the theme at the source and this same URL updates **all your apps at once**.`
    : ''}
3. Style everything with the semantic tokens below, as CSS variables — they already
   flip between light and dark. You never write a hex value in a component.
   \`\`\`css
   .card { background: var(--surface-default); color: var(--text-primary);
           border: 1px solid var(--border-default); border-radius: ${primitives.radius.md}px; }
   \`\`\`

## Semantic color tokens — ALWAYS use these, NEVER hardcode a color
${tokenTable(light, dark)}

## Spacing scale (px) — use ONLY these steps for padding, margin, gap
${scaleLine(primitives.space)}

## Type scale (font-size, px)
${scaleLine(primitives.fontSize)}

**Font weights:** ${scaleLine(primitives.fontWeight, "")}
**Line heights:** ${Object.entries(primitives.lineHeight).map(([k, v]) => `\`${k}\`=${v}`).join(" · ")}

## Radius (px)
${scaleLine(primitives.radius)}

## Rules (do / don't)
- ✅ Primary button = \`--brand-primary\` bg + \`--brand-on-primary\` text; hover → \`--brand-hover\`.
- ✅ Low-emphasis / secondary action = NEUTRAL outline: \`--border-default\` border + \`--text-secondary\` text (legible by rule, light AND dark). A brand color belongs to the PRIMARY (filled) action, not a secondary outline.
- ✅ Page wrapper uses \`--surface-page\`; cards use \`--surface-default\`.
- ✅ Body text is \`--text-primary\`; never pure black/white text directly.
- ✅ \`--brand-accent\` is the ONLY saturated color — use it sparingly (links, success, highlights).
- ✅ Spacing, font-size and radius come ONLY from the scales above.
- ❌ Never write a raw hex (\`#000\`, \`bg-black\`) or a Tailwind palette color (\`bg-emerald-500\`, \`text-zinc-700\`) in a component — map it to a token above.
- ❌ Never use a brand color (incl. \`--brand-secondary\`) as a border/ring or as text directly on a surface. The engine guarantees contrast ONLY for a fill + its \`--brand-on-*\` text. As a stroke (WCAG 1.4.11, 3:1) or label (1.4.3, 4.5:1) on the surface it can fail — and in one mode but not the other. Brand colors = fills.
- ❌ Never introduce a second accent color. Don't hardcode dark-mode colors — tokens already flip.

## Use with shadcn/ui
You are NOT replacing shadcn. Use shadcn/ui components and apply THIS brand as the theme:
map the tokens above onto shadcn's CSS variables (\`--background\` → \`--surface-page\`,
\`--foreground\` → \`--text-primary\`, \`--primary\` → \`--brand-primary\`, \`--border\` →
\`--border-default\`, \`--ring\` → \`--border-focus\`, \`--radius\` → \`${primitives.radius.md}px\`).
Build with shadcn's component shapes; paint them with these tokens. Don't restyle components from scratch.

## Primitive palette (reference — prefer the semantic tokens above)
\`\`\`
neutral 50 ${neutral[50]} · 500 ${neutral[500]} · 900 ${neutral[900]}
\`\`\`

<!-- Generated by Rojão DS — file: ${fileLabel("claude")} / ${fileLabel("cursor")} / ${fileLabel("agents")}. Drop it in your project root; Claude Code & Cursor read it automatically. -->
`;
}
