---
"@rojaostudio/ds-core": minor
---

Modo print do tema, como no Figma [RDS] (issue #42, item 5).

- **`emitRdsCss` fecha o CSS com um bloco `@media print`:** o claro com os fundos em branco (`surface/page`, `card`, `panel`, `cover`, `muted`, `muted-strong`, `tint/*`, `band/base`, as superfícies de estado e `attention/*`) e as sombras (`shadow/ambient|key|strong`) transparentes. Bordas e textos ficam como no claro. O bloco vale para todos os seletores do tema, escopo, escuro e chapa: quem imprime de `.dark` ou de `.ds-plate` sai em papel branco.
- **Variáveis de tipografia de mídia:** o escopo claro declara `--media-type-<papel>-size` e `--media-type-<papel>-line` (`caption`, `small`, `body`, `label`, `title`), alias da tipografia de tela (`title` → `type/heading`) fora da impressão e 8/10, 9/12, 10/14, 12/16 e 18/24 pt dentro dela. Os componentes não as leem; são para a folha impressa do consumidor.
- **Exportados novos:** `rdsPrintMode(theme)`, `RDS_PRINT_WHITE`, `RDS_PRINT_TRANSPARENT` e `RDS_MEDIA_TYPE`.
- **`emitClaudeMd`** ganha uma linha sobre o modo print e as variáveis de mídia.

Quem lê o CSS emitido por bloco: agora são quatro (claro, escuro, chapa e o `@media print`), não três.
