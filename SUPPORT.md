# Support

## Where to ask

- **Bug in the published packages** → [open an issue](https://github.com/rojaostudio/ds/issues)
- **Security** → [SECURITY.md](./SECURITY.md), not a public issue
- **How do I…** → open an issue with the `question` label

## What is maintained, honestly

This is one person's project with no revenue behind it, so the scope is declared up front rather
than discovered by you six months in:

**Will fix**

- Anything wrong in the derivation engine — wrong colour, failing contrast, broken scale
- Packaging defects: a subpath that doesn't resolve, a missing type, a broken build output
- Accessibility failures in shipped components

**Won't do**

- New components on request. The library covers what these projects needed; it isn't trying to
  be exhaustive
- Support for a design approach the system doesn't take — this has opinions, and they're the point
- Migration work for your codebase

**Welcome as a pull request, not promised as a feature**

- Support for another framework or bundler
- A new emitter target (SCSS, Style Dictionary, iOS, Android)
- Documentation and translations

## Why the scope is written down

An open source project with no revenue is paid for in the maintainer's evenings. The way that
ends badly is a maintainer who says yes to everything and then goes quiet for a year. Saying no
early, in writing, is what keeps the yeses reliable.

If you need something outside this and it matters to your business, say so in the issue — that's
a different conversation, not a rejection.
