---
"@rojaostudio/ds": minor
---

ChoiceCard `layout="preview"` passa a desenhar a imagem com o `Media` (16:9, decorativo), com a mesma borda de 1px, o raio radius/container, o check no canto e o ícone de imagem vazia quando não há `preview`. As medidas não mudam. A classe interna do ícone vazio passa a ser `.rds-media__fallback` (era `.rds-choice-card__placeholder`).
