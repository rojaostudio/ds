---
"@rojaostudio/ds": minor
"@rojaostudio/ds-core": minor
---

Fonts as brand identity, display sizes and form field ceilings (ds#190, ds#194).

- New theme roles for the brand's fonts, one family each: `--type-font-text`, `--type-font-display`, `--type-font-editorial` (with `--type-font-mono`), and their stacks for `font-family`: `--type-stack-text`, `--type-stack-display`, `--type-stack-editorial`, `--type-stack-mono`. In Figma each brand's families and stacks live in the `brand` collection (`<brand>/font/<family>`, `<brand>/stack/<family>`) and the roles point to them; a brand with one font points every role to it. Every component now reads `--type-stack-text`.
- `--type-font-family` and `--type-font-stack` keep working as `var()` of `--type-font-text` and `--type-stack-text` until 3.0. `--type-font-mono` keeps its fallback (`"Roboto Mono", monospace`) until 3.0; the stack is `--type-stack-mono`.
- Display sizes by viewport, for marketing titles (the Figma text styles `display/hero`, `display/section`, `editorial/hero`, `editorial/section`): `--type-display-hero-size|line` (40 → 72) and `--type-display-section-size|line` (28 → 48).
- Form field ceilings by viewport, as the `max-width` of a short field next to a FILL one: `--form-field-short-max` (88, 168 from md), `--form-field-number-max` (96, 168 from md) and `--form-field-key-max` (no ceiling, 168 from md).
- ds-core: the theme validates and writes the new roles (a family inside quotes; a stack with each family quoted and a generic one bare), and exports `isSafeStack` and `stackCss`. A brand table exported before these roles still loads, with Inter and its own mono, and a warning to export it again.
