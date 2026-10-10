---
"@rojaostudio/ds": minor
---

NumberInput ganha `size?: 'sm' | 'md'` e `onRemove`.

- `sm`: moldura de 32 de altura que abraça o conteúdo; − e + com 32 de largura e o número com no mínimo 32, crescendo com os dígitos. O rótulo fica visualmente oculto e continua dando nome ao campo. No ponteiro grosso, − e + chegam a 44 × 44 crescendo para fora (o − para a esquerda, o + para a direita, e os dois para cima e para baixo), sem cobrir o número. `md` (padrão) continua como era.
- `onRemove?: () => void` e `removeLabel` (padrão "Remover item"): no mínimo, o − vira uma lixeira, fica ativo, entra no Tab e chama `onRemove`. Sem `onRemove` nada muda: o − desliga no mínimo.
- Exporta o tipo `NumberInputSize`.
