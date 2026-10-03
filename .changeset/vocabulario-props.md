---
"@rojaostudio/ds": minor
"@rojaostudio/ds-codemod": minor
---

Vocabulário único de props, igual ao Figma [RDS] de 03/10/2026: `tone` neutral|action|accent|info|success|warning|danger|inverse (nunca `default`); `variant` só para ênfase (fill|soft|outline|ghost; no Card, surface|soft|outline); `size` sm|md|lg (+ xs/xl), com `md` como padrão (nunca `default`); seleção como booleano; tema não é prop. O JSDoc de cada prop cita o nome do Figma (`(Figma: \`variant\`)` no lugar do antigo `style`).

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
