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
