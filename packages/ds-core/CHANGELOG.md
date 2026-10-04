# @rojaostudio/ds-core

## 1.1.0-next.9

### Minor Changes

- O motor valida a entrada antes de escrever (API pública: recipe, tabela do Figma e tema montado à mão).

  - **Cores em lista branca.** Toda cor emitida (valores de papel, `primitives` da tabela, `palettes` da receita, hex ou escala 50–900) só passa se for hex (`#rgb` a `#rrggbbaa`) ou `rgb()`/`rgba()`/`oklch()` fechados. Um valor que feche a regra CSS, puxe `url()` ou traga `;`, chaves ou quebra de linha é recusado com erro listando o campo (`RdsValidationError`).
  - **Nomes e fonte.** Nomes de variável e de primitivo (`vars`, chaves) em `^[a-z0-9]+(?:[/-][a-z0-9]+)*$`; a fonte mono sem aspas, `;`, chaves, `\` ou quebra de linha.
  - **`emitRdsCss` revalida** o tema inteiro e os seletores (`scope`, `dark`, `plate`) antes de interpolar qualquer coisa.
  - **`emitClaudeMd`**: a `description` vira uma linha só, sem `<`, `>`, crase ou marcador, com até 200 caracteres; nome, `cssFile`, `cssUrl` e o tema passam pela mesma validação, e o texto gerado nunca contém os marcadores `rojao-ds:start/end`. Nova opção `install`: o comando de instalação mostrado no setup (padrão `pnpm add @rojaostudio/ds`).
  - Exporta `isSafeColor`, `isSafeVarName`, `isSafeFont` e `RdsValidationError`.

  Um tema com valor fora da lista (ex.: `transparent` literal numa tabela) passa a falhar: use hex ou `rgb()`/`oklch()`.

## 1.1.0-next.8

### Minor Changes

- Correções de contraste do Figma [RDS] no tema: papel novo `border/error` e gerador que escolhe as marcas por contraste.

  - **Papel novo `border/error`** (`--border-error`), a borda do campo com erro. No Figma: claro → `colors/state/error`, escuro → `colors/state/error-strong`, chapa → o vermelho claro (`text/error` do escuro). Na Rojão: red/600, red/400 e red/300.
  - **Tabelas de marca exportadas antes desta versão precisam ser reexportadas** com `figma/export-brand.js`, porque não têm o papel novo. Até lá elas continuam carregando: `rdsThemeFromTable` toma `border/error` do token para o qual o Figma o aponta em cada modo (a mesma cor que a reexportação traria) e avisa pelo `opts.warn` pedindo a reexportação. Qualquer outro papel ausente continua falhando.
  - **Tabela da Rojão reexportada:** `text/on/info` passa a preto (era branco sobre blue/500, 3,12:1) e `chart/series/2` claro passa a orange/600. O relatório de contraste da tabela da Rojão fica vazio.
  - **`generateRdsTheme`:** `border/error` parte do vermelho de estado (claro), de `error-strong` (escuro) e do vermelho claro (chapa) e anda na rampa vermelha até 3:1 sobre `surface/card`, o fundo do campo (WCAG 1.4.11). `chart/series/1` parte do 600 da primária (400 no escuro) e anda na rampa até 3:1 sobre o card; `chart/series/2` claro passa a orange[600]. Na chapa, `surface/card` é o 800 da primária quando ele carrega a tinta em 4,5:1 (senão, o degrau mais perto da chapa que carrega).

## 1.1.0-next.7

### Minor Changes

- Contraste e escopo no tema [RDS]:

  - **`text/heading` legível no gerador.** `generateRdsTheme` deixa de usar a cor crua da marca no título: usa a cor da marca quando ela dá 4,5:1 sobre `surface/card` e `surface/page`, e senão o degrau da própria rampa mais perto dela, escurecendo, que dá (o amarelo `#ffd200` vira um ocre legível). No escuro, o mesmo clareando. `BrandDef.brand.heading` explícito que reprova é mantido, com aviso (`opts.warn`, padrão `console.warn`). `text/on/tint`, `text/on/action-tonal`, `text/on/lift-action` e `text/on/primary-strong` também passam a sair por contraste, e o card do modo brand passa a ser o degrau da rampa mais perto da placa que carrega a tinta (navy/800 na Rojão, como no Figma).
  - **`rdsContrastReport(theme)`** e **`RDS_CONTRAST_PAIRS`**: mede uma lista curta e explícita de pares de texto (heading, body, muted, link, cada `text/on/*`, `text/error`) nos três modos e devolve os que reprovam. `rdsThemeFromTable(table, opts)` roda o relatório e só avisa, sem falhar.
  - **`emitRdsCss` confere o escopo.** Novos `RDS_SCOPE_SELECTORS` e `RDS_TOKEN_SCOPE`: os seletores em que o `@rojaostudio/ds` redeclara os tokens de componente. `emitRdsCss` lança erro claro quando `scope`, `dark` ou `plate` deixaria os componentes com as cores da raiz (`.meu-escopo` sem `data-rds-scope`, `[data-theme="dark"]` solto), dizendo como resolver; `allowUncovered: true` pula. Um `dark` ancorado na raiz (`:root[data-theme="dark"]`, o next-themes com `attribute="data-theme"`) é usado como veio. Os padrões passam a incluir os atributos genéricos: `scope` `:root, .ds-scope, [data-rds-scope]`, `dark` `.dark, [data-rds-mode="dark"]`, `plate` `.ds-plate, [data-rds-plate]`.
  - `figma/brands/rojao.rds.json`: a tabela da marca Rojão exportada do Figma, no repositório.

