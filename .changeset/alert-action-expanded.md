---
"@rojaostudio/ds": minor
---

Alert: a ação vai para a direita do texto na tela larga, como no Figma [RDS] de 07/10.

- Abaixo de lg 1024 continua embaixo da descrição; de 1024 em diante fica à direita da coluna de texto, centralizada na vertical, antes do ×.
- O texto (título + descrição) ganha o invólucro `.rds-alert__text`, que leva o respiro do título: um Alert só com título fica na linha do ícone mesmo ao lado de uma ação de 36.
- A ação recomendada passa a ser Button `tone="neutral" variant="outline" size="sm"` (era ghost): embaixo, o contorno alinha com o texto; à direita, não some na chapa.
