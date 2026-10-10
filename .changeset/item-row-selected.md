---
'@rojaostudio/ds': minor
---

Item ganha a lista densa e a seleção, como no Figma [RDS] de 10/10 (#4).

- `variant="row"`: sem cantos, só o separador embaixo (`item/border`), recuo 12 × 16 no md e 8 × 16 no sm, mídia numa caixa de 48 ou 32, título e descrição numa linha cada com reticências; o valor vai no `trailing`. Para dezenas de linhas num painel lateral ou numa busca de cliente.
- `selected?: boolean`, em qualquer variante: fundo `item/selected/background` (surface/tint/subtle) e faixa de 3px no começo da linha em `item/selected/indicator` (text/action).
- `onSelect?: () => void`: a linha vira pressionável. O título é um `<button>` com a área de clique esticada sobre a linha toda, descrito pela descrição, com `aria-pressed` quando há `selected`; o anel de foco é desenhado na linha e o `action` continua um controle à parte. `aria-pressed` e não `listbox`/`option` porque cada linha segue um botão comum numa lista comum (a lista e o tamanho dela continuam anunciados), pode manter o próprio `action` e dispensa foco itinerante.
- Tokens novos: `--item-selected-background` e `--item-selected-indicator`.
