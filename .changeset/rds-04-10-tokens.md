---
"@rojaostudio/ds": patch
"@rojaostudio/ds-core": minor
---

Sincronia com o Figma [RDS] de 04/10/2026: tokens e tabela da Rojão extraídos de novo.

- **Muda aparência:** o hover do Button danger (`colors/state/error-strong`) no escuro e na chapa passa de red/400 (`#ff6c5c`) para red/700 (`#990001`) na tabela da Rojão (`figma/brands/rojao.rds.json`) e no `styles/rds/theme.css`. O claro continua red/800. O rótulo branco sobre o hover sobe de 2,78:1 para AA.
- No Figma, esse papel aponta direto para o primitivo no escuro e na chapa (`@color:red/700` no `theme.txt`), não mais para um token do `base`. O `export-brand.js` e o extrator já lidavam com isso: a tabela reextraída bate byte a byte com o Figma.
- `ROLES` ganha uma fonte nova, `"p"`: um primitivo fixo, o mesmo para toda marca. É o caso de `colors/state/error-strong` no escuro e na chapa. `generateRdsTheme` passa a usar red/700 direto (antes, andava na rampa até carregar o rótulo e chegava ao mesmo valor), e o gerador e a tabela da Rojão deixam de divergir nesse papel (snapshot atualizado).
