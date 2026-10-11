---
"@rojaostudio/ds": minor
---

A barra do `DataTableHeader` passa a ser inteira em 44 por padrão (era 32), sem eixo de tamanho: a barra nunca mistura alturas.

- **DataTableHeader:** a busca vira `Input` md; o gatilho de filtros (Button ou IconButton), o "Limpar filtros" e os Chips dos filtros ativos vão para md. Os `FilterChip` e `FilterChipMenu` passados em `quickFilters` ficam com 44 sozinhos, sem mudar o código de quem usa. A ação (`actions`) é do consumidor: passe o `IconButton` em `size="md"`.
- **FilterChip** e **FilterChipMenu:** prop nova `size` (`sm` 32, o padrão, ou `md` 44, com 16 de respiro).
- **Chip:** prop nova `size` (`sm` 32, o padrão, ou `md` 44, com rótulo 14/20).
