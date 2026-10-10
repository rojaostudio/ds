---
"@rojaostudio/ds": minor
---

MediaTile passa a usar o `Media` por dentro e ganha `ratio` com as cinco proporções (`1:1`, `4:3`, `3:4`, `16:9`, `9:16`). Dentro do tile a mídia fica sem raio e mantém as cores `media-tile/*`, então o visual não muda.

- `aspect` e o tipo `MediaTileAspect` ficam deprecated: `square` vira `1:1` e `video` vira `16:9`. Se vierem os dois, `ratio` vence.
- No fallback com `alt`, a mídia vira role="img" com esse nome; sem `alt`, a mídia é decorativa (o rótulo já diz o que é).
- A classe interna do fallback passa a ser `.rds-media__fallback` (era `.rds-media-tile__fallback`).
