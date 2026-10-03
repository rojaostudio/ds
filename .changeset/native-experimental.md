---
"@rojaostudio/ds": minor
---

O alvo nativo (`@rojaostudio/ds/native`, `/native/components`, `/native/theme`, `/native/icons`, `/native/preset`) fica **experimental, fora do semver na 2.0**: o alvo nativo segue a API 1.x na 2.0 e será alinhado na 2.1. Ele continua com `Button variant="primary"`, `Modal`, `Menu` e o tema do `generateTheme` 1.x, e pode mudar em qualquer versão até lá (fixe a versão exata se depende dele). Os pontos de entrada levam `@experimental` no JSDoc e o README diz o mesmo. Um teste garante que nenhum componente web importa do alvo nativo.
