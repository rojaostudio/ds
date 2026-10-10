---
"@rojaostudio/ds": minor
---

Alert ganha `icon`, `iconTone` e `layout` (pedido do Taiq). `icon` troca o ícone do tom por um próprio, como um check. `iconTone` (`info` | `success` | `warning` | `danger`), só no tom `neutral`, pinta apenas o ícone com o `alert/<tom>/foreground` do estado, com 3:1 ou mais sobre a faixa neutra nos dois modos; a faixa, o título e o texto continuam neutros. Num Alert com outro tom o `iconTone` não faz nada. `layout="inline"` põe título e descrição na mesma linha como uma frase só, que quebra junto com as palavras quando não cabe; `stacked` continua o padrão. Uso: `icon={<CheckIcon />} iconTone="success" layout="inline" title="Você já pode vender:" description="PDV, Pix e pedidos no WhatsApp."`. Sem tokens novos. Exporta os tipos `AlertIconTone` e `AlertLayout`.
