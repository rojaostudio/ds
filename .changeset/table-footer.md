---
'@rojaostudio/ds': minor
---

`TableFooter`: a linha de totais no fim da Table (`tfoot`), item 1 da #42. Figma [RDS] 06/10: `.table/cell` `type=footer`.

- 48 de altura, fundo de painel, texto mais forte que o corpo (600), uma linha em cima e nenhuma embaixo.
- O rótulo vai num `TableHead scope="row"` ("Total"); as somas em `TableCell align="end"` (tabular).
- Tokens novos `--table-footer-background` e `--table-footer-label`.
