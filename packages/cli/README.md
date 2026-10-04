# rojao-ds

A CLI do [Rojão DS](https://ds.rojao.ai): a sua marca vira o tema do design system e o arquivo de
regras que a IA (Claude Code, Cursor, outros agentes) lê para construir as telas.

```bash
npx rojao-ds@next init
```

Pergunta a cor da marca e escreve, na pasta atual:

- `rds-theme.css` — o tema da marca (claro, escuro e a placa de marca `.ds-plate`);
- `CLAUDE.md` — ou `.cursorrules` / `AGENTS.md`, o que já existir no projeto.

Depois:

```bash
pnpm add @rojaostudio/ds@next
```

```css
/* CSS raiz do app: o tema vem DEPOIS */
@import "@rojaostudio/ds/styles/rds.css";
@import "./rds-theme.css";
```

## Antes de rodar

- Rode na raiz do projeto, com o trabalho commitado: assim o `git diff` mostra exatamente o que a CLI
  escreveu, e desfazer é um `git checkout`.
- A CLI escreve só dois arquivos: o tema (`rds-theme.css`, ou o de `--out`) e o bloco entre os
  marcadores no arquivo de regras. Nada mais é tocado.
- Ela não escreve através de link simbólico, nem fora da pasta do projeto (salvo `--allow-outside`,
  e só para o tema). Se o arquivo de regras tiver um marcador órfão ou mais de um bloco, ela para sem
  escrever e diz o que corrigir.
- `--recipe` e `--table` são lidos como entrada de terceiro: campos desconhecidos, `$version`/`$schema`
  fora do formato e cores fora da lista branca (hex, `rgb()`, `rgba()`, `oklch()`) são recusados.
  Use arquivos que você mesmo baixou de ds.rojao.ai ou exportou do Figma.

## De onde vem a marca

| Opção | Entrada |
|---|---|
| `--color <hex>` | uma cor; o motor deriva o resto |
| `--recipe <arquivo>` | o `recipe.json` baixado em [ds.rojao.ai](https://ds.rojao.ai) |
| `--table <arquivo>` | a tabela da marca exportada do Figma [RDS] por `figma/export-brand.js` (vem no `@rojaostudio/ds-core`), formato `rds-brand-table/1` |

Sem nenhuma delas, a cor é perguntada no terminal.

## Opções

| Opção | |
|---|---|
| `-n, --name <nome>` | nome da marca (padrão: o do recipe/tabela, senão o do `package.json`) |
| `--target <alvo>` | `claude`, `cursor` ou `agents` (padrão: o arquivo de regras que já existir, senão `claude`) |
| `-o, --out <arquivo>` | onde escrever o tema (padrão: `rds-theme.css`) |
| `-y, --yes` | sobrescreve o tema sem perguntar |
| `--allow-outside` | deixa escrever o tema fora da pasta do projeto |
| `-h, --help` | ajuda |

O arquivo de regras nunca é sobrescrito: a CLI escreve só o bloco entre `<!-- rojao-ds:start -->` e
`<!-- rojao-ds:end -->`. Se o arquivo já existe sem o bloco, ele é acrescentado no fim; se já tem, só
o bloco é trocado e o resto do arquivo fica como está. Rodar de novo não duplica nada.

O tema (`rds-theme.css`) é sobrescrito, então pede confirmação. Sem terminal (CI, script) e sem
`--yes`, a CLI recusa e não escreve nada.

## Sem dependência

Node 20+. A única dependência é o motor, [`@rojaostudio/ds-core`](https://www.npmjs.com/package/@rojaostudio/ds-core):
a CLI é uma casca fina sobre `generateRdsTheme`, `rdsThemeFromTable`, `emitRdsCss` e `emitClaudeMd`.
Quem prefere script usa o motor direto.

## Licença

MIT — veja [LICENSE](./LICENSE). Os arquivos que a CLI gera no seu projeto (o tema CSS e o bloco entre
os marcadores no CLAUDE.md, AGENTS.md ou .cursorrules) são seus: não precisam de aviso de licença nem de
atribuição.

O nome e a marca (Rojão, `rojao-ds`, `@rojaostudio/*`) não estão na licença: veja
[TRADEMARK.md](https://github.com/rojaostudio/ds/blob/main/TRADEMARK.md).

## Privacidade

Nada é coletado nem enviado. A CLI não tem telemetria e não acessa a rede: lê os arquivos que você
aponta e escreve na pasta do projeto.
