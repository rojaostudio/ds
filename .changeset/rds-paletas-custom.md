---
"@rojaostudio/ds-core": patch
---

`generateRdsTheme` resolve as paletas da própria receita (`BrandDef.palettes`), tanto em hex quanto em escala completa. Antes, uma receita com cores próprias (por exemplo `primary: "minhacor-500"`) falhava com `unknown palette`, embora o gerador da 1.x aceitasse.
