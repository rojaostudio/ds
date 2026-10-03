---
"@rojaostudio/ds-core": minor
---

Correções de contraste do Figma [RDS] no tema: papel novo `border/error` e gerador que escolhe as marcas por contraste.

- **Papel novo `border/error`** (`--border-error`), a borda do campo com erro. No Figma: claro → `colors/state/error`, escuro → `colors/state/error-strong`, chapa → o vermelho claro (`text/error` do escuro). Na Rojão: red/600, red/400 e red/300.
- **Tabelas de marca exportadas antes desta versão precisam ser reexportadas** com `figma/export-brand.js`, porque não têm o papel novo. Até lá elas continuam carregando: `rdsThemeFromTable` toma `border/error` do token para o qual o Figma o aponta em cada modo (a mesma cor que a reexportação traria) e avisa pelo `opts.warn` pedindo a reexportação. Qualquer outro papel ausente continua falhando.
- **Tabela da Rojão reexportada:** `text/on/info` passa a preto (era branco sobre blue/500, 3,12:1) e `chart/series/2` claro passa a orange/600. O relatório de contraste da tabela da Rojão fica vazio.
- **`generateRdsTheme`:** `border/error` parte do vermelho de estado (claro), de `error-strong` (escuro) e do vermelho claro (chapa) e anda na rampa vermelha até 3:1 sobre `surface/card`, o fundo do campo (WCAG 1.4.11). `chart/series/1` parte do 600 da primária (400 no escuro) e anda na rampa até 3:1 sobre o card; `chart/series/2` claro passa a orange[600]. Na chapa, `surface/card` é o 800 da primária quando ele carrega a tinta em 4,5:1 (senão, o degrau mais perto da chapa que carrega).
