---
"@rojaostudio/ds-core": minor
---

`emitClaudeMd` passa a descrever a 2.0: `@rojaostudio/ds/styles/rds.css` mais o tema gerado (importado depois), componentes com CSS próprio importados de `@rojaostudio/ds/components/<nome>`, os papéis do tema [RDS] (`--surface-card`, `--text-on-primary`…) com as cores claro/escuro da marca e os tokens de fundação (`--space-*`, `--radius-*`, `--type-*`). Saem Tailwind, `base.css`, a classe `theme-<nome>` e o mapeamento para shadcn. Aceita também a tabela do Figma (`RdsBrandTable`) e as opções `theme`, `cssFile` (padrão `rds-theme.css`) e `target`.
