# @rojaostudio/ds-codemod

O codemod do [Rojão DS](https://ds.rojao.ai): leva um projeto do `@rojaostudio/ds` 0.x ou 1.x
direto para a 2.0.

**Uso interno.** Não é publicado no npm: roda de dentro deste repositório, nos projetos do Rojão Studio.

```bash
cd C:/_ww2/ds
pnpm migrate:consumer ../meu-app            # dry-run: mostra o plano, não escreve nada
pnpm migrate:consumer ../meu-app --apply    # escreve
```

## Antes de rodar

O codemod **altera arquivos do seu projeto** com `--apply`: código, `package.json`, CSS global,
`.npmrc` e `next.config`.

- Rode numa **working tree limpa** (tudo commitado). Fora do git ou com alterações pendentes, o
  `--apply` se recusa, a não ser com `--force`: o diff da migração não pode se misturar ao seu.
- Rode primeiro sem `--apply` (dry-run) e leia o plano.
- Depois do `--apply`, **revise o `git diff`** antes de instalar e de fazer commit. O codemod não
  roda `install` nem build.
- Ele não segue links simbólicos, não escreve fora da pasta, grava cada arquivo de forma atômica e
  nunca sobrescreve um `ds-theme.css` que já exista.

## O que ele faz

- **Código (1.x → 2.0):** reescreve imports, componentes renomeados (`Modal` → `Dialog`,
  `FloatingStepper` → `Stepper`, `ImageCropModal` → `ImageCropDialog`…) e props mecânicas
  (`variant`/`color` → `tone`/`variant`, `helper` → `hint`…). O que precisa de uma pessoa
  (mudança de estrutura, valor dinâmico, prop sem equivalente) fica como está e entra no relatório
  com `arquivo:linha`; com `--apply`, ganha um comentário `TODO(ds-2.0): …` acima, com a quebra de
  linha do próprio arquivo (CRLF continua CRLF).
- **Tema (0.x → 1.x):** congela no repositório o CSS do tema de marca que está no `node_modules`
  do pacote 0.x (o tema saiu do pacote público). O `node_modules` é procurado da pasta para cima
  (monorepo com dependências içadas). Sem o pacote antigo instalado, recusa o `--apply` em vez de
  escrever um tema aproximado.
- **Projeto:** atualiza a versão no `package.json` (sempre o último arquivo escrito); tira do
  `.npmrc` só o registry do DS no GitHub Packages (`@rojaostudio:registry` / `@rojao:registry`; a
  linha do token sai só se nenhum outro escopo ainda apontar para lá); tira `@rojaostudio/ds` de
  `transpilePackages` (a chave sai só se a lista ficar vazia; lista em variável ou com spread vira
  caso manual); e acrescenta o `@source` do Tailwind quando faltar.
- **Vocabulário único de props (2.0.0-next):** um projeto que já está na 2.x (ou com `--from next`)
  passa só por esta etapa, sem mexer em `package.json`, tema ou CSS. `size="default"` → `md`,
  `tone="default"` → `neutral`, Card `surface` → `variant` (default → surface, tint → soft),
  Item `variant` default/muted → ghost/soft, Marker `variant` → `kind`, FileInput `variant` →
  `layout`, Bubble `variant` → `variant` + `tone` + `typing`, Badge `highlight` → `soft` + `accent`,
  Stat `tone` positive/negative → success/danger e `tone="muted"` → `muted`, FilterChip `active` →
  `pressed`, SidebarItem `active` → `current`, Sidebar `tone` sai (o escuro de marca é um `.ds-plate`
  em volta). Num projeto 1.x, as mesmas regras rodam depois das da 1.x.
- **Avisos:** wrappers deprecated que seguem no pacote (`Dropzone`, `SettingRow`…) e `IconButton`
  sem `Tooltip`. Só listados, nunca escritos.

Não roda `install` nem build, e não mexe no CSS global para acrescentar
`@import "@rojaostudio/ds/styles/rds.css"`: avisa a linha que falta.

### De onde o projeto vem

O modo sai do `package.json` da pasta: `0.x`/`1.x` → `--from 1.x`, `2.x` → `--from next`. Quando
ele não diz (pasta sem `package.json`, sem a dependência do DS, `workspace:*`, `latest`…), o
codemod não chuta: pede `--from`.

Rodar duas vezes não muda nada. No modo 1.x, um arquivo que já importa nomes que só existem na 2.0
(`Dialog`, `PasswordInput`, `ChoiceCardGroup`…) é pulado e listado. Uma migração interrompida
retoma do ponto em que parou, porque o `package.json` só muda depois que todo o resto foi escrito.

## Opções

| Opção | |
|---|---|
| `--apply` | escreve as mudanças (sem ela, é dry-run) |
| `--from 1.x` \| `--from next` | de onde o projeto vem; obrigatório quando o `package.json` da pasta não diz |
| `--force` | aplica fora do git ou com a working tree suja |
| `--verbose` | lista cada transformação automática |
| `--report <arquivo.json>` | grava o relatório completo em JSON |
| `--extensions <lista>` | extensões do código, separadas por vírgula (padrão: `ts,tsx,js,jsx,mjs,cjs,mts,cts`) |
| `--from-next` | o mesmo que `--from next` (mantido por compatibilidade) |
| `-h, --help` | ajuda |

Opção desconhecida é erro. Saída: `0` ok · `1` falha (argumento inválido, erro em algum arquivo,
`--apply` recusado) · `2` dry-run com bloqueio (o `--apply` seria recusado).

## Licença

MIT — veja [LICENSE](./LICENSE). A licença cobre o código; o nome e a marca Rojão não estão
licenciados, veja [TRADEMARK.md](https://github.com/rojaostudio/ds/blob/main/TRADEMARK.md).
As alterações que o codemod faz no seu projeto são suas, sem obrigação de aviso ou atribuição.

## Privacidade

Nada é coletado nem enviado. O codemod roda só na sua máquina e não acessa a rede: lê a pasta que
você passa (e, nas pastas acima dela, o `node_modules` e o lockfile), consulta o `git status` dela e
escreve só dentro dela. O `--report` grava o relatório onde você mandar, e só lá.
