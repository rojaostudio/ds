---
'@rojaostudio/ds': minor
---

MediaGrid (#118): the photos of a record in square tiles that wrap. The first is the cover (Badge "Capa"), the last tile adds (native file input, `max` cuts the extra files and says so at once), empty it is a FileInput dropzone. Uploading (Progress) and error ("Tentar de novo") per tile. Move by dragging the whole tile, by Space and the arrows, or by each photo's menu (Definir como capa, Mover para a esquerda/direita, Editar, Remover). One event for every order: `onReorder(ids)`. Tokens `--media-grid-*`.

Reordering without dragging (WCAG 2.5.7), in ChipInput too: hold an item still, let go, and tap where it goes.
