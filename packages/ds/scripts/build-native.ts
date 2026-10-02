/**
 * build-native.ts — emite o alvo React Native do DS a partir do gerador.
 *
 * recipes/index.ts (fonte única) → generateTheme → resolve (hex/rgba) → 3 artefatos:
 *   targets/native/theme.css   — vars --ds-* (:root light / .dark) pro NativeWind
 *   targets/native/preset.js   — preset NativeWind (colors → var(--ds-*))
 *   targets/native/theme.ts    — mapas resolvidos light/dark (uso em runtime/ThemeProvider)
 *
 * Rodar: pnpm build:native. NÃO editar os artefatos à mão.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, resolve as resolvePath } from 'node:path';

import { generateTheme } from '@rojaostudio/ds-core/generate';
import * as recipes from '@rojaostudio/ds-core/recipes';
import { primitives } from '@rojaostudio/ds-core/tokens';
import { flattenPrimitives, resolveTokenMap } from '../targets/native/resolve';

const root = resolvePath(dirname(fileURLToPath(import.meta.url)), '..');
const brandArg = process.argv.find((a) => a.startsWith('--brand='))?.split('=')[1];
const nativeDir = brandArg
  ? resolvePath(root, 'brands-out', 'native', brandArg)
  : resolvePath(root, 'targets/native');
mkdirSync(nativeDir, { recursive: true });

// O alvo nativo era gerado da receita de UMA MARCA e exportava um símbolo com o nome dela —
// ou seja, todo app RN que instalasse o pacote recebia as cores dela, sem prop de
// override no DSThemeProvider. Marca de cliente num pacote publico, e alvo nativo sem
// tema. Agora a base e a receita PUBLICA (rojao) e a marca entra por prop. Ver #101.
// `--brand=<nome>` gera a ENTREGA nativa de uma marca em brands-out/native/, sem tocar no
// alvo publicado. E como o um app nativo recupera o mapa completo que perdeu quando o alvo
// deixou de ser cravado nele: ele passa o mapa em <DSThemeProvider theme={...}>. Ver #101.
const argBrand = process.argv.find((a) => a.startsWith('--brand='))?.split('=')[1];
let fonte: Record<string, unknown> = recipes as Record<string, unknown>;
if (argBrand) {
  // require e não import: o esbuild do tsx compila para CJS e recusa top-level await. E
  // dinâmico porque o arquivo é privado e NÃO existe no repositório público — um import
  // estático quebraria o build lá.
  const req = createRequire(import.meta.url);
  fonte = req('../private/brands').brands as Record<string, unknown>;
}
const nome = argBrand ?? 'rojao';
const marca = fonte[nome] as Parameters<typeof generateTheme>[0];
if (!marca) throw new Error(`recipe "${nome}" não encontrada`);

const gen = generateTheme(marca);
if (!gen.supported) throw new Error(`generateTheme(${nome}) não suportado: ${gen.note}`);

// Paletas custom da recipe (coal/flare/zinc…) saíram do core → entram nos
// primitivos a partir do que o motor já emitiu (--color-*), pra resolver
// var(--color-coal-900) quando o token de marca aponta pra elas.
const customPrims: Record<string, string> = {};
for (const [k, v] of Object.entries(gen.light)) if (k.startsWith('--color-')) customPrims[k.slice(8)] = v;
const prims = { ...flattenPrimitives(primitives.color as Record<string, unknown>), ...customPrims };

// Universais de feedback da base.css (canônicos). Preenchem o que o recipe não
// define em um modo — ex.: um produto consumidor só traz --warning no dark. Sem isso, o tema RN
// emite o token só no dark e o componente lê `undefined` no light. Fix #13/#2.
const BASE_FEEDBACK_LIGHT: Record<string, string> = {
  '--danger': '#f44336', '--danger-soft': '#ffcdd2', '--danger-border': '#ef9a9a', '--danger-text': '#991b1b',
  '--success': '#4caf50', '--success-soft': '#c8e6c9', '--success-border': '#a5d6a7', '--success-text': '#1b5e20',
  '--warning': '#ffc107', '--warning-soft': '#ffecb3', '--warning-border': '#ffe082', '--warning-text': '#92400e',
  '--info': '#2196f3', '--info-soft': '#bbdefb', '--info-border': '#90caf9', '--info-text': '#1e40af',
};
const BASE_FEEDBACK_DARK: Record<string, string> = {
  '--danger': '#f44336', '--danger-soft': 'rgba(244, 67, 54, 0.2)', '--danger-border': 'rgba(244, 67, 54, 0.4)', '--danger-text': '#ef9a9a',
  '--success': '#4caf50', '--success-soft': 'rgba(76, 175, 80, 0.2)', '--success-border': 'rgba(76, 175, 80, 0.4)', '--success-text': '#a5d6a7',
  '--warning': '#ffc107', '--warning-soft': 'rgba(255, 193, 7, 0.2)', '--warning-border': 'rgba(255, 193, 7, 0.4)', '--warning-text': '#ffe082',
  '--info': '#2196f3', '--info-soft': 'rgba(33, 150, 243, 0.2)', '--info-border': 'rgba(33, 150, 243, 0.4)', '--info-text': '#90caf9',
};

const lightRaw = resolveTokenMap(gen.light, prims);
const darkRaw = { ...lightRaw, ...resolveTokenMap(gen.dark, prims) };
// recipe vence; a base só preenche o que falta no modo.
const light = { ...BASE_FEEDBACK_LIGHT, ...lightRaw };
const darkFull = { ...BASE_FEEDBACK_DARK, ...darkRaw };
const allKeys = Array.from(new Set([...Object.keys(light), ...Object.keys(darkFull)])).sort();

// nome da var RN: '--surface-page' → '--ds-surface-page'
const dsVar = (token: string) => `--ds-${token.replace(/^--/, '')}`;

// ---- theme.css (vars light/dark) ----
function cssBlock(selector: string, pick: (k: string) => string): string {
  const lines = allKeys.map((k) => `  ${dsVar(k)}: ${pick(k)};`).join('\n');
  return `${selector} {\n${lines}\n}`;
}
const themeCss = [
  '/* AUTO-GERADO por scripts/build-native.ts — não editar à mão. */',
  `/* Tema ${nome} resolvido (hex/rgba) para React Native via NativeWind. */`,
  cssBlock(':root', (k) => light[k] ?? darkFull[k]),
  cssBlock('.dark', (k) => darkFull[k]),
  '',
].join('\n\n');
writeFileSync(resolvePath(nativeDir, 'theme.css'), themeCss);

