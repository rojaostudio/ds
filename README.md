# Rojão DS

[![@rojaostudio/ds-core](https://img.shields.io/npm/v/@rojaostudio/ds-core?label=%40rojaostudio%2Fds-core&color=0d6e85)](https://www.npmjs.com/package/@rojaostudio/ds-core)
[![@rojaostudio/ds](https://img.shields.io/npm/v/@rojaostudio/ds?label=%40rojaostudio%2Fds&color=0d6e85)](https://www.npmjs.com/package/@rojaostudio/ds)
[![license](https://img.shields.io/npm/l/@rojaostudio/ds-core?color=444)](./LICENSE)

Design system built around one idea: **your brand becomes the design system your AI builds
with.** A colour goes in; a full token system comes out, contrast-verified, ready for your
project and readable by Claude Code or Cursor.

[**ds.rojao.ai**](https://ds.rojao.ai) — drop a logo, get the theme. No account, no upload: the
colour is extracted on a canvas in your own browser and the image never leaves it.

## Packages

| Package | What it is | Peer dependencies |
|---|---|---|
| [`@rojaostudio/ds-core`](./packages/ds-core) | the engine — tokens, theme derivation, emitters | **none** |
| [`@rojaostudio/ds`](./packages/ds) | React components, styles, React Native target | react, react-dom, tailwindcss |

If you only want the tokens, you only need `ds-core`. It doesn't import React.

## What makes it different

**Accessibility is measured, not claimed.** Every text role is checked against every surface, in
both modes, across every theme, on every build. A regression in the derivation fails CI instead
of shipping and being found in an audit later.

**The output is yours.** The `theme.css` and `CLAUDE.md` generated from your brand carry no
license obligation. The engine is MIT; what comes out of it isn't ours.

## Repository

Turborepo + pnpm workspaces.

```
packages/ds-core   the engine
packages/ds        components and styles
```

The generator at [ds.rojao.ai](https://ds.rojao.ai) is built from these packages and lives in
its own repository — it consumes them from npm, exactly like you would.

- [CONTRIBUTING.md](./CONTRIBUTING.md) — setup, branches, the workflow rule that matters
- [SUPPORT.md](./SUPPORT.md) — what is maintained, and what isn't
- [SECURITY.md](./SECURITY.md) — how to report a vulnerability privately

## License

MIT — see [LICENSE](./LICENSE). The name "Rojão", the logos and the domains are **not** covered:
see [TRADEMARK.md](./TRADEMARK.md). Use the code freely; don't ship a fork called Rojão DS.
