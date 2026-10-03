# `@rojaostudio/ds/generate` — motor de tema

Motor **puro** (sem `fs`, roda no browser e no servidor) que transforma uma
`BrandDef` (decisão de marca) em tokens semânticos e CSS. É a base do app gerador
(ds.rojao.ai) e do consumo em runtime por outros produtos (ex.: o um produto consumidor aplica a
cor da loja na Linkpage).

## Importar

```ts
import { generateTheme, emitCss, buildScale, onColor } from "@rojaostudio/ds/generate";
import type { BrandDef, TokenMap, Scale } from "@rojaostudio/ds/generate";
```

> Consumidores Next: incluir `@rojaostudio/ds` em `transpilePackages` (os entrypoints
> apontam pra `.ts`, transpilados pelo app — não há build pré-publicado).

## API

### `generateTheme(def: BrandDef): GenResult`
`{ supported, light: TokenMap, dark: TokenMap }`. `TokenMap` é `Record<string,string>`
de CSS custom properties (`--brand-primary`, `--surface-page`, …). O bloco `dark`
só traz o que MUDA vs o light.

### `emitCss(def: BrandDef): string`
Gera o `.theme-<name>.css` formatado (light + dark). Usado no build dos temas
curados (`pnpm build:themes`) e no export do gerador.

### Cor de marca custom (#28)
Quando uma `brand` color é um **hex** (`#d4476a`) em vez de ref de paleta curada
(`teal-500`), o motor deriva o que o recipe não trouxe:

- **`buildScale(hex): Scale`** — escala 50–900 que mantém o matiz e **crava a cor
  original** no step de lightness mais próximo (o usuário sempre vê a SUA cor).
- **`onColor(bg, scale?): string`** — texto de maior contraste WCAG sobre a cor
  (resolve `--brand-on-primary` legível inclusive em tons médios saturados).
- **`brandTones(hex)`** — `{ hover, on }` derivados, usados internamente pelo motor.

Refs de paleta curada seguem o caminho normal — `generateTheme` não muda os 6
temas existentes (garantido por `pnpm validate:themes`).

## Garantias
- Puro e determinístico (mesma entrada → mesma saída).
- Sem dependências nativas; o build script (`fs`) vive em `scripts/`, fora do core.
- Testes: `generate/__tests__/*` (`pnpm test`).

## Tema de uma marca do Figma [RDS] (um para um)

Uma marca desenhada no [RDS] Base Tokens (um modo da coleção `base`) vira tema sem regra nenhuma no meio: cada papel aponta para o primitivo que o Figma escolheu.

1. **Exportar a tabela da marca.** Rode `figma/export-brand.js` (vem no pacote) dentro do arquivo [RDS] Base Tokens, pelo console de plugin ou por um agente com o MCP do Figma, com `BRAND` no nome do modo. Salve o retorno como JSON no projeto (ex.: `brand/<marca>.rds.json`).
2. **Gerar o CSS por script:**

```ts
import { readFileSync, writeFileSync } from "node:fs";
import { emitRdsCss, rdsThemeFromTable } from "@rojaostudio/ds-core/generate";

const table = JSON.parse(readFileSync("brand/minha-marca.rds.json", "utf8"));
writeFileSync("app/theme.css", emitRdsCss(rdsThemeFromTable(table)));
```

Importe o CSS gerado depois de `@rojaostudio/ds/styles/rds.css`. Mudou a marca no Figma: exporte de novo e rode o script.

Papel novo no tema do Figma (ex.: `border/error`) pede exportar a tabela de novo. Até lá, uma tabela exportada antes dele ainda carrega: `rdsThemeFromTable` toma o papel do token para o qual o Figma o aponta em cada modo (`border/error` → `colors/state/error` no claro, `colors/state/error-strong` no escuro, `text/error` na chapa) e avisa pedindo a reexportação. Qualquer outro papel ausente falha.

`generateRdsTheme(def)` continua para quem só tem uma cor (sem Figma): ele deriva os papéis pela regra da marca Rojão.

O tema da Rojão publicado em `@rojaostudio/ds/styles/rds/theme.css` sai assim, da tabela `figma/brands/rojao.rds.json`. O que o gerador ainda desenha diferente dela está fixado em `__tests__/rds-rojao-table.test.ts` (snapshot).

### Contraste

`rdsContrastReport(theme)` mede os pares de texto principais (`RDS_CONTRAST_PAIRS`: heading e body sobre page e card, muted e link sobre card, cada `text/on/*` sobre o seu fundo, `text/error` sobre `surface/error`) nos três modos e devolve os que ficam abaixo de 4,5:1. Cor com alfa não é medida. `rdsThemeFromTable` roda o relatório e só avisa (`opts.warn`, padrão `console.warn`): a tabela é o Figma um para um.

Marcas que não são texto pedem 3:1 (WCAG 1.4.11). No gerador, `border/error` (a borda do campo com erro) parte do vermelho de estado no claro, de `error-strong` no escuro e do vermelho claro na chapa, e anda na rampa vermelha até passar 3:1 sobre `surface/card`, que é o fundo do campo. `chart/series/1` parte do 600 da primária (400 no escuro) e anda na rampa da primária até passar 3:1 sobre o card. Na chapa, `surface/card` é o 800 da primária quando ele carrega a tinta da chapa em 4,5:1; senão, o degrau mais perto da chapa que carrega.

No gerador, `text/heading` é a cor da marca quando ela passa sobre `surface/card` e `surface/page`; quando não passa (um amarelo), é o degrau da própria rampa mais perto dela, escurecendo, que passa. No escuro, o mesmo clareando. Um `BrandDef.brand.heading` explícito que reprova fica como foi dado, com aviso. Os `text/on/*` são escolhidos por contraste.

### Escopo próprio

`emitRdsCss(theme, { scope, dark, plate })` confere cada seletor contra `RDS_SCOPE_SELECTORS`, os seletores em que o `@rojaostudio/ds` redeclara os tokens de componente (`:root`, `.ds-scope`, `[data-rds-scope]`, `.dark`, `[data-rds-mode]`, `.ds-plate`, `[data-rds-plate]`), e lança erro quando um deles deixaria os componentes com as cores da raiz. Use `.meu-escopo[data-rds-scope]`, ou ancore na raiz (`dark: ':root[data-theme="dark"]'`, o next-themes com `attribute="data-theme"`). `allowUncovered: true` pula a conferência, para um tema lido só pelo seu CSS.
