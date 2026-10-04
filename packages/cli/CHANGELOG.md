# rojao-ds

## 0.1.0-next.9

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.10

## 0.1.0-next.8

### Minor Changes

- Sai o comando `rojao-ds migrate`. O codemod passou a ser ferramenta interna do repositório (não é mais publicado no npm); a CLI fica só com o `init`.

## 0.1.0-next.7

### Minor Changes

- Escrita e leitura seguras no `init`, e `migrate` sem shell.

  - **Parse estrito** do `--recipe` (campos conhecidos, tipos, `$version` obrigatório e suportado) e da `--table` (`$schema` `rds-brand-table/1` obrigatório, tipos). Campo desconhecido ou valor fora do tipo é recusado com a lista dos problemas.
  - **Nunca através de link simbólico, nunca fora do projeto.** Antes de escrever, cada arquivo (tema, CLAUDE.md/AGENTS.md/.cursorrules) passa por `lstat` (link é recusado) e a pasta real (`realpath`) precisa estar dentro do projeto; nova opção `--allow-outside` para o tema. Arquivo novo é criado com `wx`. Uma recusa não deixa nada escrito pela metade.
  - **Marcador órfão ou mais de um bloco** `rojao-ds:start/end` no arquivo de regras: a CLI para sem escrever e diz o que corrigir.
  - O CLAUDE.md gerado usa o mesmo comando de instalação que o terminal mostra (gerenciador do lockfile, `@next` em pré-versão).
  - `migrate`: no Windows o npx roda como `npx-cli.js` do npm pelo próprio Node, sem `shell: true`; a versão do codemod é fixada no build (a lançada junto com a CLI), não mais `@next`.
  - README: seções "Antes de rodar", "Licença" e "Privacidade"; LICENSE com o parágrafo "Arquivos gerados".

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.9

## 0.1.0-next.6

### Patch Changes

- Enquanto a CLI é pré-versão, o `init` sugere `@rojaostudio/ds@next` (antes sugeria o pacote sem tag, que instala a 1.x) e o `migrate` chama `@rojaostudio/ds-codemod@next`. READMEs com `@next`.

## 0.1.0-next.5

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.8

## 0.1.0-next.4

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.7

## 0.1.0-next.3

### Minor Changes

- Novo pacote `@rojaostudio/ds-codemod` (bin `rojao-ds-codemod`): o codemod da migração 0.x/1.x → 2.0 ao alcance de quem consome, sem clonar este repositório.

  ```bash
  npx @rojaostudio/ds-codemod ./meu-app            # dry-run: plano e casos manuais com arquivo:linha
  npx @rojaostudio/ds-codemod ./meu-app --apply    # escreve, com um TODO(ds-2.0) acima de cada caso manual
  ```

  O motor e o mapa saíram de `packages/ds/scripts/migrate` e vivem só no pacote novo; a única dependência é o `ts-morph`. Dentro do repositório, `pnpm migrate:consumer <pasta>` continua funcionando e roda o mesmo código. O mapa ganha os renomes `FloatingStepper` → `Stepper` e `ImageCropModal` → `ImageCropDialog` (componentes, tipos e deep imports).

  A CLI ganha `npx rojao-ds migrate <pasta> [--apply]`, que só repassa os argumentos para `npx @rojaostudio/ds-codemod`: o `ts-morph` não entra na CLI.

## 0.1.0-next.2

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.6

## 0.1.0-next.1

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.5

## 0.1.0-next.0

### Minor Changes

- Novo pacote `rojao-ds`: `npx rojao-ds init` gera o tema da marca (`rds-theme.css`, para importar depois de `@rojaostudio/ds/styles/rds.css`) e o arquivo de regras da IA (`CLAUDE.md`, `.cursorrules` ou `AGENTS.md`, detectado pelo que já existe no projeto ou escolhido com `--target`). A marca vem de uma cor (perguntada ou `--color`), do `recipe.json` do site (`--recipe`) ou da tabela exportada do Figma (`--table`). Num arquivo de regras que já existe, escreve só o bloco entre `<!-- rojao-ds:start -->` e `<!-- rojao-ds:end -->` (acrescentado no fim ou substituído) e preserva o resto; o tema existente só é sobrescrito com confirmação ou `--yes`. Sem dependência além do `@rojaostudio/ds-core`.

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.4
