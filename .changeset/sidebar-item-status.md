---
"@rojaostudio/ds": minor
---

SidebarItem ganha `status` (`{ tone, label }`, tons do Status), o selo de estado à direita, exclusivo com o contador (#53): aberta, um Status `sm` com o rótulo; recolhida, o ponto de 8 no canto do ícone na cor do tom. O rótulo entra no nome acessível nas duas larguras ("Caixa, aberto"). Os tipos não deixam passar `status` junto de `count`. Tokens novos na coleção Navigation: `sidebar/dot/success`, `sidebar/dot/warning` e `sidebar/dot/info` (os pontos `neutral` e `danger` já existiam). Exporta o tipo `SidebarItemStatus`.
