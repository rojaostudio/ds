---
"@rojaostudio/ds": minor
---

DataTableHeader com o arranjo compact do Figma [RDS]: a barra é um contêiner de tamanho (`container-type: inline-size`) e, abaixo de 1024 de largura da própria barra (`@container (max-width: 1023px)`, o mesmo corte da SavingBar), troca de arranjo; o `@media (min-width: 768px)` saiu. Sem prop de tela.

- **Compact:** a busca aceita 200 (`min-width: min(200px, 100%)`); o filtro vira um IconButton outline neutral md (44 × 44) com o ícone sliders e Tooltip com o rótulo, abrindo o mesmo Drawer ou Popover de antes. Com filtro ativo, um ponto (um filtro, na cor do Badge neutral) ou um Badge neutral com o número (vários), ambos `aria-hidden`; o estado vai no nome acessível ("Categoria, Pago", "Filtros, 3 ativos"). A 390, busca, filtro e uma ação IconButton cabem numa linha.
- **Expanded (1024 para cima):** igual a antes: Separator vertical e o Button com rótulo ("Status", "Filtros · N"); a busca segue com mínimo de 320.

O arranjo agora segue a largura da barra, não a da tela: uma barra estreita numa tela larga (painel, coluna) fica compact.