// ---- preset.js (colors curados → var(--ds-*)) ----
const GROUPS: Record<string, Record<string, string>> = {
  surface: { DEFAULT: 'surface-default', page: 'surface-page', raised: 'surface-raised', overlay: 'surface-overlay', invert: 'surface-invert' },
  fg: { DEFAULT: 'text-primary', secondary: 'text-secondary', muted: 'text-muted', disabled: 'text-disabled', inverse: 'text-inverse', placeholder: 'text-placeholder' },
  icon: { DEFAULT: 'icon-default' },
  line: { DEFAULT: 'border-default', subtle: 'border-subtle', strong: 'border-strong', focus: 'border-focus' },
  brand: { DEFAULT: 'brand-primary', hover: 'brand-hover', secondary: 'brand-secondary', accent: 'brand-accent', 'accent-light': 'brand-accent-light', 'on-primary': 'brand-on-primary', 'on-secondary': 'brand-on-secondary', 'on-accent': 'brand-on-accent' },
  danger: { DEFAULT: 'danger', soft: 'danger-soft', border: 'danger-border', text: 'danger-text' },
  success: { DEFAULT: 'success', soft: 'success-soft', border: 'success-border', text: 'success-text' },
  warning: { DEFAULT: 'warning', soft: 'warning-soft', border: 'warning-border', text: 'warning-text' },
  info: { DEFAULT: 'info', soft: 'info-soft', border: 'info-border', text: 'info-text' },
  neutral: { DEFAULT: 'neutral', soft: 'neutral-soft', border: 'neutral-border', text: 'neutral-text' },
};

