---
"@rojaostudio/ds": minor
---

Toggle e ToggleGroup ganham `size?: 'sm' | 'md'` (padrão `md`, o tamanho de hoje, 44 de altura).

- `sm`: 32 de altura e ícone de 16; só com ícone vira um quadrado de 32.
- No ponteiro grosso, uma camada invisível leva o alvo de toque a 44, como no Button sm: na vertical, e nos quatro lados quando é só ícone. O layout não se mexe.
- `<ToggleGroup size>` repassa o tamanho aos itens. Num ToggleGroup `sm`, no ponteiro grosso, os itens ficam 12 de distância (eram 4), nas linhas e entre linhas, para que as camadas de toque de itens vizinhos se encontrem sem se sobrepor.
- Exporta o tipo `ToggleSize`.
