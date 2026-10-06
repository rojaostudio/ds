# @rojaostudio/ds-codemod

## 0.1.0-next.5

### Patch Changes

- f6efbd9: **PageHeader:** `back` e `help`, como no Figma de 04/10/2026 (`showBack` e `showHelp`).

  - `back?: { href; label }`: o caminho de volta à página-mãe. É um link (nunca `history.back`), um IconButton neutral ghost com seta para a esquerda, `aria-label` "Voltar para {label}" e Tooltip com o nome da mãe. Fica numa faixa da altura da linha do título (`type/heading/line`, 30), centrado nela mesmo com descrição, a 8 do título, e não muda de lugar no celular. Use da segunda tela em diante, nunca na primeira. Não depende do Breadcrumb.
  - `help?: { label; onClick?; href? }`: a ajuda da tela. É um IconButton neutral ghost com ponto de interrogação (`circle-question-mark`) e Tooltip (`label`, ex.: "Como funciona"), ao lado do título, com `aria-label` "{label}: {título}". Com `onClick` é um botão (abre a ajuda, ex.: um Sheet); com `href`, um link.
  - **Muda aparência:** o cabeçalho vira uma linha (voltar e texto). A linha do título passa a ter a altura de `type/heading/line`, com `align-items: center`, e nem o voltar nem a ajuda acrescentam altura (o botão de 44 transborda por igual). Sem `back` e sem `help`, nada muda na tela, mas o título e a descrição passam a ficar dentro de `.rds-page-header__text` e `.rds-page-header__title-row`: quem estiliza por classe precisa rever os seletores.
  - Tipos novos no barril: `PageHeaderBack` e `PageHeaderHelp`. O codemod passa a reconhecer os dois como nomes do 2.0.

- f6efbd9: **BREAKING.** **PageShell:** as margens e a largura vêm do modo viewport do Figma [RDS] de 04/10/2026 (coleções `breakpoint` e `viewport` do Base Tokens).

  - `maxWidth` fica com `narrow` (768, `layout/form/max-width`, para formulário e leitura) e `wide` (1536). **Sai `default` (1280); o padrão passa a ser `wide`.** O codemod marca `maxWidth="default"` como manual.
  - **Muda aparência:** sem `maxWidth`, a página vai até 1536 (antes 1280). A margem acima e abaixo segue `layout/content/padding-y` (16 no celular, 24 a partir de 640, 32 a partir de 1024; antes era 24 fixo) e a lateral segue `layout/content/padding-x` (16, 24 a partir de 640, 32 a partir de 1024 e 48 a partir de 1536).
  - Tokens novos em `foundation.css`: `--layout-content-padding-x`, `--layout-content-padding-y` e `--layout-form-max-width`, com uma media query por breakpoint. O build só emite os `layout/*` que alguma folha de estilo lê.
  - A extração do Figma passa a gravar `ds-core/figma/viewport.txt` (breakpoints e o valor de cada variável por modo).

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

## 0.1.0-next.4

### Minor Changes

- Codemod mais seguro e idempotente, depois da auditoria.

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

## 0.1.0-next.3

### Patch Changes

- Enquanto a CLI é pré-versão, o `init` sugere `@rojaostudio/ds@next` (antes sugeria o pacote sem tag, que instala a 1.x) e o `migrate` chama `@rojaostudio/ds-codemod@next`. READMEs com `@next`.

## 0.1.0-next.2

### Minor Changes

