---
"@rojaostudio/ds-core": patch
"@rojaostudio/ds": patch
---

Print: o texto sobre um fundo que vira branco na impressão (`text/on/cover`, `text/on/tint`, `text/on/band-base`) passa a ser o `text/body` do claro, como no Figma [RDS]. Antes, uma capa de acento escuro levava texto branco sobre a capa branca (1:1). Os textos sobre preenchimento cheio (`on/primary`, `secondary`, `accent`, `success`, `warning`, `error`, `info`, `neutral`) não mudam. Novo exportado `RDS_PRINT_ON_WHITE`.
