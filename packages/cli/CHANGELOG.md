# rojao-ds

## 0.1.0-next.0

### Minor Changes

- Novo pacote `rojao-ds`: `npx rojao-ds init` gera o tema da marca (`rds-theme.css`, para importar depois de `@rojaostudio/ds/styles/rds.css`) e o arquivo de regras da IA (`CLAUDE.md`, `.cursorrules` ou `AGENTS.md`, detectado pelo que já existe no projeto ou escolhido com `--target`). A marca vem de uma cor (perguntada ou `--color`), do `recipe.json` do site (`--recipe`) ou da tabela exportada do Figma (`--table`). Não sobrescreve arquivo existente sem confirmar (`--yes` pula a pergunta). Sem dependência além do `@rojaostudio/ds-core`.

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.4
