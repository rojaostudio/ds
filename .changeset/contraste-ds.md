---
"@rojaostudio/ds": minor
---

Correções de contraste do Figma [RDS] (tokens extraídos de novo).

- **Tema:** papel novo `--border-error` (red/600 no claro, red/400 no escuro, red/300 na chapa). `--text-on-info` passa a preto (era branco sobre blue/500, 3,12:1) e `--chart-series-2` claro passa a orange/600.
- **Borda de erro dos campos:** `--input-border-error`, `--textarea-border-error`, `--select-border-error`, `--checkbox-control-border-error`, `--radio-control-border-error`, `--otp-slot-border-error`, `--file-input-area-border-error`, `--chip-input-border-error`, `--number-input-border-error`, `--color-input-border-error` e `--attachment-border-error` passam de `colors/state/error` para `border/error`. Na Rojão a cor não muda no claro; no escuro e na chapa a borda fica no vermelho claro, que passa 3:1 sobre o card.
- **Tabs:** o selo "em breve" (`--tabs-soon-text`) passa de `text/disabled` para `text/subtle`.
- **ChoiceCard:** a descrição do cartão escolhido (tile e preview) perde a opacidade de 70%. **FilterChip:** a contagem perde a opacidade de 60%. As duas ficam na cor cheia do token.
- Quem gera o tema de uma marca com `rdsThemeFromTable` precisa reexportar a tabela da marca (`figma/export-brand.js`) por causa do papel novo; a tabela antiga carrega com aviso até lá (ver `@rojaostudio/ds-core`).