- Vocabulário único de props, igual ao Figma [RDS] de 03/10/2026: `tone` neutral|action|accent|info|success|warning|danger|inverse (nunca `default`); `variant` só para ênfase (fill|soft|outline|ghost; no Card, surface|soft|outline); `size` sm|md|lg (+ xs/xl), com `md` como padrão (nunca `default`); seleção como booleano; tema não é prop. O JSDoc de cada prop cita o nome do Figma (`(Figma: \`variant\`)`no lugar do antigo`style`).

  **Breaking** (o nome antigo segue aceito como alias `@deprecated` onde indicado):

  - `size="default"` → `size="md"`, e `md` é o padrão, em Avatar, AvatarGroup, Card, Dialog, Item, Progress, Spinner, StarRating, Status e Tile. Os tipos `AvatarSize`, `CardSize`, `DialogSize`, `ItemSize`, `ProgressSize`, `SpinnerSize`, `StarRatingSize`, `StatusSize` e `TileSize` trocam `default` por `md`. Alias: `size="default"` continua aceito na prop.
  - `tone="default"` → `tone="neutral"` em Spinner, Breadcrumb, Heading, DropdownMenuItem e ContextMenuItem (`SpinnerTone`, `BreadcrumbTone`, `HeadingTone`, `DropdownMenuItemTone`, `ContextMenuItemTone`). Alias: `tone="default"`.
  - **Card:** `surface` vira `variant`: surface (o antigo default) · soft (o antigo tint) · outline. Novo tipo `CardVariant`; `CardSurface` fica deprecated. Classes: `rds-card--surface`, `rds-card--soft` (era `rds-card--tint`). Alias: a prop `surface`.
  - **Item:** `variant` default → ghost, muted → soft, outline igual (`ItemVariant`); classes `rds-item--ghost` e `rds-item--soft`. Alias: `variant="default"` e `"muted"`.
  - **Badge:** `variant` fill|soft; `highlight` sai e é `variant="soft"` no `tone="accent"` (classe `rds-badge--accent-soft`). Alias: `variant="highlight"` no accent.
  - **Bubble:** a superfície vira três props: `variant` fill|soft|outline|ghost (padrão soft) + `tone` neutral|action|danger (action e danger só no soft) + `typing: boolean`. muted → soft, tinted → soft + action, error → soft + danger, typing → `typing`. Novo tipo `BubbleTone`; `BubbleVariant` muda de valores. Sem alias.
  - **Stat** (e `SummaryBar`): `tone` positive → success, negative → danger, default → neutral, warning igual; `tone="muted"` vira a prop `muted: boolean`. Classes `rds-stat--success`, `rds-stat--danger`, `rds-stat--neutral` e `rds-stat--muted`. Alias: positive, negative e default (o `items` deprecated da SummaryBar também aceita `tone: 'muted'`). Sem alias para `tone="muted"` no Stat.
  - **Marker:** `variant` vira `kind` inline|border|separator (o antigo default é inline; classe `rds-marker--inline`). Novo tipo `MarkerKind`; `MarkerVariant` deprecated. Alias: a prop `variant`.
  - **FileInput:** `variant` vira `layout` field|dropzone|tile. Novo tipo `FileInputLayout`; `FileInputVariant` deprecated. Alias: a prop `variant`.
  - **Avatar:** o tipo `AvatarVariant` vira `AvatarContent` (image|fallback|icon, o `content` do Figma; segue derivado das props). `AvatarVariant` fica como alias deprecated.
  - **Sidebar:** `tone` light|dark sai, e o tipo `SidebarTone` sai do barril. O tema é o do contêiner: a barra na cor da marca (o antigo dark) é a Sidebar dentro de um `.ds-plate` (modo brand); no tema escuro, dentro de `.dark`. A classe `rds-sidebar--dark` saiu. Os tokens `--sidebar-dark-*` seguem emitidos, mas ficam obsoletos (nenhuma folha os lê). Sem alias.
  - **SidebarItem:** `active` → `current` (aria-current="page"). Alias: `active`.
  - **FilterChip:** `active`/`defaultActive`/`onActiveChange` → `pressed`/`defaultPressed`/`onPressedChange`, como no Toggle; classe `rds-filter-chip--pressed`. Alias: os três nomes antigos.
  - **RowActions:** o item ganha `tone` neutral|danger no lugar de `variant` default|danger. Alias: `variant`.

  Sem mudança de API (já estavam no vocabulário): Button, IconButton e Toggle (`variant` fill|outline|ghost e ghost|outline; o ToggleGroup repassa `variant`), Toast e Status (`variant` fill|soft|outline), Tile (`variant` fill|soft). ColorInput, DatePicker e TimePicker não têm prop `menu`: só o JSDoc passa a dizer `open`. ImageCropDialog não tem prop `state`. Fora do escopo: ToggleCard `layout` default|compact.

  **Codemod:** novo modo vocabulário. Num projeto que já está na 2.x (ou com `--from-next`), roda só as regras do vocabulário, sem tocar em `package.json`, tema ou CSS; num projeto 0.x/1.x, as mesmas regras rodam depois das regras da 1.x, então o código migrado já cai nos nomes finais (`<Card variant="outlined">` agora vira `variant="outline"`, e o `pillFilters` do DataTableHeader vira FilterChips com `pressed`).

  - Automático: `size="default"` → `md`; `tone="default"` → `neutral`; Card `surface` → `variant` (default → surface, tint → soft); Item `variant` default/muted → ghost/soft; Marker `variant` → `kind` (default → inline); FileInput `variant` → `layout`; Stat `tone` positive/negative/default → success/danger/neutral e `tone="muted"` → `muted`; Bubble `variant` → `variant` + `tone` + `typing`; Badge `variant="highlight"` → `variant="soft" tone="accent"`; FilterChip `active`/`defaultActive`/`onActiveChange` → `pressed`/`defaultPressed`/`onPressedChange`; SidebarItem `active` → `current`; Sidebar `tone="light"` removido; `items[].variant` do RowActions → `tone`; tipos `AvatarVariant` → `AvatarContent` e `FileInputVariant` → `FileInputLayout`.
  - Manual (relatado com `arquivo:linha` e `TODO(ds-2.0)` no `--apply`): Sidebar `tone="dark"` (envolva num `.ds-plate`); valores dinâmicos de Bubble `variant`, Card `surface`, Stat `tone`, Item `variant`, Marker `variant` e `items[].variant` do RowActions; prop antiga e nova juntas (`active` + `pressed`); os tipos `CardSurface`, `MarkerVariant` e `SidebarTone`.

## 0.1.0-next.1

### Minor Changes

