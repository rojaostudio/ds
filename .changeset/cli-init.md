---
"rojao-ds": minor
---

Novo pacote `rojao-ds`: `npx rojao-ds init` gera o tema da marca (`rds-theme.css`, para importar depois de `@rojaostudio/ds/styles/rds.css`) e o arquivo de regras da IA (`CLAUDE.md`, `.cursorrules` ou `AGENTS.md`, detectado pelo que já existe no projeto ou escolhido com `--target`). A marca vem de uma cor (perguntada ou `--color`), do `recipe.json` do site (`--recipe`) ou da tabela exportada do Figma (`--table`). Num arquivo de regras que já existe, escreve só o bloco entre `<!-- rojao-ds:start -->` e `<!-- rojao-ds:end -->` (acrescentado no fim ou substituído) e preserva o resto; o tema existente só é sobrescrito com confirmação ou `--yes`. Sem dependência além do `@rojaostudio/ds-core`.
