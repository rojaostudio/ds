---
"@rojaostudio/ds": minor
---

Chart, como no Figma [RDS] (`dates` e barras com destino):
- `dates="edges" | "all"`: troca o `showAllDates`, que fica deprecado. O padrão passa a ser `edges` (primeira, meio e última data).
- `dateEvery={N}`: uma data a cada N pontos, com um tique em cada ponto (token `chart/tick`).
- `hrefs` (um por item) ou `onSelect(index)`: no bar, cada barra vira link ou botão, com o nome "<rótulo>: <valor>", hover em `chart/bar/hover` e anel de foco em `chart/focus/ring`. No column, clique ou Enter no gráfico escolhe o ponto. Na tabela visível, o rótulo vira link.
