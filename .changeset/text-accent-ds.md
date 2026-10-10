---
"@rojaostudio/ds": patch
---

`--heading-accent` (o `tone="accent"` do Heading e o `Heading.Mark` de um Heading neutro) passa de `colors/accent/default` para o papel novo `text/accent`, que garante 3:1 sobre page e card em qualquer tema gerado.

- **Tema padrão:** papel novo `--text-accent`. O destaque do Heading fica mais escuro no claro (#D95A00, era #FF6A00 a 2,9:1 sobre branco) e mais vivo no escuro (#FF6A00, era #FFB066); na chapa não muda.
- O destaque como texto é só para título grande (24px ou mais, ou 18,66px ou mais em negrito). Todos os níveis do Heading cabem nessa regra.
