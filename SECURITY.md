# Security Policy

## Reporting a vulnerability

**Please don't open a public issue.** Use GitHub's
[private vulnerability reporting](https://github.com/rojaostudio/ds/security/advisories/new),
which reaches the maintainer without disclosing anything.

If that isn't available to you, open a public issue saying only *"I have a security report,
where do I send it?"* — no details — and you'll get a private channel back.

Include what you need to make the problem reproducible: affected package and version, the steps,
and what an attacker gets out of it. A proof of concept helps and is never required.

## What to expect

This is maintained by one person, so here is the honest version rather than a service-level
agreement nobody is on call for:

- **First reply within 5 business days.** If you don't hear back, ping the issue tracker without
  details — "I sent a report on <date>" is enough.
- **A fix or a decision within 30 days** for anything that affects consumers of the published
  packages.
- Credit in the advisory and the changelog, unless you'd rather not be named.

## Scope

**In scope:** anything in the published packages `@rojaostudio/ds` and `@rojaostudio/ds-core`, the
release pipeline, and the generator at ds.rojao.ai.

**Out of scope:** the vulnerability of a dependency without a path to exploit it here; anything
that requires an attacker to already control the machine running the build; findings from an
automated scanner pasted without a reproduction.

## One thing worth knowing

The generator does not upload your logo. Colour extraction runs on a canvas in your own browser
and the image never reaches a server, so there is no stored asset to leak. If you find a path
that sends it anywhere, that is a real finding — report it.
