---
"@rojaostudio/ds": patch
---

DataTableHeader: a busca, os filtros rápidos, os filtros e a visão ficam num grupo `tools` (`.rds-data-table-header__tools`), que é quem quebra linha; a barra não quebra mais e a ação (`actions`) fica fora dele, sempre no fim da primeira linha, presa à direita, como no Figma [RDS]. A ação é um IconButton neutral outline com Tooltip (ex.: engrenagem "Organizar categorias"); criar não é ação da barra, criar é o FAB.
