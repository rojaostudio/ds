---
"@rojaostudio/ds": minor
---

**`bleed`** (ds#134), para as faixas que rolam de lado chegarem à borda da tela em vez de serem cortadas na margem:

- **`<TabsList bleed>`:** a faixa devolve o respiro lateral da página (`--layout-content-padding-x`) com margem negativa e o põe por dentro; a primeira aba fica alinhada com o conteúdo e a rolagem corta na borda da tela. Com `trailing`, o respiro do fim vai depois dele.
- **`<DataTableHeader bleed>`:** abaixo de 1024, os filtros rápidos ganham uma linha própria que sangra do mesmo jeito; a busca, o filtro e a ação ficam onde estão. A partir de 1024 nada muda. Só uma das duas cópias aparece de cada vez, então o leitor de tela encontra o grupo uma vez.

Sem `bleed`, nada muda.
