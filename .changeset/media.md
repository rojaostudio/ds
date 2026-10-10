---
"@rojaostudio/ds": minor
---

Componente novo `Media`: uma caixa de imagem ou vídeo numa proporção fixa, `<Media ratio="1:1" | "4:3" | "3:4" | "16:9" | "9:16" src alt fit="cover" | "contain" />`.

- Ocupa 100% do pai e a altura vem do aspect-ratio, então a imagem nunca distorce. Raio em `media/radius` (radius/card) e overflow hidden.
- O tipo exige `alt` ou `decorative`. Com `decorative`, a imagem leva alt="" e a caixa aria-hidden.
- Sem `src`, ou quando a imagem falha, mostra o fallback: fundo `media/background` (surface/muted) e o ícone de imagem quebrada centrado em `media/fallback` (text/subtle). No fallback com `alt`, a caixa vira role="img" com esse nome.
- Aceita `children` no lugar de `src` (next/image, picture, video) e uma prop `fallback` para trocar o ícone.
- Exporta `Media`, `MediaProps`, `MediaRatio` e `MediaFit`. Tokens novos na coleção Content: `media/background`, `media/fallback`, `media/radius`.
