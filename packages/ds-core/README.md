# @rojaostudio/ds-core

The engine behind [Rojão DS](https://ds.rojao.ai): design tokens, theme derivation, emitters.

**No React. No Tailwind. No framework-coupled CSS** — `emitCss` returns plain custom properties that work anywhere CSS does.

```bash
npm i @rojaostudio/ds-core
```

```ts
import { generateTheme, emitCss, emitClaudeMd } from '@rojaostudio/ds-core/generate';

const brand = {
  name: 'acme',
  brand: { primary: '#7C3AED' },
  surface: 'neutral',
  text: 'neutral',
  fonts: { body: 'inter' },
};

emitCss(brand);       // theme.css — light and dark, derived from one color
emitClaudeMd(brand);  // the same brand as rules for Claude Code, Cursor or AGENTS.md
```

One color goes in. What comes out is an OKLCH scale with an adaptive contrast floor, semantic
roles for surface, text, border and brand, and the full light/dark pair — verified against
WCAG AA on all three surfaces, by test, on every build.

## Why this is a separate package

It used to be one package, and its `peerDependencies` forced React 19 and Tailwind 4 on anyone
who only wanted tokens — a consumer depending on what it doesn't use. The boundary already
existed in the code: this directory has never imported React. It just didn't exist in the
packaging.

Components, styles and the React Native target live in
[`@rojaostudio/ds`](https://www.npmjs.com/package/@rojaostudio/ds).

## API

| Entry | What's in it |
|---|---|
| `@rojaostudio/ds-core/generate` | `generateTheme`, `emitCss`, `emitClaudeMd`, `buildScale`, `contrastRatio` |
| `@rojaostudio/ds-core/tokens` | `primitives` — the raw palettes and scales |
| `@rojaostudio/ds-core/recipes` | the reference brand definition |
| `@rojaostudio/ds-core/themes` | the preset catalogue: a starting palette per niche |

## Em português

O site é em português e faz isso sem escrever código: **[ds.rojao.ai](https://ds.rojao.ai)** —
você joga sua logo, ele tira a cor e devolve o tema pronto para colar no projeto.

## License

MIT — see [LICENSE](./LICENSE). The **name and logo are not**: see
[TRADEMARK.md](https://github.com/rojaostudio/ds/blob/main/TRADEMARK.md).

**What comes out of the engine is yours.** The `theme.css` and `CLAUDE.md` generated from your
brand carry no license obligation at all. Use them commercially, ship them to clients, sell
them. The engine is MIT; the output isn't ours.
