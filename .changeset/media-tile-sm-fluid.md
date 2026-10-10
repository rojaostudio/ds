---
"@rojaostudio/ds": minor
---

MediaTile ganha `size` e `fluid`. `size="sm"` tem 96 de largura e a legenda em caption 12/16 numa linha só, com reticências; `md` (padrão) continua como era, ocupando a coluna (160 no Figma) com a legenda em duas linhas. `fluid` deixa o tile crescer e encolher entre 72 e 100 numa linha flex (`flex: 1 1 72px`, `max-width: 100px`), com a mídia sempre quadrada, mesmo com `aspect="video"`: quatro miniaturas por linha num card de 480. Exporta o tipo `MediaTileSize`.