## 1.1.0-next.6

### Minor Changes

- Receita `rojao`: `text/heading` no claro passa a ser o primário (navy-900, #1b2a4a) em vez do laranja (flare-700), como no Figma [RDS] (coleção base, modo `rojao`). As duplas do logo são azul e laranja, branco e laranja: o título padrão é azul no claro e branco no escuro e na chapa; o laranja fica para o tom `accent`. Muda aparência.

## 1.1.0-next.5

### Patch Changes

- O pacote `ds` passa a trazer o `THIRD_PARTY_NOTICES.md`, com as licenças do Lucide e do Feather (ícones), o aviso da marca Pix e a lista das dependências e fontes de terceiros. No `ds-core`, o exemplo de variável de marca nos comentários e no script de exportação passa a ser genérico (`marca/ciano`).

## 1.1.0-next.4

### Minor Changes

- `emitClaudeMd` passa a descrever a 2.0: `@rojaostudio/ds/styles/rds.css` mais o tema gerado (importado depois), componentes com CSS próprio importados de `@rojaostudio/ds/components/<nome>`, os papéis do tema [RDS] (`--surface-card`, `--text-on-primary`…) com as cores claro/escuro da marca e os tokens de fundação (`--space-*`, `--radius-*`, `--type-*`). Saem Tailwind, `base.css`, a classe `theme-<nome>` e o mapeamento para shadcn. Aceita também a tabela do Figma (`RdsBrandTable`) e as opções `theme`, `cssFile` (padrão `rds-theme.css`) e `target`.

## 1.1.0-next.3

### Minor Changes

- A tabela da marca traz também as variáveis próprias da marca na coleção `brand` do Figma (ex.: `marca/ciano`). O `rdsThemeFromTable` as resolve, e o `emitRdsCss` as emite como `--<marca>-<nome>` no escopo claro.

## 1.1.0-next.2

### Minor Changes

- `rdsThemeFromTable(table)`: gera o tema de uma marca do Figma [RDS] um para um. A tabela vem de `figma/export-brand.js` (incluído no pacote), que exporta, modo a modo, o primitivo que cada papel usa no Figma e a cor dele. Falta de papel ou primitivo desconhecido falham listando tudo. `generateRdsTheme` continua para quem só tem uma cor.

## 1.1.0-next.1

### Patch Changes

- `generateRdsTheme` resolve as paletas da própria receita (`BrandDef.palettes`), tanto em hex quanto em escala completa. Antes, uma receita com cores próprias (por exemplo `primary: "minhacor-500"`) falhava com `unknown palette`, embora o gerador da 1.x aceitasse.

## 1.1.0-next.0

### Minor Changes

- 45962a7: 2.0: os componentes passam a seguir a API do Figma [RDS].

  - **Componentes:** cerca de 100 componentes em CSS próprio (`@rojaostudio/ds/styles/rds.css`) sobre tokens de componente extraídos do Figma, cada um com teste no navegador e axe.
  - **Quebras:** quase todos os componentes mudam de API. Os principais renomes são Modal → Dialog, a troca Drawer ↔ Sheet, Menu → DropdownMenu, EmptyState → Empty e Divider → Separator. O Button passa a usar `tone`/`variant`, os campos ganham label, hint e erro embutidos, e o Select e o RadioGroup passam a receber os itens como filhos.
  - **Muda aparência:** o tema público `rojao` passa de preto + verde para navy + flare.
  - **Migração:** `pnpm migrate:consumer <projeto>` simula as trocas, e `--apply` aplica.
  - **ds-core:** novo `generateRdsTheme`/`emitRdsCss` (os papéis de tema do [RDS] a partir de uma cor de marca) e as paletas zinc, navy, flare e coal.

## 1.0.0

### Minor Changes

- 64d476c: Pré-build: os pacotes deixam de publicar TypeScript cru

  Fecha o #100. Os `exports` apontavam para `.ts` e `.tsx`. Isso só funciona em consumidor que transpila dependência — na prática, Next com `transpilePackages`. Vite, Remix, Astro e Node puro quebravam, e **todo** consumidor pagava a transpilação de 589 kB de TSX em toda build fria. Agora se paga uma vez, na publicação.

  Saída **ESM + `.d.ts`**, com `bundle: false`: cada arquivo de origem vira um arquivo de saída, 1:1. Agrupar destruiria os deep imports (`@rojaostudio/ds/components/button`, o caminho canônico) e misturaria os 54 arquivos com `'use client'` num chunk só, arrastando a fronteira de client sobre componentes que não a têm.

  Duas coisas que o transpilador não faz sozinho, e que quebrariam **na máquina de quem instala**:

  - **`'use client'`** some ao transpilar. Sem ela, o App Router trata componente interativo como Server Component — falha em runtime, com uma mensagem que não aponta para o design system.
  - **Imports relativos sem extensão.** O esbuild emite `from "./alert"`; bundler tolera, o resolvedor ESM do Node não. E Node puro é justamente o consumidor que o pré-build veio atender.

  As duas estão restauradas por `scripts/fix-dist.ts` e **travadas por teste** (`dist-contract.test.ts`): o dist é comparado com a origem arquivo a arquivo.

  O `preset.js` do NativeWind vira `preset.cjs` — com `"type": "module"` no pacote, um `.js` ali seria lido como ESM e o `require()` do config do consumidor quebraria.

  Verificado instalando os dois tarballs num projeto Node ESM vazio, sem bundler e sem `transpilePackages`: `ds-core/generate`, `ds/tokens` e `ds/components/button` resolvem e executam.

- 74d63a2: Separa o motor dos componentes: nasce o `@rojaostudio/ds-core`

  Fecha o #99. As `peerDependencies` obrigavam `react`, `react-dom` e `tailwindcss` mesmo para quem só queria os tokens — cliente dependendo do que não usa. A fronteira já existia no código (o motor nunca importou React, e o `emitCss` sempre emitiu CSS puro); passou a existir no empacotamento.

  | pacote                 | conteúdo                                                 | peer dependencies             |
  | ---------------------- | -------------------------------------------------------- | ----------------------------- |
  | `@rojaostudio/ds-core` | tokens, derivação de tema, emissores, receitas, catálogo | **nenhuma**                   |
  | `@rojaostudio/ds`      | componentes, estilos, ícones, alvo React Native          | react, react-dom, tailwindcss |

  **Nada quebra hoje.** Os subpaths antigos — `@rojaostudio/ds/tokens`, `/generate`, `/recipes`, `/themes` — continuam funcionando como reexport depreciado, apontando para o `ds-core`. Saem na próxima major.

  Junto vão duas correções que a separação expôs:

  - **`taxonomy/` fora.** Eram 6 kB de vocabulário de negócio de um produto específico — setores e segmentos — publicados no pacote. O próprio cabeçalho do arquivo dizia "NÃO É publicada no pacote", o que era falso desde que o subpath foi consertado. Ninguém importava.
  - **Arquivo de teste fora do tarball.** Eram 34 dos 48 kB do `ds-core` e nada disso roda na máquina de quem instala.

### Patch Changes

- 66ed985: Documentação pública: README externo, SECURITY, SUPPORT e CONTRIBUTING

  Fecha o #104. A documentação era interna: o README do `ds` descrevia o repo pra quem já era de casa, e o `consuming.md` ensinava a configurar PAT.

  Os dois READMEs de pacote foram reescritos **em inglês** — eles são publicados no npm, que é registry global, e o npm inclui o `README.md` no tarball esteja ou não no `files[]`. O site continua em português e cada README aponta pra ele.

  Novos na raiz: **SECURITY.md** (canal privado de report, escopo, e o que esperar de prazo — dito honestamente, sem SLA que ninguém está de plantão pra cumprir), **SUPPORT.md** (o que é mantido e o que não é, escrito na entrada em vez de descoberto seis meses depois) e **CONTRIBUTING.md** público, com a regra que mais importa num repositório aberto: nunca `pull_request_target`, nunca secret em workflow que roda código de fork.

  Os sete documentos internos saíram de `docs/` para `private/docs/` — quatro nomeavam clientes e iriam para o repositório público.
