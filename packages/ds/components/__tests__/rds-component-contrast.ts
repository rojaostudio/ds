/**
 * The contrast of the component tokens under a generated theme (one brand colour, `generateRdsTheme`).
 *
 * A theme role is only half of the story: the components read their own tokens (styles/rds/components.css), each one
 * an alias of a role, and a pair that matters (the label of a neutral button on its fill) can join two roles the theme
 * report never puts side by side. Here the stylesheet the showroom serves is rebuilt: the CSS of `emitRdsCss` (light,
 * dark, plate) under the component token layer, each component token resolved to its final colour, alpha composited
 * over what is below it. Then every text/background pair of the components is measured.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { emitRdsCss, type RdsTheme } from '@rojaostudio/ds-core/generate';

export type Mode = 'light' | 'dark' | 'plate';
export const MODES: Mode[] = ['light', 'dark', 'plate'];

/** WCAG AA: 4.5:1 for text, 3:1 for what is not text (a field border, an icon, a logo) and for large text. */
export const MIN = { t: 4.5, u: 3 } as const;
export type Kind = keyof typeof MIN;

/**
 * A pair: the foreground token, what it sits on, and the kind. The background is a component token, a theme role
 * (`role:<var>`), `@ctx` (the surfaces a component is placed on: surface/page and surface/card of the mode) or
 * `@inverse` (the brand band the inverse tone is drawn for: colors/primary/default). `<token>@<n>` is the token
 * mixed at n% over what is below (`color-mix(... n%, transparent)` in the component CSS). A background is itself
 * composited over the contexts when it has alpha.
 */
export type Pair = readonly [fg: string, bg: string, kind: Kind];

const CTX = '@ctx';
const INV = '@inverse';

const tokensCss = readFileSync(join(__dirname, '../../styles/rds/components.css'), 'utf8');

/** Component token → its value (`var(--role)` for colours), from the [RDS] component token layer. */
export const componentTokens: Record<string, string> = Object.fromEntries(
  [...tokensCss.matchAll(/^\s*(--[a-z0-9-]+):\s*([^;]+);/gm)].map((m) => [m[1], m[2].trim()]),
);

// ---------------------------------------------------------------------------------------------------------------
// Pairs.

const button: Pair[] = (() => {
  const out: Pair[] = [];
  for (const tone of ['action', 'neutral', 'danger', 'inverse']) {
    const ctx = tone === 'inverse' ? INV : CTX;
    const p = `--button-${tone}`;
    for (const part of ['label', 'icon'] as const) {
      const kind: Kind = part === 'label' ? 't' : 'u';
      for (const st of ['default', 'hover', 'active']) out.push([`${p}-fill-${part}`, `${p}-fill-background-${st}`, kind]);
      for (const v of ['outline', 'ghost']) {
        out.push([`${p}-${v}-${part}`, ctx, kind]);
        for (const st of ['hover', 'active']) out.push([`${p}-${v}-${part}`, `${p}-${v}-background-${st}`, kind]);
      }
    }
    out.push([`${p}-outline-border`, ctx, 'u']);
  }
  out.push(['--button-focus-ring', CTX, 'u'], ['--button-inverse-focus-ring', INV, 'u']);
  return out;
})();

/** The text field family: label, hint and error beside the field, value and floating label inside it. */
const field = (p: string, opts: { placeholder?: boolean; icon?: boolean; float?: boolean } = {}): Pair[] => [
  [`${p}-label-color`, CTX, 't'], [`${p}-hint-color`, CTX, 't'], [`${p}-error-message-color`, CTX, 't'],
  [`${p}-required-color`, CTX, 't'],
  [`${p}-value-default`, `${p}-background-default`, 't'],
  ...(opts.placeholder === false ? [] : ([[`${p}-placeholder-default`, `${p}-background-default`, 't']] as Pair[])),
  ...(opts.icon ? ([[`${p}-icon-default`, `${p}-background-default`, 'u']] as Pair[]) : []),
  ...(opts.float
    ? ([[`${p}-float-default`, `${p}-background-default`, 't'], [`${p}-float-error`, `${p}-background-default`, 't']] as Pair[])
    : []),
  [`${p}-border-default`, CTX, 'u'], [`${p}-border-error`, CTX, 'u'], [`${p}-border-focus`, CTX, 'u'],
  [`${p}-border-default`, `${p}-background-default`, 'u'], [`${p}-border-error`, `${p}-background-default`, 'u'],
];

