---
'@rojaostudio/ds': minor
---

`FilterChipMenu`: filtro em pílula com menu de múltipla escolha, para uma categoria com muitas opções numa barra de lista (#47). Figma [RDS] 06/10: Forms/FilterChipMenu.

- A pílula é o FilterChip (32 de altura, 44 de toque, os mesmos tokens e o estado ligado) com um chevron; fechada mostra o valor: "Processo: Todos", "Processo: Laser", "Processo · 2". Liga enquanto há algo marcado.
- O menu (DropdownMenu) traz uma opção marcável por item, com a contagem à direita, e "Limpar" no fim. Marcar não fecha; Limpar desmarca tudo, fecha e devolve o foco à pílula.
- Acessível: `aria-haspopup="menu"` e `aria-expanded` na pílula, o valor no nome; itens `menuitemcheckbox`.
- `DropdownMenuCheckboxItem` novo (`checked`, `onCheckedChange`, `count`, `closeOnSelect`), e `count` também no `DropdownMenuItem` e no `DropdownMenuRadioItem`.
- Nenhum token novo.
