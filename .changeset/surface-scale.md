---
"@rojaostudio/ds": minor
---

Surface width scale (ds#189) and PageShell `maxWidth="medium"` (ds#177).

- New tokens `--layout-surface-xs|sm|md|lg|xl` (240 · 320 · 400 · 560 · 720), always shipped: the width of a panel, menu, dialog or floating window. Sidebar, Tooltip, Popover, HoverCard, Sheet, Drawer, Dialog, AlertDialog and Command now read them. No width changes.
- PageShell: `maxWidth="medium"` caps the content at 1152 (`--layout-content-max-width-medium`), for a site or a marketing page, between narrow (768) and wide (1536).
