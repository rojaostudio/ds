# @rojaostudio/ds-core

## 1.1.0-next.13

### Minor Changes

- a99fbf1: Banner attention segue o Figma [RDS]: os fundos vêm de três papéis novos do tema, `surface/attention/low` (amber/100, #fff2d6), `surface/attention/medium` (amber/200, #ffe3ab) e `surface/attention/high` (amber/400, #ffc107), com o mesmo valor no claro, no escuro e na chapa, para toda marca. O texto dos três níveis é `banner/attention/text` (text/on/warning, preto). O `color-mix` do medium sai. O CTA continua outline em low e medium e fill em high. No ds-core, o gerador e a tabela da marca rojao ganham os três papéis, e uma tabela exportada antes deles carrega o âmbar fixo com um aviso para exportar de novo. Tokens do componente: `banner/attention/{low,medium,high}/background` passam a apontar para `surface/attention/*`, `banner/attention/medium/background` e `banner/attention/text` são novos, e saem `banner/attention/low/text`, `banner/attention/medium/text` e `banner/attention/high/text`.

## 1.1.0-next.12

### Minor Changes

- f6efbd9: Sincronia com o Figma [RDS] de 04/10/2026: tokens e tabela da Rojão extraídos de novo.

  - **Muda aparência:** o hover do Button danger (`colors/state/error-strong`) no escuro e na chapa passa de red/400 (`#ff6c5c`) para red/700 (`#990001`) na tabela da Rojão (`figma/brands/rojao.rds.json`) e no `styles/rds/theme.css`. O claro continua red/800. O rótulo branco sobre o hover sobe de 2,78:1 para AA.
  - No Figma, esse papel aponta direto para o primitivo no escuro e na chapa (`@color:red/700` no `theme.txt`), não mais para um token do `base`. O `export-brand.js` e o extrator já lidavam com isso: a tabela reextraída bate byte a byte com o Figma.
  - `ROLES` ganha uma fonte nova, `"p"`: um primitivo fixo, o mesmo para toda marca. É o caso de `colors/state/error-strong` no escuro e na chapa. `generateRdsTheme` passa a usar red/700 direto (antes, andava na rampa até carregar o rótulo e chegava ao mesmo valor), e o gerador e a tabela da Rojão deixam de divergir nesse papel (snapshot atualizado).

### Patch Changes

- f6efbd9: **BREAKING.** Saem os componentes obsoletos, o tom `inverse` do Button, do IconButton e do Badge, a prop `tone` do Breadcrumb e os nomes legados de props e valores que o 2.0.0-next ainda aceitava. O Figma [RDS] de 04/10/2026 não tem mais nada disso.

  **Componentes que saem (módulo, export do barril, CSS e testes):**

  | Sai                                                                            | Entra                                                                                                                                           |
  | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
  | `Dropzone` (`components/dropzone`)                                             | `<FileInput layout="dropzone">`                                                                                                                 |
  | `ImageUpload` (`components/image-upload`)                                      | `<FileInput layout="tile">` (envio em `onFiles`, URL em `preview`) + `ImageCropDialog` se precisar recortar                                     |
  | `OptionTile`, `OptionTileGrid` (`components/option-tile`)                      | `<ChoiceCard layout="tile">` dentro de `<ChoiceCardGroup layout="tile">` (a escolha múltipla do `OptionTileGrid multiple` vira `CheckboxGroup`) |
  | `SelectableCard`                                                               | `<ChoiceCard layout="row">`                                                                                                                     |
  | `ChoicePreviewCard`                                                            | `<ChoiceCard layout="preview" preview={…}>`                                                                                                     |
  | `ToggleCardCompact`                                                            | `<ToggleCard layout="compact">`                                                                                                                 |
  | `PricingCard`                                                                  | `<PricingPlan>` dentro de `<Pricing>`                                                                                                           |
  | `SectionHeader` (e `section-header.css`)                                       | `<PageHeader titleAs="h2">` (eyebrow e número não existem no Figma: leve para `description`)                                                    |
  | `SettingRow`                                                                   | `<Item title description media action>`                                                                                                         |
  | `FloatingStepper`, `FloatingStepperProps`, `FloatingStepperStep`               | `Stepper`, `StepperProps`, `StepperStep` (`components/stepper`)                                                                                 |
  | `TypingIndicator`                                                              | `<Bubble typing />`                                                                                                                             |
  | `ImageCropModal`, `ImageCropModalProps` (`components/image-crop-modal`)        | `ImageCropDialog`, `ImageCropDialogProps` (`components/image-crop-dialog`)                                                                      |
  | `PageShell.Header`, `PageShellHeaderProps`, a classe `.rds-page-shell__header` | `<PageHeader title actions description>` dentro do `PageShell`                                                                                  |

  **Tom `inverse`:**

  | Sai                                                                                                                                                                                  | Entra                                                                                                      |
  | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
  | `<Button tone="inverse">`, `<IconButton tone="inverse">`                                                                                                                             | Sobre a cor da marca: a faixa no modo brand do tema (`.ds-plate` ou `data-rds-plate`) com `tone="neutral"` |
  | `<Badge tone="inverse">`                                                                                                                                                             | O mesmo: `.ds-plate` com `tone="neutral"`                                                                  |
  | `<Breadcrumb tone=…>` e o tipo `BreadcrumbTone`                                                                                                                                      | Sem prop. Sobre a marca, o Breadcrumb dentro de `.ds-plate`                                                |
  | Tokens `--button-inverse-*` (17), `--badge-inverse-fill-*` (2), `--breadcrumb-inverse-*` (4), classes `.rds-button--inverse`, `.rds-badge--inverse-fill`, `.rds-breadcrumb--inverse` | —                                                                                                          |
  | `ButtonTone` com `'inverse'`                                                                                                                                                         | `'action' \| 'neutral' \| 'danger'`                                                                        |

  O `Spinner` mantém `tone="inverse"`.

  **Valores e props legados:**

  | Sai                                                                                                       | Entra                                                         |
  | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
  | `size="default"` em Avatar, AvatarGroup, Card, Dialog, Item, Progress, Spinner, StarRating, Status e Tile | `size="md"` (ou omita: é o padrão)                            |
  | `tone="default"` em Heading, Spinner e no item do ContextMenu e do DropdownMenu                           | `tone="neutral"` (ou omita)                                   |
  | `AvatarVariant`                                                                                           | `AvatarContent`                                               |
  | Card `surface` (`default`, `tint`, `outline`) e o tipo `CardSurface`                                      | `variant`: `surface`, `soft`, `outline`                       |
  | Item `variant="default"` / `"muted"`                                                                      | `variant="ghost"` / `"soft"`                                  |
  | Marker `variant` (`default`, `border`, `separator`) e `MarkerVariant`                                     | `kind`: `inline`, `border`, `separator`                       |
  | Stat `tone="default"` / `"positive"` / `"negative"`, `LegacyStatTone`, `statTone()`, `LEGACY_TONE`        | `tone="neutral"` / `"success"` / `"danger"`                   |
  | SummaryBar `items`, `SummaryBarItem`, `SummaryBarTone` e o tom `muted` do item                            | `<Stat>` como filhos (`<Stat muted>` para o zero), `StatTone` |
  | RowActions: item com `variant: 'default' \| 'danger'`                                                     | `tone: 'neutral' \| 'danger'`                                 |
  | FileInput `variant` e `FileInputVariant`                                                                  | `layout` e `FileInputLayout`                                  |
  | Chart `showAllDates`                                                                                      | `dates="all"` (true) ou `dates="edges"` (false, o padrão)     |
  | ChipInput `helper`                                                                                        | `hint`                                                        |
  | FilterChip `active`, `defaultActive`, `onActiveChange`                                                    | `pressed`, `defaultPressed`, `onPressedChange`                |
  | SidebarItem `active`                                                                                      | `current`                                                     |

  **Muda aparência:**

  - **ActionBar:** as ações e o X passam a ser Button neutral ghost. A barra redeclara os tokens do neutral ghost nas suas cores: rótulo e ícone em `--actionbar-text`, hover a 15% e pressionado a 25% dessa cor, desabilitado a 40% sobre a barra, anel de foco em `--actionbar-text`. Use `tone="neutral" variant="ghost"` nos Buttons do slot.
  - **Pricing:** o CTA do plano recomendado passa a ser Button neutral fill, pintado com os tokens novos `--pricing-plan-recommended-cta-background` (`text/on/primary`) e `--pricing-plan-recommended-cta-label` (`colors/primary/default`). O hover fica a 85% sobre o plano (70% pressionado) e o anel de foco no texto do plano. Use `cta={<Button tone="neutral">…</Button>}`.
  - O `ChoiceCard` interno não tem mais o modo checkbox (servia só ao `OptionTileGrid multiple`).

  Nos testes, `renderIn(ui, scheme)` e `SCHEMES` (claro, escuro e marca) passam a rodar o axe também na chapa da marca.

- f6efbd9: **Sidebar (BREAKING), como no Figma de 04/10/2026:** grupos com ícone num accordion exclusivo, tipografia por nível, um só item atual, trilho com um ícone por grupo e gaveta no celular.

  **Mapa de migração:**

  | Sai                                                                                                | Entra                                                                                                                                                        |
  | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `SidebarSection` (`label`, `count`, `open`, `defaultOpen`, `onOpenChange`) e `SidebarSectionProps` | `SidebarGroup` (`label`, `icon`, `id?`) e `SidebarGroupProps`. O grupo não leva número, e quem abre e fecha é a Sidebar (accordion exclusivo).               |
  | `SidebarSeparator`                                                                                 | — (a separação é o espaço de 16 acima do grupo)                                                                                                              |
  | `current` em cada item para marcar a página                                                        | `currentPath` na `Sidebar` (o pathname). O `current` do item continua aceito, mas só um item fica com `aria-current`: vence o `href` mais longo.             |
  | `SidebarItem` `icon` obrigatório                                                                   | `icon` opcional: só o nível 1 desenha ícone. No nível 2 (dentro de um grupo) é só texto.                                                                     |
  | Tokens `--sidebar-section-label`, `--sidebar-item-indicator`, `--sidebar-item-count`               | `--sidebar-count-neutral` (o antigo `item-count`), `--sidebar-count-danger`, `--sidebar-dot-neutral`, `--sidebar-dot-danger` e `--sidebar-item-label-strong` |
  | Classes `.rds-sidebar__section*`, `.rds-sidebar__separator`, o `::before` do item atual            | `.rds-sidebar__group*`, `.rds-sidebar__item--level-1/2`, `.rds-sidebar__count--*`, `.rds-sidebar__dot--*`                                                    |

  **Novo:**

  - `SidebarItem` ganha `countTone` (`neutral` | `danger`) e `countLabel` (o que o número conta, dito no nome acessível: "Contas a pagar, 3 vencidos").
  - **Nível pela posição, nunca por ter filhos.** Nível 1 (item solto e cabeçalho do grupo): 44 de altura, 12 por dentro, ícone de 20, 14/20 peso 500. Nível 2 (item dentro do grupo): 40 de altura, recuo de 44, só texto, 14/20 peso 400.
  - **Atual.** A página atual tem a pílula (`--sidebar-item-background-active`) e o rótulo semibold em `--sidebar-item-label-active`. O grupo com a rota atual fica em `--sidebar-item-label-strong`, semibold, sem pílula, e abre sozinho. O botão do grupo aberto também o fecha.
  - **Trilho** (`collapsed`, a partir de 1024): os itens soltos e um ícone por grupo. O grupo leva um ponto de 8 no canto do ícone, na cor do pior estado entre os filhos (`--sidebar-dot-danger` vence `--sidebar-dot-neutral`), e o nome acessível com o número ("Financeiro, 3 vencidos"). O flyout com os subitens (a casca do DropdownMenu, 240 de largura) abre ao clicar ou ao receber foco, sem mover o foco. Enter, Espaço e → entram nele, ↑ e ↓ andam, e Esc e ← fecham e devolvem o foco. O item solto com número também vira ponto.
  - **Gaveta** (abaixo de 1024, o `layout/nav-button/visible` do Figma): a Sidebar sai da tela e fica `inert` enquanto fechada. `drawerOpen` e `onDrawerOpenChange` a controlam, e `SidebarTrigger` é o botão (IconButton neutral ghost com Tooltip, `aria-controls` e `aria-expanded`, escondido a partir de 1024). Ao abrir, o foco entra no item atual. Esc, o véu (`--drawer-scrim`) e um item que navega a fecham, e o foco volta ao botão. O `collapsed` não vale na gaveta: ela abre inteira.

  **Muda aparência:** saem o marcador de 3 × 20 do item atual, a linha separadora e a legenda 11/14 em caixa alta dos grupos. Abaixo de 1024, a Sidebar deixa de aparecer na página até a gaveta abrir.

  **ds-core:** na chapa do tema gerado, `colors/state/neutral-strong` (o ponto neutral da Sidebar e o ícone da Toast neutral) anda na rampa até 3:1 sobre o painel e o card. `RDS_NON_TEXT_PAIRS` passa a medir esse par. A tabela da Rojão não muda.

  **codemod:** os nomes novos (`SidebarGroup`, `SidebarTrigger`, `SidebarCountTone`, `SwitchSize`, `SwitchLabelPosition` e os `*Props`) entram na detecção de código que já está no 2.0.

## 1.1.0-next.11

### Minor Changes

- Tema de uma cor (`generateRdsTheme`, o "Sua cor" do showroom) legível em todos os componentes, em claro, escuro e chapa. As tabelas de marca do Figma (`rdsThemeFromTable`) não mudam.

  - **Neutro em tinta neutra.** Com só `brand.primary`, a cor é a ação e o acento; `colors/primary/*` (Button e Badge neutros, barras, Tooltip, dia selecionado) sai de uma tinta neutra da rampa de texto, nunca da cor da marca, e longe o bastante da ação para os dois Buttons não saírem iguais. Antes, o Button neutro era pintado com a marca (branco sobre `#10b981`, 2,53:1) e o inverse levava a marca como rótulo (1,41:1 com amarelo). Receita com `secondary` (a Rojão) mantém a primária como foi dada.
  - **Rótulo do neutro pelo fundo real.** `text/on/primary-strong` é escolhido sobre `colors/primary/default` (o preenchimento do Button neutro), não sobre `colors/primary/dark`; o hover (`colors/primary/dark`), o pressionado e o hover do inverse (`colors/primary/light`) carregam esse rótulo em 4,5:1. Na chapa, o Button neutro saía com fundo e texto `#000000`.
  - **Chapa.** Pintada com a cor da marca; quando ela fica a menos de 6:1 da tinta (carmim, violeta, cinza), anda na rampa até deixar folga para os hovers. Texto discreto (dica do Input, cabeçalho da Table, rótulos da Sidebar, descrição do Card, eyebrow dos blocos) fica mais opaco até 4,5:1; a borda do campo, até 3:1; as sobreposições usam a outra tinta quando a da chapa não carregaria o texto. Texto de estado (erro do Input, danger outline/ghost) e superfícies suaves vêm do claro numa chapa clara e andam na rampa até 4,5:1. Logos na chapa saem na tinta.
  - **Danger.** `colors/state/error-strong`, o hover do Button danger, carrega o rótulo branco no escuro e na chapa (era 2,78:1).
  - **Escuro.** A tinta de seleção (`surface/tint/*`) e o destaque do acento escurecem na rampa até carregar o texto (amarelo: 1,91:1 → 4,68:1).
  - **Logo.** `logo/primary` e `logo/signature` ficam na cor da marca, escurecida até 3:1 sobre as superfícies claras (amarelo sobre fundo claro: 1,35:1).
  - **Relatório maior.** `RDS_CONTRAST_PAIRS` cobre os pares que os componentes juntam; novo `RDS_NON_TEXT_PAIRS` (3:1: borda de campo, borda de erro, foco, logo, série 1). `RdsContrastFailure` ganha `min`. Novo `distinct(a, b)`.
  - `emitClaudeMd` descreve os papéis como os componentes os usam: `colors/primary/*` é a tinta neutra (Button e Badge neutros, barras, Tooltip) e `colors/secondary/*` o preenchimento de ação.
  - **Teste de regressão** no `@rojaostudio/ds`: nove cores difíceis, tokens de componente resolvidos até a cor final, falha abaixo de 4,5:1 (texto) e 3:1 (interface).
  - Na receita da Rojão (gerada, não a tabela) mudam o hover do danger no escuro e na chapa, a tinta de seleção e o destaque do acento no escuro e `text/subtle` na chapa (60% → 65%). Snapshot atualizado.

## 1.1.0-next.10

### Patch Changes

- `generateRdsTheme`: hover e active dos preenchimentos de marca passam a carregar o mesmo texto do preenchimento padrão.

  - **Bug:** o `text/on/*` era escolhido (preto ou branco) só contra o tom padrão, e `hover`/`active` saíam escurecendo a rampa sem conferir esse texto. Numa marca clara (ciano #00aeef), o botão de ação com o ponteiro em cima ficava com fundo #005679 e rótulo preto, 2,6:1.
  - **Agora** o texto é escolhido primeiro e cada estado precisa passar 4,5:1 com ele: `colors/primary/active` com `text/on/primary`, `colors/secondary/hover` e `colors/secondary/active` com `text/on/secondary`, `colors/accent/hover` com `text/on/accent`, nos modos claro, escuro e chapa. O degrau do template é mantido quando passa; senão o estado anda na rampa na mesma direção até onde o texto ainda passa e, sem espaço, vai para o outro lado (clareia sob texto escuro, escurece sob texto claro). Sempre diferente do tom padrão.
  - **`RDS_CONTRAST_PAIRS`** ganha esses quatro pares, e `rdsContrastReport` passa a apontar hover e active abaixo de AA (também nas tabelas de marca).
  - O tema da Rojão não muda: vem da tabela do Figma, e o gerador com a receita da Rojão sai igual.

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
