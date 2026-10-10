---
"@rojaostudio/ds-core": minor
---

Papel novo `text/accent` (`--text-accent`) no tema do Figma [RDS]: o texto de destaque, só para título grande (24px ou mais, ou 18,66px ou mais em negrito; nunca rótulo nem texto corrido).

- **`generateRdsTheme`:** `text/accent` é `colors/accent/default` de cada modo. Quando não dá 3:1 (contraste de texto grande) sobre `surface/page` e `surface/card`, desce pela rampa do destaque, afastando-se das superfícies, até o primeiro degrau que passa. Na chapa parte do destaque da chapa e mede sobre a chapa e o card dela. Um destaque laranja, amarelo ou ciano no claro sai num degrau mais escuro.
- **Relatório de contraste:** `RDS_LARGE_TEXT_PAIRS` (novo, exportado) mede `text/accent` sobre page e card a 3:1, e `rdsContrastReport` passa a incluí-lo.
- **Tabela da marca padrão** (`figma/brands/rojao.rds.json`): `text/accent` = flare/800 no claro, flare/700 no escuro e o destaque da chapa na chapa (primitivo flare/800 incluído).
- **Tabelas exportadas antes desta versão** continuam carregando: `rdsThemeFromTable` toma `text/accent` de `colors/accent/default` de cada modo e avisa pelo `opts.warn` pedindo a reexportação com `figma/export-brand.js`.
