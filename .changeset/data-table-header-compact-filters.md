---
"@rojaostudio/ds": minor
---

**DataTableHeader `compactFilters`** (ds#134): abaixo de 1024, onde ficam os filtros rápidos. `strip` (padrão) mantém a faixa à vista (de ponta a ponta com `bleed`). `drawer` tira os filtros rápidos da barra: o "Filtros" compacto abre um Drawer com eles no topo ("Filtros rápidos") e depois os outros filtros; `quickActiveCount` soma os rápidos ligados à contagem do botão. Use o `drawer` quando a lista quase nunca é filtrada, quando os rápidos são todos menus, ou quando a tela já tem outra faixa que rola. No Drawer, use FilterChips (não FilterChipMenu). A partir de 1024 nada muda.
