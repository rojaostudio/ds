/**
 * build-tokens.ts — generates platform targets from tokens/index.ts.
 *
 * tokens/index.ts is the single source of truth. Run `pnpm build:tokens`
 * (also runs automatically via prepack) to regenerate:
 *
 *   styles/_primitives.generated.css   — CSS vars for web/Tailwind
 *   targets/native/index.ts            — typed re-export for Expo/RN
 *
 * Future targets (when needed): targets/ios/Tokens.swift,
 * targets/android/Tokens.kt, targets/figma/tokens.json. Each is one more
 * writer in this script — components don't change.
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { primitives } from '@rojaostudio/ds-core/tokens';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

/** Converte px (número) para rem string com até 4 casas significativas. */
function toRem(px: number): string {
  return `${parseFloat((px / 16).toFixed(4))}rem`;
}

const banner = `/* AUTO-GENERATED — do not edit by hand.
 * Source of truth: tokens/index.ts
 * Regenerate: pnpm build:tokens
 */`;

// ── 1. styles/_primitives.generated.css ────────────────────────────────────────

function buildPrimitivesCSS(): string {
  const lines: string[] = [];

  // Color palettes
  lines.push('  /* ── Color palettes ── */');
  for (const [paletteName, palette] of Object.entries(primitives.color)) {
    if (typeof palette === 'string') {
      lines.push(`  --color-${paletteName}: ${palette};`);
      continue;
    }
    for (const [step, hex] of Object.entries(palette)) {
      lines.push(`  --color-${paletteName}-${step}: ${hex};`);
    }
  }

  // Space — rem para escalar com font-size do browser
  lines.push('');
  lines.push('  /* ── Space ── */');
  for (const [k, v] of Object.entries(primitives.space)) {
    lines.push(`  --space-${k}: ${toRem(v)};`);
  }

  // Radius — rem (full=9999px permanece px: é valor simbólico, não escala)
  lines.push('');
  lines.push('  /* ── Radius ── */');
  for (const [k, v] of Object.entries(primitives.radius)) {
    const value = v === 9999 ? '9999px' : toRem(v);
    lines.push(`  --radius-${k}: ${value};`);
  }

  // Motion — ms (timing não é unidade de fonte)
  lines.push('');
  lines.push('  /* ── Motion ── */');
  for (const [k, v] of Object.entries(primitives.motion)) {
    lines.push(`  --motion-${k}: ${v}ms;`);
  }

  // Font size — rem para respeitar preferência do usuário (WCAG 1.4.4)
  lines.push('');
  lines.push('  /* ── Font size ── */');
  for (const [k, v] of Object.entries(primitives.fontSize)) {
    lines.push(`  --font-size-${k}: ${toRem(v)};`);
  }

  // Font weight — unitless (sem mudança)
  lines.push('');
  lines.push('  /* ── Font weight ── */');
  for (const [k, v] of Object.entries(primitives.fontWeight)) {
    lines.push(`  --font-weight-${k}: ${v};`);
  }

  // Line height — unitless (proporcional ao font-size do elemento)
  lines.push('');
  lines.push('  /* ── Line height ── */');
  for (const [k, v] of Object.entries(primitives.lineHeight)) {
    lines.push(`  --line-height-${k}: ${v};`);
  }

  // Letter spacing — px (valores muito pequenos; em seria mais correto mas é mudança separada)
  lines.push('');
  lines.push('  /* ── Letter spacing ── */');
  for (const [k, v] of Object.entries(primitives.letterSpacing)) {
    lines.push(`  --letter-spacing-${k}: ${v}px;`);
  }

  // Control scale — rem para proporcionalidade quando usuário ajusta font-size
  lines.push('');
  lines.push('  /* ── Control scale ── */');
  for (const [k, v] of Object.entries(primitives.controlHeight)) {
    lines.push(`  --control-height-${k}: ${toRem(v)};`);
  }
  for (const [k, v] of Object.entries(primitives.controlPaddingX)) {
    lines.push(`  --control-padding-x-${k}: ${toRem(v)};`);
  }
  for (const [k, v] of Object.entries(primitives.controlPaddingY)) {
    lines.push(`  --control-padding-y-${k}: ${toRem(v)};`);
  }
  for (const [k, v] of Object.entries(primitives.controlGap)) {
    lines.push(`  --control-gap-${k}: ${toRem(v)};`);
  }

  // Misc — icon em rem; border-width mantém px (1px é 1px sempre)
  lines.push('');
  lines.push('  /* ── Misc ── */');
  lines.push(`  --icon-size: ${toRem(primitives.icon.size)};`);
  lines.push(`  --border-width-default: ${primitives.borderWidth.default}px;`);

  return lines.join('\n');
}

const cssContent = `${banner}

:root {
${buildPrimitivesCSS()}
}
`;

writeFileSync(resolve(root, 'styles/_primitives.generated.css'), cssContent);
console.log('✓ styles/_primitives.generated.css');

// targets/native/* (index.ts, theme.ts, theme.css, preset.js) é gerado por
// scripts/build-native.ts — o alvo React Native (resolve a saída do gerador).

console.log('\nBuild done.');