- Sincronia com o Figma [RDS] de 03/10/2026: tokens extraídos de novo (agora por um script que está no repositório) e Card, Sidebar, DataTableHeader, SavingBar e ColorInput alinhados à spec atual.

  - **Extração reprodutível.** `packages/ds/scripts/figma/extract-tokens.figma.js` roda em leitura no Figma (Plugin API) e gera os `.txt` de tokens e o `theme.txt`/`foundation.txt` do ds-core no formato que o build lê. O CONTRIBUTING explica como rodar. O formato ganha uma coluna opcional `obsolete` para o token que o Figma marca como "Obsoleto": ele continua emitido no CSS, mas nenhuma folha de estilo precisa lê-lo.
  - **Tokens novos:** `--card-tint-title` (título do cartão tint, `text/on/tint`) e `--sidebar-item-indicator` (marcador do item ativo, `colors/primary/default`). **Alterado:** `--sidebar-item-label-active` passa de `colors/primary/default` para `text/on/tint`. **Obsoletos** (seguem existindo): `--card-footer-background` e `--card-tint-footer-background`.
  - **Card:** `surface` ganha `"outline"` (só a borda, sem fundo nem sombra, para cartões lado a lado numa grade ou dentro de painel). Muda aparência: respiro de 24 (16 no `sm`, antes 16/12); o tint perde a sombra e o título usa `--card-tint-title`; o rodapé não tem mais faixa nem linha de cima, as ações ficam lado a lado com 12 entre elas (a secundária em Button neutral ghost); `align="full"` deixou de empilhar e põe as duas ações lado a lado, metade cada. A ação do cabeçalho segue opcional.
  - **Sidebar:** muda aparência: o item ativo ganha o marcador de 3 × 20 à esquerda e o rótulo em semibold (600), na cor de `--sidebar-item-label-active`; a contagem do ativo usa `--sidebar-item-count`, como no Figma.
  - **DataTableHeader:** novo slot `view` (controle de visão, ex. Checkbox "Agrupar por produto"), depois dos filtros e antes das ações, visível também no estreito. A busca fica à esquerda com base e mínimo de 320 (nunca mais larga que a barra) e o resto é empurrado para a direita.
  - **SavingBar:** a barra vira um container de tamanho e escolhe o arranjo pela própria largura: abaixo de 1024, mensagem em cima (até 2 linhas com reticências) e Descartar e Salvar embaixo dividindo a largura; a partir de 1024, a mensagem cresce ao lado das ações com mínimo de 160.
  - **ColorInput:** a amostra escolhida, o foco na paleta e a amostra do campo usam o anel do Button e do Checkbox, com respiro (`outline-offset` igual à largura do anel).
  - **PageSkeleton:** a linha de cabeçalho da tabela usa `--table-header-background` no lugar do token obsoleto do rodapé do Card (mesma cor).

  **Breaking:**

  - `DataTableHeader`: `pillFilters` (array de `DataTablePillDef`) saiu; os filtros rápidos são o slot `quickFilters?: ReactNode` (até três, um `<FilterChipGroup>` com `<FilterChip>`; quatro ou mais, um Button com menu). O tipo `DataTablePillDef` saiu do barril. "Filtros · N" passa a contar só os filtros que o botão abre (os rápidos mostram o estado deles à vista), e `onClear` limpa esses filtros. O codemod troca `pillFilters={lista}` por `quickFilters={<FilterChipGroup aria-label="Filtros rápidos">{lista.map(…<FilterChip>…)}</FilterChipGroup>}` e importa os dois componentes; `DataTablePillDef` é reportado como manual.
  - `SavingBar`: a mensagem e as ações agora ficam dentro de `.rds-savingbar__row`, e o texto em `.rds-savingbar__text`; quem estiliza por classe precisa rever os seletores.
  - Card: o rodapé deixa de ler `--card-footer-background`/`--card-tint-footer-background` e a classe `rds-card__footer` perde fundo e borda.

  O codemod também passa a migrar `<Card variant="outlined">` para `surface="outline"` e a remover `variant="elevated"` (o padrão); `filled`, `flat` e `invert` continuam manuais.

## 0.1.0-next.0

### Minor Changes

- Novo pacote `@rojaostudio/ds-codemod` (bin `rojao-ds-codemod`): o codemod da migração 0.x/1.x → 2.0 ao alcance de quem consome, sem clonar este repositório.

  ```bash
  npx @rojaostudio/ds-codemod ./meu-app            # dry-run: plano e casos manuais com arquivo:linha
  npx @rojaostudio/ds-codemod ./meu-app --apply    # escreve, com um TODO(ds-2.0) acima de cada caso manual
  ```

  O motor e o mapa saíram de `packages/ds/scripts/migrate` e vivem só no pacote novo; a única dependência é o `ts-morph`. Dentro do repositório, `pnpm migrate:consumer <pasta>` continua funcionando e roda o mesmo código. O mapa ganha os renomes `FloatingStepper` → `Stepper` e `ImageCropModal` → `ImageCropDialog` (componentes, tipos e deep imports).

  A CLI ganha `npx rojao-ds migrate <pasta> [--apply]`, que só repassa os argumentos para `npx @rojaostudio/ds-codemod`: o `ts-morph` não entra na CLI.
