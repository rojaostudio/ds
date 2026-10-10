---
"@rojaostudio/ds": minor
---

FAB: `count` e `countLabel`. Uma pílula depois do rótulo mostra o número em bold `tabular-nums` ("99+" acima de 99) e some com 0 ou undefined. O nome acessível inclui o número real: "Carrinho, 12 itens" (sem `countLabel`, "Carrinho, 12"). O `FABConfig` do `usePageFAB` aceita os dois e repassa. Tokens novos `fab/count/background` (o fundo da pílula, a 20%) e `fab/count/text`, ambos em `text/on/primary`.

O hover do FAB deixa de escurecer o fundo: `fab/cta/background/hover` passa a `colors/primary/default` e a sombra sobe de `elevation/raised` (repouso) para `elevation/overlay`, o que mantém o número da pílula acima de 4,5:1 no hover. A pílula tem 20 de altura e o número em `type/small` (14/20).
