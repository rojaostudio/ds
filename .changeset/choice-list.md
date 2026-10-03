---
"@rojaostudio/ds": minor
---

ChoiceList, a lista densa de escolha única (#4), como no Figma [RDS] (Content/ChoiceList e `.choice-list/item`):
- `<ChoiceList value | defaultValue onValueChange aria-label>` com `<ChoiceListItem value title description media trailing disabled />`. Cada linha: mídia de 32 (Avatar ou Tile), nome, meta apagada e um valor à direita; recuo 12 16, borda só embaixo, 60 de altura com descrição (44 sem), dezenas na tela.
- Semântica de listbox: a lista tem um só ponto de Tab (`role="listbox"`, `aria-activedescendant`), cada linha é `role="option"` com `aria-selected`. Setas, Home e End andam pulando as desabilitadas; Enter, espaço ou clique escolhem. O título dá o nome da linha; a meta e o valor a descrevem; a mídia é decorativa.
- Estados: hover em `choice-list/item/background/hover`; a escolhida ganha o tint e uma faixa de 2 à esquerda (`choice-list/item/indicator`), sem hover; o anel de foco da linha ativa em `choice-list/focus/ring`; a desabilitada nos tokens `*/disabled`.
- 12 tokens novos na coleção Content, grupo `choice-list` (`--choice-list-*`), todos apontando para papéis do theme.
