---
"@rojaostudio/ds-core": minor
---

`rdsThemeFromTable(table)`: gera o tema de uma marca do Figma [RDS] um para um. A tabela vem de `figma/export-brand.js` (incluído no pacote), que exporta, modo a modo, o primitivo que cada papel usa no Figma e a cor dele. Falta de papel ou primitivo desconhecido falham listando tudo. `generateRdsTheme` continua para quem só tem uma cor.