/** A block of the marketing kit: eyebrow, title and text on its own background. */
const block = (p: string, parts = ['eyebrow', 'title', 'text']): Pair[] => parts.map((x) => [`${p}-${x}`, `${p}-background`, 't'] as const);

const states = ['neutral', 'info', 'success', 'warning', 'danger'];

export const PAIRS: Pair[] = [
  ...button,
  // Fields.
  ...field('--input', { icon: true, float: true }), ['--input-affix-default', '--input-background-default', 't'],
  ...field('--textarea', { icon: true }), ...field('--select', { icon: true, float: true }), ...field('--chip-input'),
  ...field('--number-input'), ['--number-input-unit-default', '--number-input-background-default', 't'],
  ['--number-input-step-icon-default', '--number-input-background-default', 'u'],
  ...field('--color-input'),
  ['--otp-label', CTX, 't'], ['--otp-hint', CTX, 't'], ['--otp-error-message', CTX, 't'],
  ['--otp-digit-default', '--otp-slot-background-default', 't'], ['--otp-slot-border-default', CTX, 'u'],
  ['--otp-slot-border-error', CTX, 'u'], ['--otp-slot-border-active', CTX, 'u'],
  ...['--checkbox', '--radio', '--switch'].flatMap((p): Pair[] => [[`${p}-label-color`, CTX, 't'], [`${p}-hint-color`, CTX, 't']]),
  ['--checkbox-error-message-color', CTX, 't'], ['--checkbox-control-border-default', CTX, 'u'],
  ['--checkbox-control-border-error', CTX, 'u'], ['--radio-control-border-default', CTX, 'u'],
  ['--checkbox-control-mark', '--checkbox-control-background-checked', 'u'],
  ['--checkbox-control-mark', '--checkbox-control-background-checked-hover', 'u'],
  ['--radio-control-dot', '--radio-control-background-checked', 'u'],
  ...['--checkboxgroup', '--radiogroup'].flatMap((p): Pair[] => [
    [`${p}-legend-color`, CTX, 't'], [`${p}-hint-color`, CTX, 't'], [`${p}-error-message-color`, CTX, 't'],
  ]),
  ['--slider-label', CTX, 't'], ['--slider-value', CTX, 't'], ['--switch-track-off', CTX, 'u'],
  ['--file-input-area-title-default', '--file-input-area-background-default', 't'],
  ['--file-input-area-caption-default', '--file-input-area-background-default', 't'],
  ['--file-input-area-title-default', '--file-input-area-background-hover', 't'],
  ['--file-input-area-icon-default', '--file-input-area-icon-background-default', 'u'],
  ['--combobox-empty', '--listbox-background', 't'],
  // Table, Sidebar, Card.
  ['--table-header-label', '--table-header-background', 't'], ['--table-cell-label', '--table-background', 't'],
  ['--sidebar-item-label-default', '--sidebar-background', 't'], ['--sidebar-item-label-hover', '--sidebar-item-background-hover', 't'],
  ['--sidebar-item-label-active', '--sidebar-item-background-active', 't'], ['--sidebar-module', '--sidebar-background', 't'],
  ['--sidebar-user', '--sidebar-background', 't'], ['--sidebar-section-label', '--sidebar-background', 't'],
  ['--sidebar-item-count', '--sidebar-background', 't'], ['--sidebar-item-count', '--sidebar-item-background-active', 't'],
  ['--sidebar-item-indicator', '--sidebar-item-background-active', 'u'], ['--sidebar-focus-ring', '--sidebar-background', 'u'],
  // The brand mark of the Sidebar header (a slot painted with the logo roles) and the logos on any surface.
  ...['logo-primary', 'logo-signature', 'logo-mono'].flatMap((l): Pair[] => [
    [`role:--${l}`, '--sidebar-background', 'u'], [`role:--${l}`, CTX, 'u'],
  ]),
  ['--card-title', '--card-background', 't'], ['--card-description', '--card-background', 't'],
  ['--card-tint-title', '--card-tint-background', 't'],
  // Blocks.
  ...block('--faq'), ...block('--contact'), ...block('--benefits'), ...block('--testimonial'),
  ...block('--pricing'), ...block('--newsletter', ['title', 'text', 'note']), ...block('--footer', ['legal', 'link', 'tagline', 'title']),
  ...block('--banner', ['highlight', 'text']), ...block('--benefits-item', ['title', 'text']),
  ...block('--testimonial-item', ['name', 'quote', 'role']),
  ...block('--pricing-plan', ['name', 'price', 'period', 'description', 'feature']),
  ['--pricing-plan-check', '--pricing-plan-background', 'u'],
  ['--pricing-plan-recommended-text', '--pricing-plan-recommended-background', 't'],
  ['--pricing-plan-recommended-check', '--pricing-plan-recommended-background', 'u'],
  ['--heading-default', CTX, 't'], ['--pageheader-title', CTX, 't'], ['--pageheader-description', CTX, 't'],
  ['--empty-title', CTX, 't'], ['--empty-description', CTX, 't'], ['--item-title', CTX, 't'], ['--item-description', CTX, 't'],
  ['--item-description', '--item-muted-background', 't'],
  // Badge, Status, Tile, Toast, Alert.
  ...['neutral-fill', 'neutral-soft', 'action-fill', 'action-soft', 'accent-fill', 'accent-highlight', 'inverse-fill'].map(
    (v): Pair => [`--badge-${v}-label`, `--badge-${v}-background`, 't'],
  ),
  ...states.flatMap((s): Pair[] => [
    [`--status-${s}-outline-label`, `--status-${s}-outline-background`, 't'],
    [`--status-${s}-fill-label`, `--status-${s}-fill-background`, 't'],
    [`--status-${s}-soft-label`, `--status-${s}-soft-background`, 't'],
    [`--tile-${s}-fill-icon`, `--tile-${s}-fill-background`, 'u'],
    [`--tile-${s}-soft-icon`, `--tile-${s}-soft-background`, 'u'],
    [`--toast-${s}-soft-text`, `--toast-${s}-soft-background`, 't'],
    [`--toast-${s}-fill-text`, `--toast-${s}-fill-background`, 't'],
    [`--alert-${s}-foreground`, `--alert-${s}-background`, 't'],
    [`--alert-text`, `--alert-${s}-background`, 't'],
  ]),
  ['--tile-action-fill-icon', '--tile-action-fill-background', 'u'], ['--tile-action-soft-icon', '--tile-action-soft-background', 'u'],
  ['--toast-title', '--toast-background', 't'], ['--toast-text', '--toast-background', 't'],
  ['--stat-label', '--stat-background', 't'], ['--stat-caption', '--stat-background', 't'],
  ...['default', 'positive', 'negative', 'warning', 'muted'].map((v): Pair => [`--stat-value-${v}`, '--stat-background', 't']),
  ['--delta-neutral', CTX, 't'], ['--delta-success', CTX, 't'], ['--delta-danger', CTX, 't'],
  ...['alert', 'opportunity', 'tip'].flatMap((v): Pair[] => [
    ['--insight-card-title', `--insight-card-${v}-background`, 't'], ['--insight-card-description', `--insight-card-${v}-background`, 't'],
    ['--insight-card-potential', `--insight-card-${v}-background`, 't'],
    [`--insight-card-${v}-badge-text`, `--insight-card-${v}-badge-background`, 't'],
  ]),
  ['--insight-card-action-text', '--insight-card-action-background', 't'],
  // Navigation.
  ['--tabs-label-default', CTX, 't'], ['--tabs-label-hover', CTX, 't'], ['--tabs-label-selected', CTX, 't'],
  ['--tabs-count-default', CTX, 't'], ['--tabs-indicator', CTX, 'u'], ['--tabs-soon-text', '--tabs-soon-background', 't'],
  ['--breadcrumb-label-default', CTX, 't'], ['--breadcrumb-label-hover', CTX, 't'], ['--breadcrumb-label-current', CTX, 't'],
  ['--breadcrumb-inverse-label-default', INV, 't'], ['--breadcrumb-inverse-label-hover', INV, 't'],
  ['--breadcrumb-inverse-label-current', INV, 't'],
  ['--pagination-item-label-default', CTX, 't'], ['--pagination-item-label-default', '--pagination-item-background-hover', 't'],
  ['--pagination-item-label-current', '--pagination-item-background-current', 't'], ['--pagination-summary', CTX, 't'],
  ['--navmenu-trigger-label', CTX, 't'], ['--navmenu-trigger-label', '--navmenu-trigger-background-hover', 't'],
  ['--navmenu-link-title', '--navmenu-panel-background', 't'], ['--navmenu-link-description', '--navmenu-panel-background', 't'],
  ['--navmenu-link-title', '--navmenu-link-background-hover', 't'],
  ['--menu-item-label', '--menu-background', 't'], ['--menu-item-label', '--menu-item-background-hover', 't'],
  ['--menu-item-danger', '--menu-background', 't'], ['--menu-item-danger', '--menu-item-background-hover', 't'],
  ['--menu-item-icon', '--menu-background', 'u'],
  ['--command-group-label', '--command-background', 't'], ['--command-placeholder', '--command-background', 't'],
  ['--listbox-option-text-default', '--listbox-background', 't'],
  ['--listbox-option-text-default', '--listbox-option-background-hover', 't'],
  ['--listbox-option-text-default', '--listbox-option-background-selected', 't'],
  ['--listbox-option-check', '--listbox-option-background-selected', 'u'],
  // Actions on the brand fill.
  ['--actionbar-text', '--actionbar-background', 't'], ['--bottom-bar-text', '--bottom-bar-background', 't'],
  ['--bottom-bar-button-fill-label', '--bottom-bar-button-fill-background', 't'],
  ['--bottom-bar-button-ghost-label', '--bottom-bar-background', 't'],
  ['--fab-cta-text', '--fab-cta-background-default', 't'], ['--fab-cta-text', '--fab-cta-background-hover', 't'],
  ['--tooltip-text', '--tooltip-background', 't'],
  ['--toggle-label', CTX, 't'], ['--toggle-label', '--toggle-background-hover', 't'],
  ['--toggle-label-pressed', '--toggle-background-pressed', 't'], ['--toggle-label-pressed', '--toggle-background-pressed-hover', 't'],
  ['--toggle-border', CTX, 'u'],
  ['--chip-label', '--chip-background', 't'], ['--chip-label', '--chip-background-hover', 't'], ['--chip-icon', '--chip-background', 'u'],
  ['--filter-chip-text-inactive', '--filter-chip-surface-inactive', 't'], ['--filter-chip-text-hover', '--filter-chip-surface-hover', 't'],
  ['--filter-chip-text-active', '--filter-chip-surface-active@12', 't'],
  // Selection.
  ['--calendar-title', '--calendar-background', 't'], ['--calendar-weekday', '--calendar-background', 't'],
  ['--calendar-day-label-default', '--calendar-background', 't'], ['--calendar-day-label-default', '--calendar-day-background-hover', 't'],
  ['--calendar-day-label-selected', '--calendar-day-background-selected', 't'],
  ['--choice-card-label-color-default', '--choice-card-container-background-default', 't'],
  ['--choice-card-description-color-default', '--choice-card-container-background-default', 't'],
  ['--choice-card-label-color-selected', '--choice-card-container-background-selected', 't'],
  ['--choice-card-description-color-selected', '--choice-card-container-background-selected', 't'],
  ['--choice-card-radio-dot', '--choice-card-container-background-selected', 'u'],
  ['--choice-card-icon-color-default', '--choice-card-icon-background-default', 'u'],
  ['--choice-card-check-icon-preview', '--choice-card-check-background-preview', 'u'],
  ['--choice-list-item-title-default', CTX, 't'], ['--choice-list-item-description-default', CTX, 't'],
  ['--choice-list-item-title-default', '--choice-list-item-background-hover', 't'],
  ['--choice-list-item-title-default', '--choice-list-item-background-selected', 't'],
  ['--choice-list-item-description-selected', '--choice-list-item-background-selected', 't'],
  ['--choice-list-item-trailing-default', CTX, 't'],
  ['--section-card-label-default', '--section-card-body-background', 't'],
  ['--section-card-label-default', '--section-card-header-background-hover', 't'],
  ['--section-card-label-open', '--section-card-header-background-open', 't'],
  ['--section-card-badge-open', '--section-card-header-background-open', 't'],
  ['--section-card-badge-default', '--section-card-body-background', 't'],
  // Content.
  ['--accordion-title', CTX, 't'], ['--accordion-content', CTX, 't'], ['--accordion-icon', CTX, 'u'],
  ['--bubble-fill-text', '--bubble-fill-background', 't'], ['--bubble-muted-text', '--bubble-muted-background', 't'],
  ['--bubble-outline-text', '--bubble-outline-background', 't'], ['--bubble-tinted-text', '--bubble-tinted-background', 't'],
  ['--bubble-error-text', '--bubble-error-background', 't'], ['--bubble-reactions-text', '--bubble-reactions-background', 't'],
  ['--bubble-ghost-text', CTX, 't'], ['--message-name', CTX, 't'], ['--message-time', CTX, 't'], ['--marker-text', CTX, 't'],
  ['--attachment-title', '--attachment-background', 't'], ['--attachment-description', '--attachment-background', 't'],
  ['--attachment-error', '--attachment-background', 't'],
  ['--questionnaire-title', '--questionnaire-background', 't'], ['--questionnaire-description', '--questionnaire-background', 't'],
  ['--questionnaire-error', '--questionnaire-background', 't'],
  ['--avatar-fallback-label', '--avatar-fallback-background', 't'], ['--avatar-brand-label', '--avatar-brand-background', 't'],
  ['--avatar-icon-icon', '--avatar-icon-background', 'u'],
  ['--kbd-label', '--kbd-background', 't'], ['--media-tile-label', '--media-tile-background', 't'],
  ['--progress-label', CTX, 't'], ['--progress-value', CTX, 't'], ['--progress-fill', CTX, 'u'],
  ['--spinner-label', CTX, 't'], ['--spinner-indicator', CTX, 'u'], ['--spinner-inverse-label', INV, 't'],
  ['--spinner-inverse-indicator', INV, 'u'], ['--rating-label', CTX, 't'],
  ['--chart-label', CTX, 't'], ['--chart-axis', CTX, 't'], ['--chart-tooltip-title', '--chart-tooltip-background', 't'],
  ['--chart-series-color-1', CTX, 'u'], ['--sparkline-line', CTX, 'u'],
  // Overlays.
  ...['--dialog', '--drawer', '--sheet'].flatMap((p): Pair[] => [[`${p}-title`, `${p}-background`, 't'], [`${p}-text`, `${p}-background`, 't']]),
  ['--alertdialog-title', '--alertdialog-background', 't'], ['--alertdialog-text', '--alertdialog-background', 't'],
  ['--popover-title', '--popover-background', 't'], ['--popover-text', '--popover-background', 't'],
  ['--hovercard-title', '--hovercard-background', 't'], ['--hovercard-text', '--hovercard-background', 't'],
  ['--hovercard-meta', '--hovercard-background', 't'], ['--loading-overlay-text', '--loading-overlay-background', 't'],
  ['--whatsapp-notification-card-title', '--whatsapp-notification-card-background', 't'],
  ['--whatsapp-notification-card-text', '--whatsapp-notification-card-background', 't'],
  ['--whatsapp-notification-card-meta', '--whatsapp-notification-card-background', 't'],
  ['--browser-address-text', '--browser-address-background', 't'], ['--phone-address-text', '--phone-address-background', 't'],
];

