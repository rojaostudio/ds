---
"@rojaostudio/ds": minor
---

DataTableHeader reconstruído 1:1 com o Figma [RDS] (componente sem variantes, átomo `.filter-trigger`).

Novo:

- `count?: ReactNode` — contagem de resultados no fim das ferramentas ("128 resultados"), região viva (`aria-live="polite"`).
- `search.label` — nome acessível da busca, separado do placeholder (padrão "Buscar"; placeholder padrão "Buscar…"). A busca fica num `role="search"` com o mesmo nome.
- Linha própria de filtros ativos (`__active`) abaixo da barra: os Chips ("Status: Abertos", `removeLabel` "Remover filtro Status: Abertos") e "Limpar filtros" (Button ghost sm, `onClear`), que devolve o foco à busca. Vale também para um filtro só e para o arranjo compacto.
- Filtros rápidos num `role="group"` "Filtros rápidos". Gatilhos com `aria-expanded`/`aria-haspopup`; Esc fecha o menu, o Popover ou o Drawer e devolve o foco ao gatilho.
- Token de componente local `--data-table-header-search-min`: 320px, 200px abaixo de 1024 (variável `data-table-header/search-min` do Figma, ainda não publicada no Base Tokens).

Breaking (visual e de acessibilidade; nenhuma prop saiu, sem regra de codemod por não ser mecânico):

- O nome acessível da busca deixa de ser o placeholder: passe `search.label` ("Buscar produtos") se o nome antigo importava.
- Sai o Separator entre a busca e os filtros.
- Compacto: saem o ponto e o Badge sobre o IconButton. Com filtro ativo o gatilho vira Button fill com o ícone sliders e o número no rótulo ("2"); o nome continua "Filtros, 2 ativos" / "Categoria, Pago".
- Um filtro, expandido: o gatilho é Button com sliders à esquerda e o rótulo do filtro ("Status"), fill quando ativo (nome "Status, Abertos"); antes mostrava a opção escolhida com chevron à direita. Sai o IconButton X "Limpar filtros" ao lado.
- Os Chips dos filtros ativos saem da linha das ferramentas e vão para a linha `__active`; o texto passa a "Rótulo: opção". "Limpar filtros" sai de dentro do Popover e do Drawer.
- `__tools` alinha ao início (`justify-content: flex-start`; antes `flex-end`). A raiz vira coluna, com `__row` (ferramentas + ação) e `__active`.
- Classes: saem `__dot` e `__trigger`; `__count` agora é a contagem de resultados; `__search` é o wrapper `role="search"` (o `className` não vai mais no Input).
