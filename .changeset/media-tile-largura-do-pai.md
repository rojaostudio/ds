---
"@rojaostudio/ds": minor
---

MediaTile pega a largura do pai: o tile ocupa 100% do container e a mídia mantém a proporção por aspect-ratio, sem largura fixa e sem mínimo ou máximo. `size="sm" | "md"` passa a mudar só o rótulo (sm numa linha com reticências, md em duas); o sm deixa de ter 96 de largura.

**Breaking:** sai `fluid` (e a faixa de 72 a 100). Sem `fluid`; envolva o tile num wrapper com a largura que quiser (ex.: flex 1 1 72px; max-width 100px).
