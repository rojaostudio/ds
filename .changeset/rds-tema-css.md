---
"@rojaostudio/ds": minor
---

Tema e CSS da 2.0:

- **Rojão um para um com o Figma.** `styles/rds/theme.css` passa a sair da tabela da marca `rojao` exportada do [RDS] Base Tokens (`ds-core/figma/brands/rojao.rds.json`, via `rdsThemeFromTable`), não mais da regra derivada. Mudam, entre outros: tints azuis (`surface/tint/*`), capa azul (`surface/cover` blue/700), `colors/accent/mark` azul, `text/on/accent` e `text/on/tint` navy, o card do modo brand navy/800, a secundária do escuro em azul. Entram as variáveis da marca (`--rojao-primary`, `--rojao-accent`…).
- **`base.css` não briga mais com `rds.css`.** Tudo do `base.css` (1.x, deprecated) vai para a camada `rds.legacy`, declarada antes de `rds.theme` nos dois arquivos: com os dois importados, vence o 2.0 nos 31 nomes em comum (`--surface-page`, `--text-muted`, `--border-default`, `--radius-card`, `--z-modal`, `--space-*`, `--toast-text`…) e a regra global `h1`–`h6` perde para o `Heading`. Os `@utility` e `@theme` do Tailwind seguem no topo; o anel de foco segue na camada `base` do Tailwind.
- **Escopos genéricos.** Os tokens de componente passam a ser redeclarados também em `[data-rds-scope]`, `[data-rds-mode]` e `[data-rds-plate]`, e o tema publicado troca para escuro também em `[data-rds-mode="dark"]` e para a placa em `[data-rds-plate]`. Uma seção `<section data-rds-mode="dark">` numa página clara repinta os componentes dentro dela.
