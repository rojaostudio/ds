---
"@rojaostudio/ds": minor
---

Modo print no tema publicado (issue #42, item 5). `styles/rds/theme.css` ganha o bloco `@media print` do `ds-core`: na impressão, fundos brancos, sem sombra, bordas e textos do claro, inclusive em `.dark` e `.ds-plate`. Entram as variáveis `--media-type-<papel>-size|line` (`caption`, `small`, `body`, `label`, `title`), a tipografia de tela na tela e 8/10, 9/12, 10/14, 12/16 e 18/24 pt no papel, para a folha impressa do consumidor. Os componentes mantêm a própria tipografia.