// ---------------------------------------------------------------------------------------------------------------
// Colour.

type Rgba = [number, number, number, number];

const parse = (hex: string): Rgba => {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex.trim());
  if (!m) throw new Error(`not a hex colour: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, m[2] ? parseInt(m[2], 16) / 255 : 1];
};
const toHex = ([r, g, b]: Rgba) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
/** `top` over an opaque `below`. */
const over = (top: Rgba, below: Rgba): Rgba => {
  const a = top[3];
  return [top[0] * a + below[0] * (1 - a), top[1] * a + below[1] * (1 - a), top[2] * a + below[2] * (1 - a), 1];
};
const lum = ([r, g, b]: Rgba) => {
  const c = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};
export const ratio = (a: Rgba, b: Rgba) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// ---------------------------------------------------------------------------------------------------------------
// The emitted stylesheet, per mode.

/** The three blocks of `emitRdsCss` (light, dark, plate) as maps; dark and plate inherit light, as in the cascade. */
export function emittedModes(theme: RdsTheme): Record<Mode, Record<string, string>> {
  const css = emitRdsCss(theme);
  const blocks = [...css.matchAll(/\{([^}]*)\}/g)].map((m) =>
    Object.fromEntries([...m[1].matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((d) => [d[1], d[2].trim()])),
  );
  if (blocks.length !== 3) throw new Error(`emitRdsCss: expected 3 blocks, got ${blocks.length}`);
  const [light, dark, plate] = blocks;
  return { light, dark: { ...light, ...dark }, plate: { ...light, ...plate } };
}

/** A component token (or a theme role) down to its colour in one mode. */
function resolve(name: string, roles: Record<string, string>, seen: string[] = []): string {
  if (seen.includes(name)) throw new Error(`cycle: ${[...seen, name].join(' → ')}`);
  const v = componentTokens[name] ?? roles[name];
  if (v === undefined) throw new Error(`unknown token ${name}`);
  const ref = /^var\((--[a-z0-9-]+)(?:\s*,[^)]*)?\)$/.exec(v);
  return ref ? resolve(ref[1], roles, [...seen, name]) : v;
}

export type Measure = { mode: Mode; fg: string; bg: string; kind: Kind; ratio: number; colours: string };

/** Every pair in one mode: the worst ratio over the contexts the pair can sit on. */
export function measure(roles: Record<string, string>, mode: Mode): Measure[] {
  const colour = (name: string) => parse(resolve(name.startsWith('role:') ? name.slice(5) : name, roles));
  const contexts = [colour('--surface-page'), colour('--surface-card')].map((c) => over(c, [255, 255, 255, 1]));
  return PAIRS.map(([fg, bg, kind]) => {
    let worst = Infinity;
    let colours = '';
    const bases = bg === INV ? [over(colour('--colors-primary-default'), contexts[0])] : contexts;
    for (const base of bases) {
      let back = base;
      if (bg !== CTX && bg !== INV) {
        const [name, pct] = bg.split('@');
        const c = colour(name);
        back = over(pct ? [c[0], c[1], c[2], (c[3] * Number(pct)) / 100] : c, base);
      }
      const front = over(colour(fg), back);
      const r = ratio(front, back);
      if (r < worst) {
        worst = r;
        colours = `${toHex(front)} on ${toHex(back)}`;
      }
    }
    return { mode, fg, bg, kind, ratio: Math.round(worst * 100) / 100, colours };
  });
}

/** The pairs below their minimum, every mode. */
export function failures(theme: RdsTheme): Measure[] {
  const modes = emittedModes(theme);
  return MODES.flatMap((m) => measure(modes[m], m)).filter((x) => x.ratio < MIN[x.kind]);
}

/** Every token a pair names exists (a typo would measure nothing). */
export function unknownTokens(): string[] {
  const names = PAIRS.flatMap(([fg, bg]) => [fg, bg])
    .filter((n) => n !== CTX && n !== INV && !n.startsWith('role:'))
    .map((n) => n.split('@')[0]);
  return [...new Set(names)].filter((n) => componentTokens[n] === undefined);
}
