# @rojaostudio/ds-codemod

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
