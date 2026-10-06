---
"@rojaostudio/ds": minor
---

**Switch:** `size` e `labelPosition`, como no Figma de 04/10/2026.

- `size="md" | "sm"` (padrão `md`, o de antes). O `sm` é só o controle e o texto: sem padding em cima e embaixo (24 de altura), com a largura do conteúdo (`fit-content`). Serve para o cabeçalho do Card e para uma linha de 24. O alvo de toque de 44 continua: uma camada invisível em volta do controle (pseudo-elemento, 10 em cima e embaixo, 4 nos lados), que não ocupa layout. Substitui o override que zerava o padding vertical.
- `labelPosition="end" | "start"` (padrão `end`, o de antes). No `start`, o rótulo vem antes e o controle fica na borda direita: no md, o rótulo preenche; no sm, o controle vem logo depois do texto. O hint e o erro perdem o recuo do controle e se alinham ao rótulo. Só muda a ordem visual: o DOM, a ordem de Tab e o nome acessível ficam iguais.
- Tipos novos no barril: `SwitchSize` e `SwitchLabelPosition`.
