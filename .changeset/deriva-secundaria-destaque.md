---
"@rojaostudio/ds-core": minor
---

O motor passa a derivar o destaque quando a receita não o traz. Antes, uma receita só com `brand.primary` devolvia a própria primária também em `colors/accent/default`, e um gerador mostrava o mesmo hex em todos os campos.

Agora, em OKLCH e com regra fixa (`generate/derive.ts`), o destaque gira a matiz da primária 150° (o complemento menos 30°), com L 0,72 e croma entre 0,14 e 0,22; uma primária neutra usa a matiz fixa 55°. Mesma entrada, mesma saída, e todos os pares do relatório de contraste passam em claro, escuro, chapa e impressão.

Sem `secondary` na receita, a ação continua sendo exatamente a cor de entrada, como antes.

Novos na API: `rdsBrandColors(def)` (as três cores de que o tema sai e, em `source`, se cada uma veio da receita, da própria primária ou foi derivada) e `deriveAccent(hex)`. Uma cor que a receita traz continua sendo usada como veio; o tema `rojao` sai idêntico.
