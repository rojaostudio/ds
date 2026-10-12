---
"@rojaostudio/ds": minor
---

Pedidos de ds#127, aditivos:

- **Stat `loading`:** rótulo, valor e legenda viram Skeleton em linhas da mesma altura do texto, então o Stat fica com a altura do estado carregado (com e sem legenda e sparkline) e a grade não pula quando os números chegam. `aria-busy`; o rótulo continua para leitor de tela.
- **`ItemSkeleton` (novo):** uma linha de lista carregando, no formato do `Item variant="row"`: mesmo padding, mesma altura e a linha embaixo (a última do `ItemGroup` sai sem). `size` md | sm e `showMedia`, `showDescription`, `showTrailing`, `showDivider`. Escondido do leitor de tela: ponha `aria-busy` no `ItemGroup`.
- **`CardHeader size="lg"`:** o título em `type/heading` (24/30, peso do heading), para o cabeçalho de seção de um painel em que o conteúdo traz números grandes. A faixa da ação acompanha a linha do título. md e sm continuam vindo do Card.
- **Chart:** nada muda no código; uma série é `series` com um item. No Figma, o `showSeries2` desliga a segunda linha e a legenda dela.
