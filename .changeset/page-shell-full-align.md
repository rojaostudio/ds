---
"@rojaostudio/ds": minor
"@rojaostudio/ds-codemod": patch
---

PageShell: `maxWidth="full"` (no cap, for a board, a kanban or a map) and `align="start" | "center"` (default center; start puts the capped content at the inline start, next to a side menu). narrow and wide now read the new tokens `--layout-content-max-width-narrow` (768) and `--layout-content-max-width-wide` (1536) instead of a fixed 1536px; `--layout-form-max-width` stays as a deprecated alias of narrow until the next major. The codemod knows `maxWidth="full"`. (ds#162)
