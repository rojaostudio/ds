---
"rojao-ds": minor
---

Escrita e leitura seguras no `init`, e `migrate` sem shell.

- **Parse estrito** do `--recipe` (campos conhecidos, tipos, `$version` obrigatório e suportado) e da `--table` (`$schema` `rds-brand-table/1` obrigatório, tipos). Campo desconhecido ou valor fora do tipo é recusado com a lista dos problemas.
- **Nunca através de link simbólico, nunca fora do projeto.** Antes de escrever, cada arquivo (tema, CLAUDE.md/AGENTS.md/.cursorrules) passa por `lstat` (link é recusado) e a pasta real (`realpath`) precisa estar dentro do projeto; nova opção `--allow-outside` para o tema. Arquivo novo é criado com `wx`. Uma recusa não deixa nada escrito pela metade.
- **Marcador órfão ou mais de um bloco** `rojao-ds:start/end` no arquivo de regras: a CLI para sem escrever e diz o que corrigir.
- O CLAUDE.md gerado usa o mesmo comando de instalação que o terminal mostra (gerenciador do lockfile, `@next` em pré-versão).
- `migrate`: no Windows o npx roda como `npx-cli.js` do npm pelo próprio Node, sem `shell: true`; a versão do codemod é fixada no build (a lançada junto com a CLI), não mais `@next`.
- README: seções "Antes de rodar", "Licença" e "Privacidade"; LICENSE com o parágrafo "Arquivos gerados".
