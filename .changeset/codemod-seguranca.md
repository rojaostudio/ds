---
"@rojaostudio/ds-codemod": minor
---

Codemod mais seguro e idempotente, depois da auditoria.

**Breaking:**

- `--from 1.x|next` passa a ser **exigido** quando o `package.json` da pasta não diz a versão do DS (pasta sem `package.json`, sem a dependência, `workspace:*`, `latest`…). Antes o codemod assumia 1.x. `--from-next` continua como sinônimo de `--from next`.
- `--apply` se **recusa** a rodar fora do git ou com a working tree suja. Use `--force` para aplicar mesmo assim.
- Opção desconhecida agora é erro (`parseArgs` estrito). Códigos de saída: `0` ok, `1` falha (inclusive erro em algum arquivo, que antes só virava aviso), `2` dry-run com bloqueio.

**Configuração alheia:**

- `.npmrc`: sai só `@rojao:registry` / `@rojaostudio:registry` do GitHub Packages. A linha `//npm.pkg.github.com/:_authToken` sai só se nenhum outro escopo ainda apontar para lá; senão fica, com aviso.
- `next.config`: sai de `transpilePackages` só `@rojaostudio/ds` / `@rojao/ds`; a chave sai só se a lista ficar vazia. Lista em variável, com spread ou atribuída fora do objeto vira caso manual. Vale para `.ts`, `.mts`, `.js`, `.mjs` e `.cjs`.

**Idempotência:** rodar duas vezes não muda nada. No modo 1.x, arquivo que já importa nomes que só existem na 2.0 (`Dialog`, `PasswordInput`, `ChoiceCardGroup`…) é pulado e listado. O código é escrito primeiro e o `package.json` por último (e não é escrito se algum arquivo falhou), então uma migração interrompida retoma no modo 1.x. TODOs repetidos na mesma linha não se acumulam mais.

**Segurança:** escrita atômica (arquivo temporário na mesma pasta + rename); nada é lido ou escrito através de link simbólico nem fora da pasta; um `ds-theme.css` existente bloqueia o `--apply` em vez de ser sobrescrito; o `git` roda com `core.fsmonitor=false`, `safe.directory` zerado, sem as variáveis `GIT_*` e com a saída capturada.

**Robustez:** extensões `.ts .tsx .js .jsx .mjs .cjs .mts .cts` (ou `--extensions`); TODOs e imports novos respeitam a quebra de linha do arquivo (CRLF continua CRLF); o tema do 0.x e o `@source` do Tailwind procuram o `node_modules` da pasta para cima (monorepo içado); o gerenciador de pacotes vem do lockfile mais próximo (subindo) ou do `npm_config_user_agent`; a árvore é varrida uma vez só; no dry-run com `--report`, a mensagem diz "nada foi escrito no projeto; relatório em X".

README com "Antes de rodar", "Licença" e "Privacidade" (nada é coletado nem enviado); o LICENSE do codemod ganha o parágrafo "Arquivos gerados".
