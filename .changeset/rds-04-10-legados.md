---
"@rojaostudio/ds": minor
"@rojaostudio/ds-core": patch
---

**BREAKING.** Saem os componentes obsoletos, o tom `inverse` do Button, do IconButton e do Badge, a prop `tone` do Breadcrumb e os nomes legados de props e valores que o 2.0.0-next ainda aceitava. O Figma [RDS] de 04/10/2026 não tem mais nada disso.

**Componentes que saem (módulo, export do barril, CSS e testes):**

| Sai | Entra |
| --- | --- |
| `Dropzone` (`components/dropzone`) | `<FileInput layout="dropzone">` |
| `ImageUpload` (`components/image-upload`) | `<FileInput layout="tile">` (envio em `onFiles`, URL em `preview`) + `ImageCropDialog` se precisar recortar |
| `OptionTile`, `OptionTileGrid` (`components/option-tile`) | `<ChoiceCard layout="tile">` dentro de `<ChoiceCardGroup layout="tile">` (a escolha múltipla do `OptionTileGrid multiple` vira `CheckboxGroup`) |
| `SelectableCard` | `<ChoiceCard layout="row">` |
| `ChoicePreviewCard` | `<ChoiceCard layout="preview" preview={…}>` |
| `ToggleCardCompact` | `<ToggleCard layout="compact">` |
| `PricingCard` | `<PricingPlan>` dentro de `<Pricing>` |
| `SectionHeader` (e `section-header.css`) | `<PageHeader titleAs="h2">` (eyebrow e número não existem no Figma: leve para `description`) |
| `SettingRow` | `<Item title description media action>` |
| `FloatingStepper`, `FloatingStepperProps`, `FloatingStepperStep` | `Stepper`, `StepperProps`, `StepperStep` (`components/stepper`) |
| `TypingIndicator` | `<Bubble typing />` |
| `ImageCropModal`, `ImageCropModalProps` (`components/image-crop-modal`) | `ImageCropDialog`, `ImageCropDialogProps` (`components/image-crop-dialog`) |
| `PageShell.Header`, `PageShellHeaderProps`, a classe `.rds-page-shell__header` | `<PageHeader title actions description>` dentro do `PageShell` |

**Tom `inverse`:**

| Sai | Entra |
| --- | --- |
| `<Button tone="inverse">`, `<IconButton tone="inverse">` | Sobre a cor da marca: a faixa no modo brand do tema (`.ds-plate` ou `data-rds-plate`) com `tone="neutral"` |
| `<Badge tone="inverse">` | O mesmo: `.ds-plate` com `tone="neutral"` |
| `<Breadcrumb tone=…>` e o tipo `BreadcrumbTone` | Sem prop. Sobre a marca, o Breadcrumb dentro de `.ds-plate` |
| Tokens `--button-inverse-*` (17), `--badge-inverse-fill-*` (2), `--breadcrumb-inverse-*` (4), classes `.rds-button--inverse`, `.rds-badge--inverse-fill`, `.rds-breadcrumb--inverse` | — |
| `ButtonTone` com `'inverse'` | `'action' \| 'neutral' \| 'danger'` |

O `Spinner` mantém `tone="inverse"`.

**Valores e props legados:**

| Sai | Entra |
| --- | --- |
| `size="default"` em Avatar, AvatarGroup, Card, Dialog, Item, Progress, Spinner, StarRating, Status e Tile | `size="md"` (ou omita: é o padrão) |
| `tone="default"` em Heading, Spinner e no item do ContextMenu e do DropdownMenu | `tone="neutral"` (ou omita) |
| `AvatarVariant` | `AvatarContent` |
| Card `surface` (`default`, `tint`, `outline`) e o tipo `CardSurface` | `variant`: `surface`, `soft`, `outline` |
| Item `variant="default"` / `"muted"` | `variant="ghost"` / `"soft"` |
| Marker `variant` (`default`, `border`, `separator`) e `MarkerVariant` | `kind`: `inline`, `border`, `separator` |
| Stat `tone="default"` / `"positive"` / `"negative"`, `LegacyStatTone`, `statTone()`, `LEGACY_TONE` | `tone="neutral"` / `"success"` / `"danger"` |
| SummaryBar `items`, `SummaryBarItem`, `SummaryBarTone` e o tom `muted` do item | `<Stat>` como filhos (`<Stat muted>` para o zero), `StatTone` |
| RowActions: item com `variant: 'default' \| 'danger'` | `tone: 'neutral' \| 'danger'` |
| FileInput `variant` e `FileInputVariant` | `layout` e `FileInputLayout` |
| Chart `showAllDates` | `dates="all"` (true) ou `dates="edges"` (false, o padrão) |
| ChipInput `helper` | `hint` |
| FilterChip `active`, `defaultActive`, `onActiveChange` | `pressed`, `defaultPressed`, `onPressedChange` |
| SidebarItem `active` | `current` |

**Muda aparência:**

- **ActionBar:** as ações e o X passam a ser Button neutral ghost. A barra redeclara os tokens do neutral ghost nas suas cores: rótulo e ícone em `--actionbar-text`, hover a 15% e pressionado a 25% dessa cor, desabilitado a 40% sobre a barra, anel de foco em `--actionbar-text`. Use `tone="neutral" variant="ghost"` nos Buttons do slot.
- **Pricing:** o CTA do plano recomendado passa a ser Button neutral fill, pintado com os tokens novos `--pricing-plan-recommended-cta-background` (`text/on/primary`) e `--pricing-plan-recommended-cta-label` (`colors/primary/default`). O hover fica a 85% sobre o plano (70% pressionado) e o anel de foco no texto do plano. Use `cta={<Button tone="neutral">…</Button>}`.
- O `ChoiceCard` interno não tem mais o modo checkbox (servia só ao `OptionTileGrid multiple`).

Nos testes, `renderIn(ui, scheme)` e `SCHEMES` (claro, escuro e marca) passam a rodar o axe também na chapa da marca.
