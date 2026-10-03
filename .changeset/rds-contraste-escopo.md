---
"@rojaostudio/ds-core": minor
---

Contraste e escopo no tema [RDS]:

- **`text/heading` legível no gerador.** `generateRdsTheme` deixa de usar a cor crua da marca no título: usa a cor da marca quando ela dá 4,5:1 sobre `surface/card` e `surface/page`, e senão o degrau da própria rampa mais perto dela, escurecendo, que dá (o amarelo `#ffd200` vira um ocre legível). No escuro, o mesmo clareando. `BrandDef.brand.heading` explícito que reprova é mantido, com aviso (`opts.warn`, padrão `console.warn`). `text/on/tint`, `text/on/action-tonal`, `text/on/lift-action` e `text/on/primary-strong` também passam a sair por contraste, e o card do modo brand passa a ser o degrau da rampa mais perto da placa que carrega a tinta (navy/800 na Rojão, como no Figma).
- **`rdsContrastReport(theme)`** e **`RDS_CONTRAST_PAIRS`**: mede uma lista curta e explícita de pares de texto (heading, body, muted, link, cada `text/on/*`, `text/error`) nos três modos e devolve os que reprovam. `rdsThemeFromTable(table, opts)` roda o relatório e só avisa, sem falhar.
- **`emitRdsCss` confere o escopo.** Novos `RDS_SCOPE_SELECTORS` e `RDS_TOKEN_SCOPE`: os seletores em que o `@rojaostudio/ds` redeclara os tokens de componente. `emitRdsCss` lança erro claro quando `scope`, `dark` ou `plate` deixaria os componentes com as cores da raiz (`.meu-escopo` sem `data-rds-scope`, `[data-theme="dark"]` solto), dizendo como resolver; `allowUncovered: true` pula. Um `dark` ancorado na raiz (`:root[data-theme="dark"]`, o next-themes com `attribute="data-theme"`) é usado como veio. Os padrões passam a incluir os atributos genéricos: `scope` `:root, .ds-scope, [data-rds-scope]`, `dark` `.dark, [data-rds-mode="dark"]`, `plate` `.ds-plate, [data-rds-plate]`.
- `figma/brands/rojao.rds.json`: a tabela da marca Rojão exportada do Figma, no repositório.
