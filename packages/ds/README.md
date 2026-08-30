# @rojaostudio/ds

React components, styles and a React Native target for [Rojão DS](https://ds.rojao.ai).

> **Only want the theme?** The engine is [`@rojaostudio/ds-core`](https://www.npmjs.com/package/@rojaostudio/ds-core) —
> tokens and theme derivation, with **zero peer dependencies**. It won't make you declare React
> or Tailwind.

```bash
npm i @rojaostudio/ds
```

```css
/* your root stylesheet */
@import "tailwindcss";
@import "@rojaostudio/ds/styles/base.css";
@import "@rojaostudio/ds/styles/themes/rojao.css";   /* or your own generated theme */
```

```tsx
import { Button } from '@rojaostudio/ds/components/button';

<Button variant="primary">Save</Button>
```

Then put the theme class on `<html>` — add `dark` for dark mode:

```html
<html class="theme-rojao">
<html class="theme-rojao dark">
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

## Requirements

Tailwind CSS 4 and React 19. `base.css` uses `@theme inline`, so Tailwind 4 isn't optional here —
it's the layer the utilities come from. If that's not your stack, `@rojaostudio/ds-core` gives you
the tokens without any of it.

## React Native

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
