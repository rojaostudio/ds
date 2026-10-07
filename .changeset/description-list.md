---
'@rojaostudio/ds': minor
---

`DescriptionList` + `DescriptionItem`: pares rótulo → valor (`<dl>`, cada par num `<div>` com `<dt>` e `<dd>`), item 2 da #42. Figma [RDS] 07/10: Content/DescriptionList.

- `layout`: `stacked` (rótulo em cima, o padrão) ou `inline` (rótulo numa coluna de 160, ou 104 no `sm`; no compacto, abaixo de 1024, vira empilhado).
- `density`: `md` (tela) ou `sm` (folha impressa, 12/16).
- `columns`: `1` (um par por linha) ou `'auto'` (colunas de no mínimo 300 que quebram: 1 no celular, 2 num card).
- O valor aceita texto ou componente (Status, Badge, link).
- Tokens novos `--description-list-label`, `--description-list-value`, `--description-list-label-width-md` e `--description-list-label-width-sm`.
