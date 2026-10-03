# rojao-ds

A CLI do [Rojão DS](https://ds.rojao.ai): a sua marca vira o tema do design system e o arquivo de
regras que a IA (Claude Code, Cursor, outros agentes) lê para construir as telas.

```bash
npx rojao-ds init
```

Pergunta a cor da marca e escreve, na pasta atual:

- `rds-theme.css` — o tema da marca (claro, escuro e a placa de marca `.ds-plate`);
- `CLAUDE.md` — ou `.cursorrules` / `AGENTS.md`, o que já existir no projeto.

Depois:

```bash
pnpm add @rojaostudio/ds
```

```css
/* CSS raiz do app: o tema vem DEPOIS */
@import "@rojaostudio/ds/styles/rds.css";
@import "./rds-theme.css";
```

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

MIT — veja [LICENSE](./LICENSE). O nome e a marca não: veja
[TRADEMARK.md](https://github.com/rojaostudio/ds/blob/main/TRADEMARK.md).
