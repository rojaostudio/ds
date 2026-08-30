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
