---
'@rojaostudio/ds': minor
---

ChipInput `layout="list"`: the Chips wrap without a box and a "+ <addLabel>" of a chip's size closes the row and turns into a field in place (Enter adds and keeps the focus, Escape or leaving it empty closes). `reorderable` (drag, touch after a still press, or Space and the arrows, announced), `editable` (rename a free value in place) and `getChipProps(value)` with `locked`, `count` and `tooltip` for a value in use elsewhere. `size` (list only) sm 32 or md 44 for the Chips and the "+". Chip gains `count` ("Branco · 2"). Tokens: `--chip-count`, `--chip-border-editing`, `--chip-input-add-border`, `--chip-input-add-border-hover`, `--chip-input-add-label`. No new dependency (#117).
