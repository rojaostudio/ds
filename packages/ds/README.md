# @rojaostudio/ds

React components, styles and a React Native target for [Rojão DS](https://ds.rojao.ai).

> **Only want the theme?** The engine is [`@rojaostudio/ds-core`](https://www.npmjs.com/package/@rojaostudio/ds-core) —
> tokens and theme derivation, with **zero peer dependencies**. It won't make you declare React.

```bash
npm i @rojaostudio/ds
```

```css
/* your root stylesheet: the theme, the tokens and every component's styles, in cascade layers */
@import "@rojaostudio/ds/styles/rds.css";
```

```tsx
import { Button } from '@rojaostudio/ds/components/button';

<Button>Salvar</Button>
```

Add `dark` to `<html>` (or any element) for dark mode:

```html
<html class="dark">
```

The stylesheet declares its layers first (`rds.legacy`, `rds.theme`, `rds.tokens`, `rds.components`), so your own unlayered CSS
always wins over the design system without `!important`. The components need no Tailwind and no other stylesheet.

### Legacy: `base.css` (deprecated)

`styles/base.css` is the 1.x stylesheet. It stays in the package for the apps that still use its Tailwind
utilities (`bg-surface-*`, `text-fg-*`, `h-control-*`…) and its CSS variables, and it still needs Tailwind 4
(`@theme inline`). No component reads it any more. Move app code off it; it leaves in a future major.

```css
/* only while the app still uses the 1.x utilities */
@import "tailwindcss";
@import "@rojaostudio/ds/styles/base.css";
@import "@rojaostudio/ds/styles/rds.css";
```

Both stylesheets declare the same layer order, `rds.legacy, rds.theme, rds.tokens, rds.components`, and everything
in `base.css` (its variables, the primitives, the `h1`–`h6` rule, the `rojao-*` animations) lives in `rds.legacy`.
So, whatever the import order, the 2.0 wins wherever the two declare the same variable: 31 names, among them
`--surface-page`, `--text-muted`, `--text-disabled`, `--border-default`, `--border-strong`, `--radius-card`,
`--radius-control`, `--z-modal`, `--z-dropdown`, `--z-tooltip`, `--space-4` … `--space-64`, `--toast-text`,
`--toast-border`. A 1.x utility that reads one of them (`bg-surface-page`, `text-fg-muted` through
`--text-muted`) shows the 2.0 value while both are imported; the 1.x-only names (`--brand-primary`,
`--surface-default`…) keep theirs. Tailwind's `@utility` and `@theme` blocks stay at the top level, as Tailwind
requires, and the focus ring stays in Tailwind's `base` layer, so `outline-none` still wins over it. Your own
unlayered CSS wins over all of it.

## Theme scopes

The shipped theme switches on `.dark`, `.ds-plate` and `.ds-scope`, and on three generic attributes:
`data-rds-mode="dark"`, `data-rds-plate` and `data-rds-scope`. The component tokens are declared again on each of
them (`RDS_SCOPE_SELECTORS` in `@rojaostudio/ds-core/generate`): a component token holds `var(--theme-role)`, which
resolves where it is declared, so a theme switched on an element none of them match would repaint the roles but
not the components inside.

```html
<section data-rds-mode="dark">…</section>   <!-- a dark section on a light page -->
```

For your own theme, `emitRdsCss(theme, { scope, dark, plate })` checks each selector against that list and throws
on one the components would not follow:

```ts
emitRdsCss(theme, { scope: ".my-scope[data-rds-scope]" });          // <div class="my-scope" data-rds-scope>
emitRdsCss(theme, { scope: ":root", dark: ':root[data-theme="dark"]' }); // next-themes, attribute="data-theme"
emitRdsCss(theme, { scope: ".my-scope" });                           // throws: add data-rds-scope
```

A dark selector anchored at the root (`:root[…]`, `html…`) is used as is, which is where next-themes puts its
attribute. `allowUncovered: true` skips the check, for a theme read only by your own CSS.

## Print

The theme ends with an `@media print` block: the light mode with every background white and no shadows, on every
scope, so a page printed from `.dark` or a `.ds-plate` still comes out on white paper. Borders and text stay as in
light. The components keep their type; for your printed sheet, `--media-type-<role>-size` and `-line` (`caption`,
`small`, `body`, `label`, `title`) follow the screen type on screen and switch to 8/10, 9/12, 10/14, 12/16 and
18/24 pt on paper.

```css
@media print { .invoice h1 { font-size: var(--media-type-title-size); line-height: var(--media-type-title-line); } }
```

## Import the component, not the barrel

```tsx
import { Button } from '@rojaostudio/ds/components/button';   // preferred
import { Button } from '@rojaostudio/ds/components';          // works, pulls the barrel
```

Both work. The deep path keeps your bundler from walking 83 modules to find one. On Next.js you
can keep the barrel and add:

```js
// next.config.js
experimental: { optimizePackageImports: ['@rojaostudio/ds'] }
```

## Button sizes and the icon side

`Button` and `IconButton` take `size`: `sm` (36), `md` (44, the default) or `lg` (52). Text is 14/20 on sm and
md, 16/24 on lg; the Button icon is 16, 16, 20 and the IconButton icon 16, 20, 24. The measures come from the
`--button-size-<sm|md|lg>-*` tokens (height, padding-x, padding-y, gap, icon, icon-only, text-size, text-line).

The touch target is 44 × 44 in every size. On `sm`, an invisible layer extends it to 44 under a coarse
pointer (`@media (pointer: coarse)`), without moving the layout or the focus ring. Keep two `sm` buttons at
least 8px apart on touch screens, or their targets overlap.

`Button` also takes `iconPosition`: `end` (the default) puts the icon after the text, `start` before it. While
`loading`, the loader takes the icon's side; without an icon, it covers the label.

```tsx
<Button size="sm" icon={<PlusIcon />} iconPosition="start">Novo cliente</Button>
<IconButton size="lg" icon={<PlusIcon />} label="Novo cliente" />
```

The components that draw a Button or an IconButton inside (Alert, Toast, Dialog, Calendar, Carousel…) use md,
as their Figma specs do.

## IconButton goes with a Tooltip

An icon alone doesn't say what the button does. Every `IconButton` is paired with a `Tooltip` carrying the
same text as its `label`; it shows on hover and on keyboard focus. They are two components, always together
(the IconButton has no tooltip inside it):

```tsx
import { IconButton } from '@rojaostudio/ds/components/icon-button';
import { Tooltip } from '@rojaostudio/ds/components/tooltip';

<Tooltip text="Novo cliente">
  <IconButton icon={<PlusIcon />} label="Novo cliente" />
</Tooltip>
```

The pair can itself be the trigger of a `DropdownMenu` or a `Popover`. The IconButtons the design system
renders itself (the × of Alert, Dialog and Toast, the Calendar and Carousel arrows) already come with theirs.

## Requirements

React 19. Tailwind CSS is an **optional** peer: only the legacy `base.css` needs it. A few components bring an
optional peer of their own, installed only if you use them: `react-image-crop` (ImageCropDialog) and
`react-international-phone` (PhoneInput).

## Icons

`@rojaostudio/ds/icons` re-exports a set of `lucide-react` icons (an optional peer) and carries the icons lucide
does not have, drawn by the design system itself, such as `PixIcon`:

```tsx
import { PixIcon } from '@rojaostudio/ds/icons';

<PixIcon size={16} />
```

## React Native

> **Experimental, outside semver in 2.0.** The native target (`@rojaostudio/ds/native/*`) still follows the 1.x
> API (`Button variant="primary"`, `Modal`, `Menu`…) and the 1.x theme (`generateTheme`). It will be aligned with
> the 2.0 components in 2.1; until then it may change in any release, minor and patch included. Pin an exact
> version if you depend on it. The web components never import from it.

```tsx
import { DSThemeProvider } from '@rojaostudio/ds/native/components';

<DSThemeProvider theme={yourBrand}>{children}</DSThemeProvider>
```

`theme` is optional — without it you get the default theme. Generate your own map from a brand
definition with `@rojaostudio/ds-core`.

NativeWind:

```js
presets: [require('nativewind/preset'), require('@rojaostudio/ds/native/preset')]
```

```css
@import '@rojaostudio/ds/native/theme.css';
```

## Accessibility is checked, not claimed

Every text role is measured against every surface, in both modes, on every build. Text and
surface pairs meet **WCAG AA (4.5:1)**; control borders meet **1.4.11 (3:1)**. A regression in the
derivation fails CI — it doesn't ship and get found later in an audit.

## Em português

O site é em português e gera o tema da sua marca sem escrever código:
**[ds.rojao.ai](https://ds.rojao.ai)**.

## License

MIT — see [LICENSE](./LICENSE). The **name and logo are not**: see
[TRADEMARK.md](https://github.com/rojaostudio/ds/blob/main/TRADEMARK.md).
