---
"@rojaostudio/ds": minor
---

**PhoneInput** vira um campo só, como no Figma: à esquerda o botão do país (bandeira, DDI e chevron), uma divisória e o número, sem prefixo. O DDI aparece uma vez. Rótulo, dica e erro são do campo inteiro, e o erro pinta a borda toda.

- **Lista de países:** busca fixa no topo, grupos "Sugeridos" (Brasil, Portugal e Estados Unidos; troque com `preferredCountries`) e "Todos os países", com bandeira, nome e DDI à direita. Filtra por nome ou código ("port", "+351"). Escolher fecha a lista e leva o foco ao número. Abaixo de 1024 a lista abre numa gaveta.
- **Colar:** "+55 11 9…", "5511…", "011 9…" e "0 11 9…" ficam como o número nacional; colar outro DDI troca o país. O `defaultValue` com zero na frente deixou de virar "+55011…".
- **API nova:** `error` booleano + `errorMessage`, `size` (`sm` | `md`), `defaultCountry`, `preferredCountries`, `countries`, `countryLabel` e `renderFlag`. O botão do país se chama "País do <rótulo>: Brasil, +55".
- **Depreciados:** `helper` (use `hint`) e `error` como texto (use `errorMessage`). Continuam funcionando, com um aviso em desenvolvimento, e saem na 3.0.
