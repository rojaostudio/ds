# @rojaostudio/ds-codemod

O codemod do [Rojão DS](https://ds.rojao.ai): leva um projeto do `@rojaostudio/ds` 0.x ou 1.x
direto para a 2.0.

```bash
npx @rojaostudio/ds-codemod ./meu-app            # dry-run: mostra o plano, não escreve nada
npx @rojaostudio/ds-codemod ./meu-app --apply    # escreve
```

Com a CLI do DS, é o mesmo comando:

```bash
npx rojao-ds migrate ./meu-app [--apply]
```

## O que ele faz

- **Código (1.x → 2.0):** reescreve imports, componentes renomeados (`Modal` → `Dialog`,
  `FloatingStepper` → `Stepper`, `ImageCropModal` → `ImageCropDialog`…) e props mecânicas
  (`variant`/`color` → `tone`/`variant`, `helper` → `hint`…). O que precisa de uma pessoa
  (mudança de estrutura, valor dinâmico, prop sem equivalente) fica como está e entra no relatório
  com `arquivo:linha`; com `--apply`, ganha um comentário `TODO(ds-2.0): …` acima.
- **Tema (0.x → 1.x):** congela no repositório o CSS do tema de marca que está no `node_modules`
  do pacote 0.x (o tema saiu do pacote público). Sem o pacote antigo instalado, recusa o `--apply`
  em vez de escrever um tema aproximado.
- **Projeto:** atualiza a versão no `package.json`, limpa o registry do GitHub Packages do `.npmrc`,
  remove `transpilePackages` e acrescenta o `@source` do Tailwind quando faltar.
- **Vocabulário único de props (2.0.0-next):** um projeto que já está na 2.x (ou com `--from-next`)
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

## Opções

| Opção | |
|---|---|
| `--apply` | escreve as mudanças (sem ela, é dry-run) |
| `--verbose` | lista cada transformação automática |
| `--report <arquivo.json>` | grava o relatório completo em JSON |
| `--from-next` | só o vocabulário de props (automático quando o `package.json` já diz 2.x) |
| `-h, --help` | ajuda |

Rode numa working tree limpa e revise o `git diff` antes de instalar.
