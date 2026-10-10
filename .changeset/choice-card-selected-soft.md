---
"@rojaostudio/ds": minor
---

ChoiceCard: o selecionado fica leve, como no Figma [RDS] de 07/10. Antes era uma chapa cheia na cor da marca, que brigava com o botão primário do diálogo.

- Selecionado = borda de 2 px na marca + fundo `surface/tint/subtle`, título e descrição nos tons normais, ícone na marca sobre `surface/card`, radio (anel e ponto) na marca.
- Vale para os três layouts; o check do tile passa a ser cheio na marca com o glifo em `text/on/primary`.
- Tokens `choice-card/*/selected`, `choice-card/radio/dot` e `choice-card/check/*/tile` mudam de alvo; a chapa cheia fica só para o ToggleGroup.
