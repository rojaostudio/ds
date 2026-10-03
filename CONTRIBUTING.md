# Contributing

Thanks for looking. Read [SUPPORT.md](./SUPPORT.md) first — it says what this project maintains
and what it doesn't, which is the fastest way to know whether your change will land.

## Setup

```bash
pnpm install
pnpm exec turbo run build     # ds-core builds before ds — the order matters
pnpm test
```

Node 20+, pnpm 10. The workspace is Turborepo:

```
packages/ds-core   the engine — tokens, theme derivation, emitters. No React.
packages/ds        components, styles, React Native target
packages/cli       the `rojao-ds` CLI (npx rojao-ds init), a thin shell over ds-core
```

## Branches

`main` is the only long-lived branch and is protected. Work goes in a short branch off `main`,
comes back through a PR, gets squash-merged, and the branch is deleted.

Before any force-push or branch delete: `git diff origin/main <branch> --stat`. A different SHA
is not a missing file — squash rewrites SHAs. If a file really is absent from main, there's
unmerged work there.

## What CI runs

One job, `Typecheck · Test · Build`. **Renaming that job breaks every PR** — it's the required
status check, and admin enforcement is on, so there's no way to unblock it from inside. If you
need to rename it, the branch protection has to change in the same pass.

## A rule about workflows

**Never use `pull_request_target`. Never expose secrets to a workflow that runs code from a
fork.**

This is the single most common way a public repository gets compromised: a pull request adds a
step, the workflow runs it with the repository's credentials, and the token is gone. CI here runs
on `pull_request` with `permissions: read-all` and no secrets in the environment. Keep it that
way.

## Components and tokens (2.0)

Figma [RDS] is the source of truth. A component follows its Figma API letter by letter, with
three fixed translations: Figma `style` becomes `variant` (`style` is reserved in React), `label`
becomes `children`, and `showIcon` + `iconName` become `icon`.

- **Tokens.** `packages/ds/tokens/figma/*.txt` and `packages/ds-core/figma/*.txt` are extracted
  from Figma and never edited by hand. `pnpm --filter @rojaostudio/ds build:rds` turns them into
  `styles/rds/*.css` and fails on an alias to a missing token, a `var()` nothing defines, or a
  component token its stylesheet never uses (a token Figma marks "Obsoleto" is still emitted, but no
  stylesheet has to read it).
- **Extracting the tokens.** `packages/ds/scripts/figma/extract-tokens.figma.js` is the extraction. It
  runs read-only in Figma through the Plugin API: paste it in a plugin console, or have an agent run
  it with `use_figma`. In the Components file (`w64JuUL45DO4jGu3WEy9HU`) it returns one
  `packages/ds/tokens/figma/<collection>.txt` per local collection; in the Base Tokens file
  (`1Xn5IkLiq5Yhas680rJQf6`) it returns `packages/ds-core/figma/theme.txt` and `foundation.txt`. The
  return value is `{ "<path from the repo root>": "<content>" }`: save each entry as is (set `ONLY` to
  a list of collection names to extract part of the Components file). Then run `build:rds` and read
  the diff: a token Figma removed that a stylesheet still reads fails the build, and the fix is the
  stylesheet, following Figma. A brand table (`packages/ds-core/figma/brands/<brand>.rds.json`) comes
  from `packages/ds-core/figma/export-brand.js` instead; client brands never enter this repository.
- **Styles.** Each component has its own `components/<name>.css` with `rds-` classes and a
  `/* @tokens <group> */` header. It reads its own component tokens (`--button-*`) and the
  foundation (`--border-width`, `--radius-*`, `--type-*`), never a theme role or a raw colour. The build bundles every component stylesheet into
  `styles/rds/components-styles.css`, inside `@layer rds.components`.
- **Dependencies.** The published packages carry no third-party runtime dependency, with one
  exception: `@radix-ui/react-*`, for overlays, menus and other widgets whose accessibility is
  hard to get right by hand. `pnpm check:pack` enforces the list.
- **Tests.** Every component has a browser test (`components/<name>.browser.test.tsx`) that
  renders it in Chromium, in light and dark, and runs axe with every violation as a failure
  (`pnpm --filter @rojaostudio/ds test:browser`). There is no Storybook: the documentation is
  the showroom at ds.rojao.ai.

## Changes that touch colour

The derivation is covered by contrast tests: every text role against every surface, in both
modes, across every theme. If your change moves a token, the test tells you before a user does.
Run `pnpm test` and read the failure — a failing contrast assertion is usually the change being
wrong, not the test.

Anything that changes what people see gets said plainly in the changeset. "Muda aparência" in a
changeset is worth more than a perfect commit message.

## Changesets

Every change to a published package needs one:

```bash
pnpm changeset
```

Pick `patch` for a fix, `minor` for anything that changes what consumers see or get. Write what
changed and why, not just what you touched.

## Language

Code, commits and internal comments in this repository are in Portuguese, matching the codebase.
Public documentation — READMEs, this file, SECURITY, SUPPORT — is in English, because the
packages are on npm. Follow whichever the file you're editing already uses.