const present = new Set(allKeys.map((k) => k.replace(/^--/, '')));
const colors: Record<string, Record<string, string>> = {};
for (const [group, entries] of Object.entries(GROUPS)) {
  const out: Record<string, string> = {};
  for (const [name, token] of Object.entries(entries)) {
    if (present.has(token)) out[name] = `var(${dsVar('--' + token)})`;
  }
  if (Object.keys(out).length) colors[group] = out;
}

const presetJs = [
  '// AUTO-GERADO por scripts/build-native.ts — não editar à mão.',
  '// Preset NativeWind do tema padrão do DS. As cores apontam pras vars de theme.css.',
  '// Uso no app: presets: [require("nativewind/preset"), require("@rojaostudio/ds/native/preset")]',
  `module.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(colors, null, 8).replace(/\n/g, '\n      ')},\n    },\n  },\n};`,
  '',
].join('\n');
writeFileSync(resolvePath(nativeDir, 'preset.js'), presetJs);

// ---- theme.ts (mapas resolvidos) ----
const themeTs = [
  '// AUTO-GERADO por scripts/build-native.ts — não editar à mão.',
  '// Mapas resolvidos do tema PADRÃO do DS (chave = nome do token semântico).',
  '// Marca própria: passe seu mapa em <DSThemeProvider theme={...}>. Ver #101.',
  `export const ${brandArg ? 'brandTheme' : 'dsTheme'} = {\n  light: ${JSON.stringify(light, null, 4).replace(/\n/g, '\n  ')},\n  dark: ${JSON.stringify(darkFull, null, 4).replace(/\n/g, '\n  ')},\n} as const;`,
  '',
  'export type ThemeMap = Record<string, string>;',
  '',
].join('\n');
writeFileSync(resolvePath(nativeDir, 'theme.ts'), themeTs);

// ---- index.ts (entry: primitives + dsTheme) ----
// Só o alvo publicado tem entry; a entrega de marca é só o mapa + preset + css.
const indexTs = brandArg ? null : [
  '/* Alvo React Native do DS. AUTO-GERADO por scripts/build-native.ts.',
  ' *',
  ' * - primitives: paletas cruas (hex). Fonte: tokens/index.ts.',
  ' * - dsTheme: tema padrão do DS resolvido (light/dark). Marca própria entra por prop.',
  ' *',
  ' * NativeWind (app):',
  " *   presets: [require('nativewind/preset'), require('@rojaostudio/ds/native/preset')]",
  " *   @import '@rojaostudio/ds/native/theme.css';   // vars --ds-* (:root / .dark)",
  ' */',
  '',
  // Sem extensão .js: o pacote publica só TS-fonte; o bundler do consumidor
  // (Metro/Next) resolve tokens/index.ts e theme.ts e transpila — igual ao resto
  // da cadeia native. Um '.js' físico não existe → quebrava em Metro/Node (#45).
  "export { primitives } from '@rojaostudio/ds-core/tokens';",
  "export { dsTheme, type ThemeMap } from './theme';",
  // fonts.ts é escrito à mão (famílias display); reexportado aqui pro app
  // descobrir os nomes a registrar via expo-font.
  "export { fonts, type DsFonts } from './fonts';",
  '',
].join('\n');
if (indexTs) writeFileSync(resolvePath(nativeDir, 'index.ts'), indexTs);

console.log(`build:native${brandArg ? ` (${brandArg})` : ''} ok — ${allKeys.length} tokens · light+dark · preset (${Object.keys(colors).length} grupos)`);
