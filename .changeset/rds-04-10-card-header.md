---
"@rojaostudio/ds": minor
---

**Card:** a ação do cabeçalho segue o `.card/header` do Figma de 04/10/2026.

- **Muda aparência:** com `align="start"`, a ação fica numa faixa da altura da linha do título (`type/label/line`, 24, no md; `type/small/line`, 20, no sm), centrada nela, com ou sem descrição. Antes, ela se alinhava ao topo do cabeçalho. Um IconButton de 44 ou um Button sm de 36 transborda a faixa por igual, em cima e embaixo, e nada o corta. Com `align="center"`, nada muda.
- `action` aceita também o Switch (use `size="sm"`).
