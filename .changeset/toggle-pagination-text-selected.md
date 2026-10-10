---
"@rojaostudio/ds": patch
---

`toggle/label/pressed`, `toggle/border/pressed` e `pagination/item/label/current` passam a apontar para `text/selected`. No tema padrão nada muda de cor (vale `colors/primary/default`); num tema gerado com primária clara, o texto, o ícone e a borda do Toggle pressionado e o número da página atual descem para um degrau escuro da primária e passam 4,5:1 sobre o tint da seleção.
