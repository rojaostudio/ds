---
"@rojaostudio/ds": minor
---

Banner ganha `tone="attention"` com `level` (`low` | `medium` | `high`; padrão `low`), para o que pede ação em breve, como o fim de um teste grátis (pedido do Taiq). O fundo vai do âmbar suave (`surface/warning`) ao âmbar cheio (`colors/state/warning`), nunca vermelho, e o `medium` fica no meio dos dois por `color-mix` (não existe papel de tema entre eles). Texto, destaque, ícone e × tomam a cor de texto do nível, com 4,5:1 ou mais em cada degrau, no claro e no escuro. O CTA (um Button em `action`) vira `outline` em low e medium e `fill` em high, desenhado nas cores da faixa; outra ação que não seja Button fica como veio. O layout continua trocando pela largura do contêiner, sem prop de tela. Tokens novos na coleção Blocks: `banner/attention/low/background`, `banner/attention/low/text`, `banner/attention/medium/text`, `banner/attention/high/background` e `banner/attention/high/text`. Exporta os tipos `BannerTone` e `BannerLevel`.
