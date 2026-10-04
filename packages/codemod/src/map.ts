/**
 * map.ts — the 0.x/1.x → 2.0 migration map of `@rojaostudio/ds`, as data for human review.
 *
 * Every entry here comes from the breaking-change notes of waves 1 to 6 (PRs #24, #25, #27, #28, #33 and #34) and
 * from reading the old component (`git show 063c848:packages/ds/components/<file>.tsx`) next to the new one. Nothing
 * is guessed: when the old prop has no faithful 2.0 equivalent, the entry says `manual` and the codemod leaves the
 * usage as it is and reports it (and writes a `TODO(ds-2.0)` comment with `--apply`).
 *
 * Messages (`manual`, `note`) are shown to the person migrating, so they are in pt-BR. Comments are in English.
 *
 * How the codemod reads this file (codemod.ts, next to it):
 *  - `PACKAGE_RENAMES` and `FILE_RENAMES` rewrite module specifiers.
 *  - `COMPONENTS[oldExportName]` drives every JSX usage of a component imported from the DS:
 *      `to`          the export was renamed: the import and every reference are renamed together. A renamed
 *                    component is migrated all-or-nothing per file: if one usage is manual, the whole component
 *                    stays on the old name in that file, so the file never mixes the two APIs.
 *      `props`       per-prop rules (rename, literal value map, drop, manual).
 *      `require`     props the 2.0 component requires that the old one did not.
 *      `newApiProps` props that only exist in 2.0: a usage with one of them is already migrated and is left alone.
 *                    This is what keeps the Drawer ↔ Sheet and Toggle → Switch swaps from running twice.
 *      `transforms`  named transforms with logic beyond a prop rename (implemented in codemod.ts).
 *      `manual`      every usage is manual (structural change: `options[]` → children, render-props…).
 *  - `TYPES` renames or flags type-only exports.
 *  - `EXPORTS_MANUAL` flags exports that are gone with no mechanical replacement (`buttonVariants`, `Th`…).
 *  - `MOVED_EXPORTS` moves an export to another entry point (`PixIcon` → `@rojaostudio/ds/icons`).
 *  - `DEPRECATED` and `ICON_BUTTON_TOOLTIP` are notices: reported, never transformed.
 *  - `VOCABULARY` and `VOCABULARY_TYPES` are the single prop vocabulary of 2.0.0-next (03/10/2026): the Figma
 *    [RDS] names (`tone` neutral…, `variant` only for emphasis, `size` md as the default, selection as booleans).
 *    They are keyed by the 2.0 export name and run on 2.0 usages: alone on a 2.0.0-next project (`from: 'next'`),
 *    and after the 1.x rules on a 1.x one, so a 1.x usage lands on the final names.
 */

/** Old package names → the published one. `@rojao/ds` is the scope before the move to npmjs (#102). */
export const PACKAGE_RENAMES: Record<string, string> = {
  '@rojao/ds': '@rojaostudio/ds',
};

export const DS_PACKAGE = '@rojaostudio/ds';

/** The stylesheet every 2.0 component needs (the `rds-*` classes live there, not in Tailwind). */
export const RDS_CSS = '@rojaostudio/ds/styles/rds.css';

/**
 * Deep imports (`@rojaostudio/ds/components/<file>`) whose file was renamed or removed. `null` means the file is
 * gone with no replacement: the import is reported as manual.
 *
 * `drawer` → `sheet` and `bottom-sheet` → `drawer` are a swap: both are applied in a single pass over the original
 * text, so a file that imports both ends up with `sheet` and `drawer`, never with two `sheet`s.
 */
export const FILE_RENAMES: Record<string, string | null> = {
  modal: 'dialog', // wave 2 (#15)
  drawer: 'sheet', // wave 2 (#15): the side panel
  'bottom-sheet': 'drawer', // wave 2 (#15): the panel from the bottom
  menu: 'dropdown-menu', // wave 2 (#15)
  toaster: 'toast', // wave 2 (#15)
  'empty-state': 'empty', // wave 3 (#16)
  divider: 'separator', // wave 3 (#16)
  'page-tabs': 'tabs', // wave 3 (#16)
  'chat-bubble': 'bubble', // wave 4 (#17)
  'phone-frame': 'phone', // wave 4 (#17)
  chips: 'chip', // wave 1 (#14)
  'form-card-header': 'card', // wave 6 (#33): FormCardHeader → CardHeader
  search: 'input', // wave 6 (#33): Search → Input type="search"
  notice: 'alert', // wave 6 (#33): Notice → Alert
  'floating-stepper': 'stepper', // 2.0 renames: FloatingStepper → Stepper (the old file stays, deprecated)
  'image-crop-modal': 'image-crop-dialog', // 2.0 renames: ImageCropModal → ImageCropDialog (the old file stays, deprecated)
  'use-focus-trap': null, // wave 2 (#15): Radix handles focus now
  'use-dismiss': null, // wave 2 (#15)
};

/** Why a removed deep import has no replacement. */
export const FILE_REMOVED_NOTES: Record<string, string> = {
  'use-focus-trap': 'components/use-focus-trap saiu na 2.0: Dialog, Sheet, Drawer e Popover (Radix) já prendem e devolvem o foco.',
  'use-dismiss': 'components/use-dismiss saiu na 2.0: os overlays em Radix já fecham com Esc e clique fora.',
};

/**
 * The file each 2.0 export lives in, for exports that moved to a file other than the old file's rename. Used to
 * route deep imports (`components/toggle` → `components/switch` for the old switch, `components/radio` →
 * `components/radio-group` for the RadioGroup) and to add imports the codemod needs (Button, Status…).
 */
export const FILE_OF_EXPORT: Record<string, string> = {
  Switch: 'switch',
  SwitchProps: 'switch',
  RadioGroup: 'radio-group',
  RadioGroupProps: 'radio-group',
  PasswordInput: 'password-input',
  Status: 'status',
  Button: 'button',
  Alert: 'alert',
  AlertTone: 'alert',
  Input: 'input',
  InputProps: 'input',
  CardHeader: 'card',
  CardHeaderProps: 'card',
  CardContent: 'card',
  Dialog: 'dialog',
  DialogProps: 'dialog',
  Sheet: 'sheet',
  SheetProps: 'sheet',
  Drawer: 'drawer',
  DrawerProps: 'drawer',
  DropdownMenu: 'dropdown-menu',
  DropdownMenuItem: 'dropdown-menu',
  DropdownMenuSeparator: 'dropdown-menu',
  DropdownMenuProps: 'dropdown-menu',
  DropdownMenuItemProps: 'dropdown-menu',
  Empty: 'empty',
  EmptyProps: 'empty',
  Separator: 'separator',
  SeparatorProps: 'separator',
  Bubble: 'bubble',
  BubbleProps: 'bubble',
  Phone: 'phone',
  PhoneProps: 'phone',
  ToggleCard: 'toggle-card',
  ToggleCardProps: 'toggle-card',
  Stepper: 'stepper',
  StepperProps: 'stepper',
  StepperStep: 'stepper',
  ImageCropDialog: 'image-crop-dialog',
  ImageCropDialogProps: 'image-crop-dialog',
  CropPreset: 'image-crop-dialog',
};

/** Literal value of a JSX attribute after migration. `null` drops the attribute: it is the 2.0 default. */
export type ValueMap = Record<string, string | null>;

export interface PropRule {
  /** The prop's 2.0 name. */
  to?: string;
  /** Old literal → new literal. A literal missing here, or a dynamic value, makes the usage manual. */
  values?: ValueMap;
  /** The prop is gone and only changed the looks: dropped automatically. */
  drop?: true;
  /** Dropped only when it is this literal (the old default, so dropping changes nothing); otherwise manual. */
  dropIf?: string | boolean;
  /** No mechanical replacement: the usage becomes manual, with this guidance. */
  manual?: string;
  /** Added when the prop is absent, because the old default differs from the 2.0 one (`size="lg"` on the Avatar). */
  absent?: string;
  /**
   * Lenient literal map (the vocabulary): a literal listed here is rewritten, any other literal is left as it is
   * (it is already a valid value). A dynamic value keeps its expression, renamed to `to` when there is one, unless
   * `dynamicManual` says the values differ.
   */
  renameValues?: ValueMap;
  /** With `renameValues`: a dynamic value cannot be mapped (the names changed), so the usage is manual. */
  dynamicManual?: string;
}

export type TransformName =
  | 'button' // variant + color → tone + variant; iconLeft → icon + iconPosition="start"; fullWidth → className w-full
  | 'iconButton' // the same, with the old defaults (ghost + neutral) made explicit; aria-label → label
  | 'alert' // children → description; action {label, onClick} → <Button>; hideIcon → showIcon={false}
  | 'badge' // the old variants → Badge (tone/variant/value) or Status
  | 'labelToChildren' // label → children (Checkbox, Radio, Switch, FilterChip, ChoiceCard)
  | 'checkboxIndeterminate' // indeterminate → checked="indeterminate"
  | 'passwordInput' // <Input type="password"> (reveal on by default) → <PasswordInput>
  | 'stepProgress' // current (0-based) → step (1-based)
  | 'onCloseToOnOpenChange' // Modal/Drawer/BottomSheet: onClose() → onOpenChange(open)
  | 'renderPropChildren' // Menu/Popover: children as a function → manual
  | 'placement' // Menu/Popover: placement="bottom-start" → side + align
  | 'creatable' // Combobox: onCreate needs `creatable`
  | 'filterChipHref' // FilterChip: href → asChild + <a href>
  | 'tooltipChild' // Tooltip: the child must be one focusable element
  | 'emptyState' // EmptyState: icon key → lucide icon; cta → action <Button>
  | 'notice' // Notice (left the package, #33) → Alert
  | 'search' // Search (left, #33) → Input type="search" leadingIcon clearable; onSearch is manual
  | 'label' // Label (left, #33) → the field's `label`: always manual, with the guidance for this usage
  | 'themed' // Themed (left, #33) → classes ds-scope/dark on the element: always manual
  | 'skeleton' // variant → shape + width/height
  | 'textareaRows' // minRows → rows
  | 'chatBubble' // variant bot/user → align (+ variant fill for the user)
  | 'noChildren' // children have no place in the 2.0 component → manual
  | 'quickFilters' // DataTableHeader: pillFilters[] → quickFilters={<FilterChipGroup>…<FilterChip>…}
  // The 2.0.0-next vocabulary (VOCABULARY):
  | 'bubbleVocab' // Bubble: variant muted/tinted/error/typing → variant soft + tone, typing
  | 'badgeHighlight' // Badge: variant="highlight" → variant="soft" tone="accent"
  | 'statMuted' // Stat: tone="muted" → muted
  | 'rowActionsItems'; // RowActions: items[].variant → items[].tone (default → neutral)

export interface ComponentRule {
  /** Which wave changed it, for the reader. */
  wave: string;
  /** The 2.0 export name, when it was renamed. */
  to?: string;
  props?: Record<string, PropRule>;
  /** Props the 2.0 component requires: a usage without them is manual, with this guidance. */
  require?: Record<string, string>;
  /** Props that only exist in 2.0: a usage with any of them is already migrated. */
  newApiProps?: string[];
  transforms?: TransformName[];
  /** Every usage is manual (structural change), with this guidance. */
  manual?: string;
  /** With `manual`: the component belongs to a group reported once (the Table's cells). */
  silent?: boolean;
  /**
   * Part of a family: when one of these components is in the file and stays on the old API (manual), this one stays
   * too, so a Menu left for a person never ends up with DropdownMenuItems inside.
   */
  follows?: string[];
}

const OVERLAY_COMMON: Record<string, PropRule> = {
  subtitle: { to: 'description' },
  closeOnBackdrop: {
    dropIf: true,
    manual: 'closeOnBackdrop={false} saiu: o overlay (Radix) sempre fecha no clique fora. Se precisa impedir, controle `open` e ignore o fechamento em onOpenChange.',
  },
  hideClose: {
    dropIf: false,
    manual: 'hideClose saiu: o × faz parte do overlay na 2.0. Revise se o fluxo precisa mesmo esconder o fechamento.',
  },
};

const FIELD_COMMON: Record<string, PropRule> = {
  helper: { to: 'hint' },
  // The old `error` was the message (string); in 2.0 `error` is a boolean and the message is `errorMessage`.
  error: { to: 'errorMessage' },
  size: { drop: true }, // fields are one size in 2.0
  optional: { drop: true }, // 2.0 marks only `required`
};

/** The guidance shared by the product components that left the DS in wave 6 (#33). */
const PRODUCT_LEFT = 'saiu do DS na 2.0 (componente de produto): recrie no app, com uma cópia local ou sobre os componentes 2.0';

export const COMPONENTS: Record<string, ComponentRule> = {
  // ── Actions (wave 1, #14) ───────────────────────────────────────────────────────────────────────
  Button: {
    wave: 'onda 1 (#14)',
    // `tone` only exists in 2.0: a Button with it is already migrated.
    newApiProps: ['tone'],
    // `size` stays as it is: the 2.0 Button has sm/md/lg again (#34, 36/44/52), the same names as the 1.x.
    props: {
      iconRight: { to: 'icon' }, // the 2.0 icon sits after the label by default (iconPosition="end")
    },
    // iconLeft → icon + iconPosition="start" (#34), inside the `button` transform (both icons at once is manual).
    transforms: ['button'],
  },
  IconButton: {
    wave: 'onda 1 (#14)',
    newApiProps: ['tone', 'label'],
    // `size` stays: the 2.0 IconButton has sm/md/lg (#34, 36/44/52), the same names as the 1.x.
    transforms: ['iconButton'],
  },
  Toggle: {
    // The old toggle.tsx was an on/off switch. In 2.0 `Toggle` is the pressable button: same name, other thing.
    wave: 'onda 1 (#14)',
    to: 'Switch',
    newApiProps: ['pressed', 'defaultPressed', 'onPressedChange', 'variant', 'icon'],
    props: {
      description: { to: 'hint' },
      size: { drop: true },
      labelPosition: {
        dropIf: 'right',
        manual: 'labelPosition="left" saiu: o Switch 2.0 tem o texto sempre à direita.',
      },
    },
    transforms: ['labelToChildren'],
  },
  Chip: {
    wave: 'onda 1 (#14)',
    newApiProps: ['icon', 'removeLabel', 'removedMessage'],
    props: {
      leading: { to: 'icon' },
      subtle: { drop: true },
      onClick: {
        manual: 'O Chip 2.0 não é botão (só o × remove). Para escolher, use FilterChip ou Toggle.',
      },
      selected: { manual: 'selected saiu do Chip: o estado de escolha é do FilterChip (`pressed`).' },
      highlight: { manual: 'highlight (sugestão de IA) saiu do Chip 2.0: não há variante equivalente.' },
    },
  },
  ToggleGroup: {
    wave: 'onda 1 (#14)',
    newApiProps: ['variant'],
    props: {
      options: {
        manual: 'ToggleGroup virou Radix: troque options[] por filhos <ToggleGroupItem value>…, onChange por onValueChange e dê aria-label.',
      },
    },
  },

  // ── Forms (wave 1, #14) ─────────────────────────────────────────────────────────────────────────
  Input: {
    wave: 'onda 1 (#14)',
    props: {
      ...FIELD_COMMON,
      iconLeft: { to: 'leadingIcon' },
      iconRight: { to: 'trailingIcon' },
      showCount: { manual: 'showCount saiu do Input 2.0: mostre a contagem no `hint` se ela importa.' },
    },
    transforms: ['passwordInput'],
  },
  Textarea: {
    wave: 'onda 1 (#14)',
    props: {
      ...FIELD_COMMON,
      autoResize: { drop: true }, // the 2.0 textarea is resizable by the person
      maxRows: { drop: true },
      showCount: { manual: 'showCount saiu do Textarea 2.0: mostre a contagem no `hint` se ela importa.' },
    },
    transforms: ['textareaRows'],
  },
  Select: {
    wave: 'onda 1 (#14)',
    newApiProps: ['onValueChange'],
    manual:
      'Select virou Radix: troque options[] (ou <option>) por filhos <SelectItem value>…</SelectItem>, onChange(evento) por onValueChange(valor), helper→hint, error→errorMessage.',
  },
  Checkbox: {
    wave: 'onda 1 (#14)',
    newApiProps: ['hint', 'onCheckedChange', 'errorMessage'],
    props: {
      description: { to: 'hint' },
      error: { to: 'errorMessage' },
      size: { drop: true },
    },
    transforms: ['labelToChildren', 'checkboxIndeterminate'],
  },
  Radio: {
    wave: 'onda 1 (#14)',
    newApiProps: ['hint'],
    props: {
      description: { to: 'hint' },
      size: { drop: true },
      error: { manual: 'O Radio 2.0 não tem erro próprio: o erro é do RadioGroup (`errorMessage`).' },
    },
    transforms: ['labelToChildren'],
  },
  RadioGroup: {
    wave: 'onda 1 (#14)',
    props: {
      options: {
        manual: 'RadioGroup 2.0 recebe filhos <Radio value>texto</Radio> no lugar de options[]; onChange vira onValueChange e legend é obrigatório.',
      },
    },
  },
  Slider: {
    wave: 'onda 1 (#14)',
    newApiProps: ['onValueChange'],
    props: {
      onChange: { to: 'onValueChange' }, // same signature: (value: number) => void
      size: { drop: true },
      showRange: { drop: true },
    },
  },
  Combobox: {
    wave: 'onda 1 (#14)',
    newApiProps: ['onValueChange', 'multiple', 'creatable'],
    props: {
      multi: { to: 'multiple' },
      onChange: { to: 'onValueChange' }, // single mode: nothing chosen is now '' (was null)
      size: { drop: true },
      width: { drop: true },
      filter: { manual: 'filter saiu: o Combobox 2.0 filtra sozinho, ignorando caixa e acento.' },
      triggerContent: { manual: 'triggerContent saiu: o Combobox 2.0 é um campo de texto com filtro, não um botão.' },
      dropdownMinWidth: { drop: true },
    },
    transforms: ['creatable'],
  },
  DatePicker: {
    wave: 'onda 1 (#14)',
    newApiProps: ['onValueChange', 'isDateDisabled'],
    manual:
      'DatePicker 2.0 usa data ISO (string AAAA-MM-DD), não Date: value/onChange viram value/onValueChange com string, min/max viram isDateDisabled.',
  },
  FilterChip: {
    wave: 'onda 1 (#14)',
    // `active` became `pressed` in the vocabulary (VOCABULARY.FilterChip renames it after these rules).
    newApiProps: ['onActiveChange', 'defaultActive', 'asChild', 'pressed', 'defaultPressed', 'onPressedChange'],
    transforms: ['labelToChildren', 'filterChipHref'],
  },
  FilterChipGroup: {
    wave: 'onda 1 (#14)',
    props: {
      items: {
        manual: 'FilterChipGroup recebe os <FilterChip> como filhos no lugar de items[]/active; o `label` vira aria-label.',
      },
    },
  },
  ChoiceCard: {
    wave: 'onda 3 (#16)',
    newApiProps: ['onSelect'],
    props: { onClick: { to: 'onSelect' } },
    transforms: ['labelToChildren'],
  },

  // ── Feedback and indicators (wave 2, #15) ───────────────────────────────────────────────────────
  Alert: {
    wave: 'onda 2 (#15)',
    newApiProps: ['tone', 'showIcon', 'announce'],
    // AlertVariant and AlertTone have the same five values: a dynamic `variant` moves as it is.
    props: {
      variant: { to: 'tone' },
      icon: { manual: 'O Alert 2.0 não aceita ícone próprio: o ícone é o do tom (showIcon liga ou desliga).' },
    },
    require: { title: 'O Alert 2.0 exige `title` (o que aconteceu, numa linha); o texto vai em `description`.' },
    transforms: ['alert'],
  },
  Notice: {
    // Deprecated wrapper over the Alert since wave 2; it left the package with the product components (#33).
    // severity info/success/warning/critical → tone info/success/warning/danger; announce as the wrapper did
    // (alert on critical, status otherwise).
    wave: 'onda 2 (#15) / onda 6 (#33)',
    transforms: ['notice'],
  },
  Spinner: {
    wave: 'onda 2 (#15)',
    newApiProps: ['tone', 'showLabel'],
    props: {
      // 2.0 has only neutral and inverse: the old current/brand/muted all become the neutral ring (the default).
      color: { to: 'tone', values: { inverse: 'inverse', current: null, brand: null, muted: null } },
      // By size in px: xs 12 and sm 16 → sm 16; md 20 and lg 24 → md 24 (the 2.0 default); xl 32 → lg 32.
      size: { values: { xs: 'sm', sm: 'sm', md: null, lg: null, xl: 'lg' } },
    },
  },
  Badge: {
    wave: 'onda 2 (#15)',
    newApiProps: ['tone', 'value'],
    transforms: ['badge'],
  },
  StepProgress: {
    wave: 'onda 2 (#15)',
    newApiProps: ['step'],
    transforms: ['stepProgress'],
  },
  Tooltip: {
    wave: 'onda 2 (#15)',
    newApiProps: ['text'],
    props: {
      content: { to: 'text' },
      // The bubble's and the wrapper's classes: the 2.0 Tooltip has no wrapper and a fixed bubble.
      className: { drop: true },
      wrapperClassName: { drop: true },
    },
    transforms: ['tooltipChild'],
  },
  Toaster: {
    wave: 'onda 2 (#15)',
    props: { position: { drop: true } }, // one position in 2.0
  },
  ToastVisual: {
    wave: 'onda 2 (#15)',
    manual: 'ToastVisual virou ToastView: message→title, variant→tone (error→danger), saem animate/origin/dismissible; onDismiss→onClose.',
  },
  Popover: {
    wave: 'onda 2 (#15)',
    newApiProps: ['side', 'align', 'defaultOpen', 'title'],
    props: {
      offset: { drop: true },
      closeOnOutsideClick: { dropIf: true, manual: 'closeOnOutsideClick={false} saiu: o Popover (Radix) fecha no clique fora.' },
      closeOnEsc: { dropIf: true, manual: 'closeOnEsc={false} saiu: o Popover (Radix) fecha com Esc.' },
      triggerClassName: {
        manual: 'triggerClassName saiu: o Popover 2.0 não embrulha o gatilho; passe a classe direto no elemento do trigger.',
      },
    },
    transforms: ['renderPropChildren', 'placement'],
  },

  // ── Overlays (wave 2, #15) ──────────────────────────────────────────────────────────────────────
  Modal: {
    wave: 'onda 2 (#15)',
    to: 'Dialog',
    props: {
      ...OVERLAY_COMMON,
      size: {
        values: { sm: 'sm', md: null, lg: 'lg' },
        manual: 'O Dialog tem só sm, md e lg: xl e full saíram. Escolha lg ou troque por Sheet.',
      },
      headerAction: {
        manual: 'headerAction saiu do Dialog: leve a ação para o conteúdo ou para o rodapé (`footer`).',
      },
    },
    require: { title: 'O Dialog exige `title`: é o nome da janela para o leitor de tela.' },
    transforms: ['onCloseToOnOpenChange'],
  },
  Drawer: {
    // The 1.x Drawer (side panel) is the 2.0 Sheet. The 2.0 Drawer is the 1.x BottomSheet.
    wave: 'onda 2 (#15)',
    to: 'Sheet',
    newApiProps: ['onOpenChange', 'trigger', 'defaultOpen', 'description', 'confirmLabel', 'onConfirm'],
    props: {
      ...OVERLAY_COMMON,
      size: { manual: 'O Sheet 2.0 tem largura fixa do Figma: `size` saiu.' },
      width: { manual: 'O Sheet 2.0 tem largura fixa do Figma: `width` saiu.' },
    },
    require: { title: 'O Sheet exige `title`: é o nome do painel para o leitor de tela.' },
    transforms: ['onCloseToOnOpenChange'],
  },
  BottomSheet: {
    wave: 'onda 2 (#15)',
    to: 'Drawer',
    props: {
      closeOnBackdrop: OVERLAY_COMMON.closeOnBackdrop,
      snap: { dropIf: 'auto', manual: 'snap saiu: o Drawer 2.0 cresce com o conteúdo até o limite da tela.' },
      hideHeader: { dropIf: false, manual: 'hideHeader saiu: o Drawer 2.0 sempre mostra título e ×.' },
    },
    require: { title: 'O Drawer exige `title`: é o nome do painel para o leitor de tela.' },
    transforms: ['onCloseToOnOpenChange'],
  },
  Menu: {
    wave: 'onda 2 (#15)',
    to: 'DropdownMenu',
    props: { minWidth: { drop: true } },
    transforms: ['renderPropChildren', 'placement'],
  },
  MenuItem: {
    wave: 'onda 2 (#15)',
    to: 'DropdownMenuItem',
    // Inside a ContextMenu the item is a ContextMenuItem, not a DropdownMenuItem: it migrates with it, by hand.
    follows: ['Menu', 'ContextMenu'],
    props: {
      onClick: { to: 'onSelect' },
      variant: { to: 'tone', values: { default: null, danger: 'danger' } },
      trailing: { manual: 'trailing saiu: o DropdownMenuItem tem `shortcut` (texto à direita) e submenu não existe.' },
      selected: { manual: 'selected saiu: para escolha única use DropdownMenuRadioGroup + DropdownMenuRadioItem.' },
    },
  },
  MenuSeparator: { wave: 'onda 2 (#15)', to: 'DropdownMenuSeparator', follows: ['Menu', 'ContextMenu'] },
  MenuLabel: {
    wave: 'onda 2 (#15)',
    manual: 'MenuLabel saiu: o DropdownMenu 2.0 não tem rótulo de grupo; separe grupos com DropdownMenuSeparator.',
  },
  ContextMenu: {
    wave: 'onda 2 (#15)',
    newApiProps: ['items'],
    manual:
      'ContextMenu virou Radix: `menu` vira `items` com <ContextMenuItem>/<ContextMenuSeparator> (não MenuItem), render-prop sai; o filho precisa ser um elemento só.',
  },

  // ── Content and navigation (wave 3, #16) ────────────────────────────────────────────────────────
  EmptyState: {
    wave: 'onda 3 (#16)',
    to: 'Empty',
    props: { size: { drop: true } },
    transforms: ['emptyState', 'noChildren'],
  },
  Divider: {
    wave: 'onda 3 (#16)',
    to: 'Separator',
    props: { variant: { drop: true } },
    transforms: ['noChildren'],
  },
  PageTabs: {
    wave: 'onda 3 (#16)',
    manual:
      'PageTabs saiu: use <Tabs value onValueChange><TabsList aria-label>{<TabsTrigger value count dot soon>}</TabsList></Tabs>; para rotas, TabsTrigger asChild com o Link e value vindo da rota.',
  },
  Card: {
    wave: 'onda 3 (#16)',
    newApiProps: ['surface', 'as'],
    props: {
      // 2.0 `variant` (vocabulary, 03/10/2026): outline is the old `outlined` (border, no shadow); `elevated` was the
      // old default and is the 2.0 default (surface). filled/flat/invert have no faithful variant. The 2.0 values
      // are listed too, so a 2.0 usage passes untouched.
      variant: {
        values: { outlined: 'outline', elevated: null, surface: 'surface', soft: 'soft', outline: 'outline' },
        manual: 'Card perdeu as variantes filled/flat/invert: use variant="surface", "outline" ou "soft" e size.',
      },
      interactive: {
        manual: 'Card perdeu `interactive`: para card clicável, ponha um link/botão de verdade dentro (o título, por exemplo).',
      },
    },
  },
  DataTableHeader: {
    wave: '2.0.0-next (03/10/2026)',
    newApiProps: ['quickFilters', 'view'],
    transforms: ['quickFilters'],
  },
  CardBody: {
    wave: 'onda 3 (#16)',
    to: 'CardContent',
    props: { noPadding: { manual: 'CardContent não tem noPadding: o espaçamento é o do Card (size md ou sm).' } },
  },
  CardTitle: {
    wave: 'onda 3 (#16)',
    manual: 'CardTitle saiu: o título vai em <CardHeader title="…" />.',
  },
  CardHeader: {
    wave: 'onda 3 (#16)',
    newApiProps: ['titleAs', 'align'],
    props: { badge: { manual: 'CardHeader perdeu `badge`: leve o Badge para `action` ou para o título.' } },
    require: { title: 'O CardHeader 2.0 exige `title` (e não usa children).' },
  },
  Accordion: {
    wave: 'onda 3 (#16)',
    newApiProps: ['onValueChange'],
    props: {
      type: { values: { single: 'single', multi: 'multiple' } },
      onChange: { to: 'onValueChange' },
      collapsible: { dropIf: true, manual: 'collapsible={false} saiu: no Accordion 2.0 o item aberto sempre pode fechar.' },
    },
  },
  AccordionItem: {
    wave: 'onda 3 (#16)',
    newApiProps: ['titleAs'],
    props: {
      meta: { manual: 'AccordionItem perdeu `meta`: leve a contagem/etiqueta para dentro do `title`.' },
      icon: { manual: 'AccordionItem perdeu `icon`.' },
    },
  },
  Avatar: {
    wave: 'onda 3 (#16)',
    newApiProps: ['type', 'fallbackText', 'showBadge', 'badgeLabel'],
    props: {
      // By size in px: xs 24 → sm 24; sm 32 → md 32 (the 2.0 default); md 40 (the old default) → lg 40; xl 64 → xl 56.
      size: {
        values: { xs: 'sm', sm: null, md: 'lg', xl: 'xl' },
        absent: 'lg',
        manual: 'Avatar lg (48px) não tem tamanho igual na 2.0: escolha lg (40) ou xl (56).',
      },
      status: { manual: 'Avatar perdeu `status`: use showBadge + badgeLabel, ou um <Status> ao lado.' },
      variant: {
        manual: 'Avatar perdeu variant brand/neutral: type="brand" é logo de marca (quadrado), não cor. O que o Avatar mostra (foto, iniciais, ícone) é o `content` do Figma e sai das props.',
      },
      alt: { manual: 'Avatar perdeu `alt`: o nome acessível vem de `name`.' },
    },
  },
  AvatarGroup: {
    wave: 'onda 3 (#16)',
    props: {
      spacing: { drop: true },
      size: {
        values: { xs: 'sm', sm: null, md: 'lg' },
        absent: 'lg',
        manual: 'AvatarGroup não tem lg (48) nem xl: escolha sm, md ou lg.',
      },
    },
    require: { 'aria-label': 'AvatarGroup 2.0 exige aria-label (quem são: "Equipe do projeto").' },
  },
  Skeleton: {
    wave: 'onda 3 (#16)',
    newApiProps: ['shape'],
    props: {
      count: { manual: 'Skeleton perdeu `count`: repita o <Skeleton> (ou use PageSkeleton/CardsSkeleton).' },
      gap: { manual: 'Skeleton perdeu `gap` (era do `count`).' },
      noPulse: { manual: 'Skeleton perdeu `noPulse`: a animação segue prefers-reduced-motion.' },
    },
    transforms: ['skeleton'],
  },
  Table: {
    wave: 'onda 3 (#16)',
    newApiProps: ['caption', 'status', 'showCaption'],
    manual:
      'Table 2.0: TableHead (thead) vira TableHeader, Th vira TableHead, Td vira TableCell, align left/right vira start/end e `caption` é obrigatório.',
  },
  // The old cells: reported once with the Table (they are only migrated together).
  Th: { wave: 'onda 3 (#16)', manual: 'Th virou TableHead (e o TableHead antigo, o thead, virou TableHeader).', silent: true },
  Td: { wave: 'onda 3 (#16)', manual: 'Td virou TableCell.', silent: true },
  Breadcrumb: {
    wave: 'onda 3 (#16)',
    props: { separator: { drop: true } },
  },
  SavingBar: {
    wave: 'onda 1 (#14)',
    newApiProps: ['status'],
    props: {
      visible: { manual: 'SavingBar perdeu `visible`: renderize só quando houver mudança ({dirty && <SavingBar …/>}).' },
      pending: { manual: 'SavingBar: pending vira status="saving".' },
      variant: { drop: true },
    },
  },

  // ── Chat and external (wave 4, #17) ─────────────────────────────────────────────────────────────
  ChatBubble: {
    wave: 'onda 4 (#17)',
    to: 'Bubble',
    props: {
      ariaLabel: { to: 'aria-label' },
      state: { manual: 'ChatBubble `state` (editing/pending) não existe no Bubble: use variant="soft" tone="danger" para não enviada.' },
      dim: { manual: 'ChatBubble `dim` saiu do Bubble.' },
    },
    transforms: ['chatBubble'],
  },
  PhoneFrame: { wave: 'onda 4 (#17)', to: 'Phone' },

  // ── Wave 6 (#33): product components that left the public DS ────────────────────────────────────
  PaywallContent: {
    wave: 'onda 6 (#33)',
    manual: `PaywallContent ${PRODUCT_LEFT}. Era o miolo visual do paywall: ícone, título, descrição, motivo (feature, limit, trial_value) e CTA de plano.`,
  },
  PaywallState: {
    wave: 'onda 6 (#33)',
    manual: `PaywallState ${PRODUCT_LEFT}. Era o paywall como estado de página (o PaywallContent ocupando a altura disponível).`,
  },
  PaywallModal: {
    wave: 'onda 6 (#33)',
    manual: `PaywallModal ${PRODUCT_LEFT}. Era o paywall num modal (PaywallContent dentro de um Dialog, open/onClose); refaça com o Dialog da 2.0.`,
  },
  PaywallBanner: {
    wave: 'onda 6 (#33)',
    manual: `PaywallBanner ${PRODUCT_LEFT}. Era a faixa de gate de plano (warn/blocked) com título, descrição e CTA de upgrade; o Alert da 2.0 é uma boa base.`,
  },
  BlockerCard: {
    wave: 'onda 6 (#33)',
    manual: `BlockerCard ${PRODUCT_LEFT}. Era o destaque bloqueante (limite atingido, plano expirado) com tom danger/warning/info, título, descrição e ação/link; o Alert da 2.0 é uma boa base.`,
  },
  CopilotHint: {
    wave: 'onda 6 (#33)',
    manual: `CopilotHint ${PRODUCT_LEFT}. Era a dica do copiloto com título, descrição, CTA, prioridade (high/medium/low) e dispensa lembrada no localStorage; o Alert tone="info" com onClose é uma boa base.`,
  },

  // ── Wave 6 (#33): legacy that left for redundancy ───────────────────────────────────────────────
  FormCardHeader: {
    // The section header with an icon chip is the 2.0 CardHeader: icon, title, description, action.
    wave: 'onda 6 (#33)',
    to: 'CardHeader',
    props: { subtitle: { to: 'description' } },
    require: { title: 'O CardHeader exige `title`.' },
    transforms: ['noChildren'],
  },
  Search: {
    // A search is an Input: type="search", the magnifier as leadingIcon and the clear button with `clearable`.
    wave: 'onda 6 (#33)',
    transforms: ['search'],
  },
  Label: {
    // Always manual: the label belongs to the field, which may be anywhere (or not be a DS field at all).
    wave: 'onda 6 (#33)',
    transforms: ['label'],
  },
  Themed: {
    wave: 'onda 6 (#33)',
    transforms: ['themed'],
  },

  // ── Figma alignment of the 19 code-only components (2.0) ───────────────────────────────────────
  ToggleCardCompact: {
    // Figma [RDS] Forms/ToggleCard has one component with layout=default|compact: the same props, one name.
    wave: 'alinhamento Figma (19 componentes)',
    to: 'ToggleCard',
    props: { layout: { absent: 'compact' } },
  },
  CurrencyInput: {
    wave: 'alinhamento Figma (19 componentes)',
    props: { size: { drop: true } }, // ignored since 2.0: the [RDS] Input has one height (44)
  },
  SelectableCard: {
    // A thin wrapper over ChoiceCard layout="row": a native radio, never a link.
    wave: 'alinhamento Figma (19 componentes)',
    props: {
      indicator: { drop: true }, // looks only: the row always shows its radio
      as: {
        dropIf: 'button',
        manual: 'SelectableCard as="a" saiu: o card é um radio, não um link. Navegue em onClick, ou use um <a> fora do card.',
      },
      href: { manual: 'SelectableCard perdeu `href`: o card é um radio, não um link. Navegue em onClick, ou use um <a> fora do card.' },
      ribbon: { manual: 'SelectableCard perdeu `ribbon`: o ChoiceCard não tem fita. Leve o texto para o rótulo (children).' },
    },
  },
  ChoicePreviewCard: {
    // A thin wrapper over ChoiceCard layout="preview".
    wave: 'alinhamento Figma (19 componentes)',
    props: {
      previewAspect: { drop: true }, // looks only: the picture is always 16:9
      locked: {
        dropIf: false,
        manual: 'ChoicePreviewCard perdeu `locked`: o ChoiceCard não tem estado travado. Use `disabled` e explique o motivo em `description`.',
      },
      badge: { manual: 'ChoicePreviewCard perdeu `badge`: o ChoiceCard não tem selo na imagem. Leve o texto para `description`.' },
    },
  },
  ImageUpload: {
    // A thin wrapper over FileInput layout="tile": always the tile, whatever the variant or the aspect.
    wave: 'alinhamento Figma (19 componentes)',
    props: {
      aspect: { drop: true },
      variant: { drop: true },
      previewClassName: { drop: true },
      previewWrapperClassName: { drop: true },
    },
  },

  // ── 2.0 renames (the old names stay as deprecated aliases) ──────────────────────────────────────
  // Same props: only the name, the file and the `rds-*` classes changed.
  FloatingStepper: { wave: 'renomes 2.0', to: 'Stepper' },
  ImageCropModal: { wave: 'renomes 2.0', to: 'ImageCropDialog' },
};

/** Type-only exports: renamed (`to`) or gone/changed with no mechanical path (`manual`). */
export const TYPES: Record<string, { to?: string; manual?: string; follows?: string }> = {
  AlertVariant: { to: 'AlertTone' }, // same five values
  ModalProps: { to: 'DialogProps', follows: 'Modal' },
  DrawerProps: { to: 'SheetProps', follows: 'Drawer' },
  BottomSheetProps: { to: 'DrawerProps', follows: 'BottomSheet' },
  MenuProps: { to: 'DropdownMenuProps', follows: 'Menu' },
  MenuItemProps: { to: 'DropdownMenuItemProps', follows: 'MenuItem' },
  EmptyStateProps: { to: 'EmptyProps', follows: 'EmptyState' },
  DividerProps: { to: 'SeparatorProps', follows: 'Divider' },
  ChatBubbleProps: { to: 'BubbleProps', follows: 'ChatBubble' },
  PhoneFrameProps: { to: 'PhoneProps', follows: 'PhoneFrame' },
  ToggleProps: { to: 'SwitchProps', follows: 'Toggle' },
  ButtonColor: { manual: 'ButtonColor saiu: a cor virou `tone` (ButtonTone: action, neutral, danger, inverse).' },
  ButtonVariant: { manual: 'ButtonVariant mudou de valores: fill, outline, ghost (tonal e link saíram).' },
  IconButtonVariant: { manual: 'IconButtonVariant saiu: use ButtonVariant (fill, outline, ghost).' },
  IconButtonColor: { manual: 'IconButtonColor saiu: use ButtonTone (action, neutral, danger, inverse).' },
  IconButtonSize: { to: 'ButtonSize' }, // the same sm/md/lg (#34)
  BadgeVariant: { manual: 'BadgeVariant mudou: fill e soft (soft no tone accent é o marca-texto; o status com bolinha virou o componente Status).' },
  ToastVariant: { manual: 'ToastVariant mudou: a cor é ToastTone (neutral, info, success, warning, danger); variant é outline/soft/fill.' },
  ToastPosition: { manual: 'ToastPosition saiu: o Toaster 2.0 tem uma posição só.' },
  ToastOptions: { manual: 'ToastOptions mudou de forma: { title, description, tone, variant } (title obrigatório; variant de cor virou tone).' },
  ToastVisualProps: { manual: 'ToastVisualProps virou ToastViewProps, com outra forma.' },
  EmptyStateIcon: { manual: 'EmptyStateIcon saiu: o Empty recebe o ícone como elemento (icon={<Package />}).' },
  EmptyStateCta: { manual: 'EmptyStateCta saiu: o Empty recebe a ação como elemento (action={<Button>…</Button>}).' },
  DataTablePillDef: {
    manual: 'DataTablePillDef saiu: os filtros rápidos do DataTableHeader são um slot (quickFilters), com <FilterChipGroup> e <FilterChip> dentro.',
  },
  PageTab: { manual: 'PageTab saiu com o PageTabs: cada aba vira um <TabsTrigger>.' },
  PageTabsProps: { manual: 'PageTabsProps saiu com o PageTabs: use TabsProps.' },
  ChatBubbleVariant: { manual: 'ChatBubbleVariant saiu: o lado é BubbleAlign (start/end) e a superfície é BubbleVariant.' },
  ChatBubbleState: { manual: 'ChatBubbleState saiu do Bubble.' },
  PopoverPlacement: { manual: 'PopoverPlacement saiu: use PopoverSide + PopoverAlign.' },
  AvatarStatus: { manual: 'AvatarStatus saiu: o Avatar 2.0 usa showBadge.' },
  FilterChipItem: { manual: 'FilterChipItem saiu: o FilterChipGroup recebe <FilterChip> como filhos.' },
  ToggleOption: { manual: 'ToggleOption deixou de ser exportado: use <ToggleGroupItem>.' },
  DrawerSize: { manual: 'DrawerSize saiu: o Sheet 2.0 tem largura fixa.' },
  // CardVariant is a 2.0 name again (surface, soft, outline): an import of it is left alone; the typecheck shows a
  // 1.x value (filled, flat…) that no longer fits.
  SpinnerColor: { manual: 'SpinnerColor saiu: use SpinnerTone (neutral, inverse).' },
  // Wave 6 (#33).
  FormCardHeaderProps: { to: 'CardHeaderProps', follows: 'FormCardHeader' }, // subtitle is `description` there
  SearchProps: { to: 'InputProps', follows: 'Search' },
  LabelProps: { manual: 'LabelProps saiu com o Label: o rótulo é a prop `label` do campo.' },
  ThemedProps: { manual: 'ThemedProps saiu com o Themed: o tema é a classe ds-scope (e dark) no elemento.' },
  NoticeProps: { manual: 'NoticeProps saiu com o Notice: use AlertProps (tone no lugar de severity, action como elemento).' },
  NoticeSeverity: { manual: 'NoticeSeverity saiu com o Notice: use AlertTone (critical virou danger).' },
  NoticeIntent: { manual: 'NoticeIntent saiu com o Notice: o Alert não tem intent.' },
  PaywallContentProps: { manual: `PaywallContentProps ${PRODUCT_LEFT}.` },
  PaywallStateProps: { manual: `PaywallStateProps ${PRODUCT_LEFT}.` },
  PaywallModalProps: { manual: `PaywallModalProps ${PRODUCT_LEFT}.` },
  PaywallReason: { manual: `PaywallReason ${PRODUCT_LEFT}.` },
  PaywallIcon: { manual: `PaywallIcon ${PRODUCT_LEFT}.` },
  PaywallBannerProps: { manual: `PaywallBannerProps ${PRODUCT_LEFT}.` },
  BlockerCardProps: { manual: `BlockerCardProps ${PRODUCT_LEFT}.` },
  BlockerCardTone: { manual: `BlockerCardTone ${PRODUCT_LEFT}.` },
  CopilotHintProps: { manual: `CopilotHintProps ${PRODUCT_LEFT}.` },
  CopilotHintPriority: { manual: `CopilotHintPriority ${PRODUCT_LEFT}.` },
  // Figma alignment of the 19 code-only components (2.0).
  ToggleCardCompactProps: { to: 'ToggleCardProps', follows: 'ToggleCardCompact' },
  ImageUploadAspect: { manual: 'ImageUploadAspect saiu com a prop `aspect` do ImageUpload (o tile é sempre quadrado).' },
  ImageUploadVariant: { manual: 'ImageUploadVariant saiu com a prop `variant` do ImageUpload (é sempre o tile).' },
  // 2.0 renames.
  FloatingStepperProps: { to: 'StepperProps', follows: 'FloatingStepper' },
  FloatingStepperStep: { to: 'StepperStep', follows: 'FloatingStepper' },
  ImageCropModalProps: { to: 'ImageCropDialogProps', follows: 'ImageCropModal' },
};

/** Value exports gone with no mechanical replacement. */
export const EXPORTS_MANUAL: Record<string, string> = {
  buttonVariants:
    'buttonVariants saiu: para link com cara de botão use <Button asChild><a href>…</a></Button>; para outra coisa, as classes rds-button do CSS novo.',
  homeItem: 'homeItem saiu do Breadcrumb: escreva o item { label: "Início", href: "/" } direto.',
  ICON_MAP: 'ICON_MAP saiu com o EmptyState: importe os ícones do lucide-react.',
  themeClass:
    "themeClass saiu (#33): ponha as classes direto no elemento: ds-scope, e dark no modo escuro (mais a theme-<nome> se o CSS de tema congelado no app usa esse seletor). Ex.: className={dark ? 'ds-scope dark' : 'ds-scope'}.",
};

/**
 * Exports that moved to another entry point of the package, whatever file they were imported from. The specifier
 * leaves its declaration and gets its own import from the new entry (wave 6, #33).
 */
export const MOVED_EXPORTS: Record<string, string> = {
  PixIcon: '@rojaostudio/ds/icons',
  PixIconProps: '@rojaostudio/ds/icons',
  // Out of the barrel because they import optional peers (#2): only their own entry point has them.
  PhoneInput: '@rojaostudio/ds/components/phone-input',
  PhoneInputProps: '@rojaostudio/ds/components/phone-input',
  ImageCropDialog: '@rojaostudio/ds/components/image-crop-dialog',
  ImageCropDialogProps: '@rojaostudio/ds/components/image-crop-dialog',
  CropPreset: '@rojaostudio/ds/components/image-crop-dialog',
  // The old name, when a file keeps it: its own (deprecated) entry point still exists.
  ImageCropModal: '@rojaostudio/ds/components/image-crop-modal',
  ImageCropModalProps: '@rojaostudio/ds/components/image-crop-modal',
  ImageUpload: '@rojaostudio/ds/components/image-upload',
  ImageUploadProps: '@rojaostudio/ds/components/image-upload',
  ImageUploadLabels: '@rojaostudio/ds/components/image-upload',
};

/**
 * Deprecated wrappers that are still in the 2.0 package (they compile and render): not transformed, only listed in
 * the report so the move to the 2.0 component can be planned. Keys are export names; `PageShell.Header` is the
 * compound member.
 */
export const DEPRECATED: Record<string, string> = {
  Dropzone: 'Dropzone é deprecated: migre para <FileInput layout="dropzone">.',
  ImageUpload: 'ImageUpload é deprecated: migre para <FileInput layout="tile"> (upload em onFiles, URL em preview).',
  PricingCard: 'PricingCard é deprecated: migre para <PricingPlan> dentro de um <Pricing>.',
  TypingIndicator: 'TypingIndicator é deprecated: migre para <Bubble typing />.',
  SelectableCard: 'SelectableCard é deprecated: migre para <ChoiceCard layout="row">.',
  OptionTile: 'OptionTile é deprecated: migre para <ChoiceCard layout="tile">.',
  OptionTileGrid: 'OptionTileGrid é deprecated: migre para <ChoiceCardGroup layout="tile">.',
  ChoicePreviewCard: 'ChoicePreviewCard é deprecated: migre para <ChoiceCard layout="preview">.',
  SettingRow: 'SettingRow é deprecated: migre para <Item> (title, description, media e o controle ao lado).',
  SectionHeader: 'SectionHeader é deprecated: migre para <PageHeader titleAs="h2">.',
  'PageShell.Header': 'PageShell.Header é deprecated: migre para <PageHeader> (title, actions; eyebrow vira description).',
};

/** IconButton (#29): the icon alone does not say what it does, so it goes with a Tooltip. Reported, never written. */
export const ICON_BUTTON_TOOLTIP =
  'IconButton anda com Tooltip (#29): envolva cada um num <Tooltip text> com o mesmo texto do `label`. O codemod não mexe nisso.';

/** Toast (wave 2, #15): the old `toast.<variant>()` and `variant` → the 2.0 `tone`. `null` = the default tone. */
export const TOAST_TONES: Record<string, string | null> = {
  default: null,
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'info',
};

export const TOAST_MANUAL: Record<string, string> = {
  promise: 'toast.promise saiu: chame toast({ title, tone }) você mesmo no sucesso e no erro da promise.',
  loading: 'toast.loading saiu: o toast 2.0 não tem estado de carregamento; mostre o progresso na tela (Spinner/Button loading).',
  options: 'toast com opções que não são um objeto literal: troque à mão para toast({ title, description, tone }).',
};

/**
 * Badge (wave 2, #15). The old variants split in two components:
 *  - the labels stay a Badge (neutral or action);
 *  - the coloured states (success…, and the old dot statuses active…) become a `Status`, the only 2.0
 *    indicator with those tones. The old label variants had a tinted background: Status variant="soft".
 */
export const BADGE_VARIANTS: Record<string, { component: 'Badge' | 'Status'; attrs: Record<string, string> }> = {
  default: { component: 'Badge', attrs: { variant: 'soft' } }, // light surface + muted text → neutral soft
  neutral: { component: 'Badge', attrs: { variant: 'soft' } },
  primary: { component: 'Badge', attrs: { tone: 'neutral', variant: 'fill' } }, // the owner's call: a solid neutral label
  success: { component: 'Status', attrs: { tone: 'success', variant: 'soft' } },
  warning: { component: 'Status', attrs: { tone: 'warning', variant: 'soft' } },
  danger: { component: 'Status', attrs: { tone: 'danger', variant: 'soft' } },
  info: { component: 'Status', attrs: { tone: 'info', variant: 'soft' } },
  active: { component: 'Status', attrs: { tone: 'success' } },
  inactive: { component: 'Status', attrs: { tone: 'neutral' } },
  pending: { component: 'Status', attrs: { tone: 'warning' } },
  error: { component: 'Status', attrs: { tone: 'danger' } },
};

/** Button/IconButton (wave 1, #14): the old `color` → `tone`, and the old `variant` → the 2.0 `variant`. */
export const BUTTON_TONES: Record<string, string> = {
  primary: 'action',
  secondary: 'neutral', // the old secondary was already the neutral, low-emphasis action
  danger: 'danger',
  neutral: 'neutral', // IconButton only
};
export const BUTTON_VARIANTS: Record<string, string> = {
  filled: 'fill',
  outline: 'outline',
  ghost: 'ghost',
};
export const BUTTON_MANUAL: Record<string, string> = {
  tonal: 'variant="tonal" saiu do Button 2.0: escolha fill, outline ou ghost (o tom vem de `tone`).',
  link: 'variant="link" saiu: para link use <Button asChild variant="ghost"><a href>…</a></Button> ou um <a> comum.',
};

/** EmptyState (wave 3, #16): the old `icon` keys and the lucide icons they drew. */
export const EMPTY_STATE_ICONS: Record<string, string> = {
  box: 'Package',
  service: 'Clock',
  kit: 'Combine',
  input: 'Boxes',
  order: 'FileText',
  customer: 'Users',
  finance: 'Wallet',
  schedule: 'CalendarDays',
  inventory: 'Warehouse',
  price: 'Tag',
  category: 'LayoutGrid',
  generic: 'Info',
  search: 'SearchX',
  lock: 'Lock',
  catalog: 'Package',
  channels: 'Send',
  commercial: 'HandCoins',
  operation: 'Store',
  intelligence: 'BarChart3',
  billing: 'CreditCard',
};

/** Skeleton (wave 3, #16): the old variants, as a 2.0 shape plus the size the variant drew (Tailwind units × 4px). */
export const SKELETON_VARIANTS: Record<string, { shape?: string; width?: string; height?: string }> = {
  text: {}, // h-4 w-full: the 2.0 line
  line: {},
  title: { width: "'60%'", height: '24' },
  avatar: { shape: 'circle', width: '40', height: '40' },
  circle: { shape: 'circle', width: '48', height: '48' },
  button: { shape: 'rect', width: '96', height: '40' },
  card: { shape: 'rect', height: '128' },
};

/** Notice (deprecated) → Alert: the same mapping the 2.0 Notice wrapper does (components/notice.tsx). */
export const NOTICE_TONES: Record<string, string> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  critical: 'danger',
};

// ── The 2.0.0-next vocabulary (03/10/2026) ─────────────────────────────────────────────────────────────
// The Figma [RDS] took one prop vocabulary and the code follows it 1:1: `tone` neutral|action|accent|info|success|
// warning|danger|inverse (never `default`); `variant` only for emphasis (fill|soft|outline|ghost; the Card
// surface|soft|outline); `size` sm|md|lg (+xs/xl) with md as the default (never `default`); selection as booleans;
// the theme is not a prop. The package keeps the old names as deprecated aliases where that is cheap (size and tone
// `default`, Card `surface`, Marker/FileInput `variant`, SidebarItem `active`, FilterChip `active`…); the codemod
// moves the code to the new names anyway. Shape changes (Bubble, Stat `muted`, Sidebar `tone`) have no alias.

/** `size="default"` → `size="md"`: md is the 2.0 default. Anything else (sm, lg, a variable) stays. */
const SIZE_MD: PropRule = { renameValues: { default: 'md' } };
/** `tone="default"` → `tone="neutral"`. */
const TONE_NEUTRAL: PropRule = { renameValues: { default: 'neutral' } };

export interface VocabRule {
  props?: Record<string, PropRule>;
  transforms?: TransformName[];
}

/** Keyed by the 2.0 export name. Transforms run first; the props then skip what a transform already rewrote. */
export const VOCABULARY: Record<string, VocabRule> = {
  // size default → md
  Avatar: { props: { size: SIZE_MD } },
  AvatarGroup: { props: { size: SIZE_MD } },
  Tile: { props: { size: SIZE_MD } },
  Status: { props: { size: SIZE_MD } },
  StarRating: { props: { size: SIZE_MD } },
  Dialog: { props: { size: SIZE_MD } },
  Progress: { props: { size: SIZE_MD } },
  Spinner: { props: { size: SIZE_MD, tone: TONE_NEUTRAL } },
  // tone default → neutral
  Breadcrumb: { props: { tone: TONE_NEUTRAL } },
  Heading: { props: { tone: TONE_NEUTRAL } },
  DropdownMenuItem: { props: { tone: TONE_NEUTRAL } },
  ContextMenuItem: { props: { tone: TONE_NEUTRAL } },
  // Card: surface → variant (default → surface, tint → soft), size default → md
  Card: {
    props: {
      surface: {
        to: 'variant',
        renameValues: { default: 'surface', tint: 'soft', outline: 'outline' },
        dynamicManual:
          'Card: `surface` virou `variant` com outros nomes (default→surface, tint→soft, outline→outline). Mapeie o valor dinâmico à mão.',
      },
      size: SIZE_MD,
    },
  },
  // Item: variant default → ghost, muted → soft; size default → md
  Item: {
    props: {
      variant: {
        renameValues: { default: 'ghost', muted: 'soft' },
        dynamicManual:
          'Item: variant mudou de nomes (default→ghost, muted→soft, outline igual). Mapeie o valor dinâmico à mão (o nome antigo ainda funciona, deprecated).',
      },
      size: SIZE_MD,
    },
  },
  // Marker: variant → kind (default → inline)
  Marker: {
    props: {
      variant: {
        to: 'kind',
        renameValues: { default: 'inline' },
        dynamicManual: 'Marker: `variant` virou `kind` e default virou inline (border e separator iguais). Mapeie o valor dinâmico à mão.',
      },
    },
  },
  // FileInput: variant → layout (the same values)
  FileInput: { props: { variant: { to: 'layout' } } },
  // Stat: tone default/positive/negative → neutral/success/danger; tone="muted" → muted
  Stat: {
    transforms: ['statMuted'],
    props: {
      tone: {
        renameValues: { default: 'neutral', positive: 'success', negative: 'danger' },
        dynamicManual:
          'Stat: tone mudou (default→neutral, positive→success, negative→danger; muted virou a prop booleana `muted`). Mapeie o valor dinâmico à mão.',
      },
    },
  },
  // Sidebar: the theme is not a prop
  Sidebar: {
    props: {
      tone: {
        dropIf: 'light',
        manual:
          'Sidebar perdeu `tone`: o tema é o do contêiner. Para a barra na cor da marca (o antigo tone="dark"), ponha a Sidebar dentro de um elemento com class="ds-plate" (modo brand); para o tema escuro, dentro de .dark.',
      },
    },
  },
  // SidebarItem: active → current
  SidebarItem: { props: { active: { to: 'current' } } },
  // FilterChip: active → pressed (as the Toggle)
  FilterChip: {
    props: {
      active: { to: 'pressed' },
      defaultActive: { to: 'defaultPressed' },
      onActiveChange: { to: 'onPressedChange' },
    },
  },
  // Bubble: one surface prop → variant + tone + typing
  Bubble: { transforms: ['bubbleVocab'] },
  // Badge: highlight → soft on accent
  Badge: { transforms: ['badgeHighlight'] },
  // RowActions: the items' variant → tone
  RowActions: { transforms: ['rowActionsItems'] },
};

/** Bubble: the old surface → variant + tone (+ typing). */
export const BUBBLE_VARIANTS: Record<string, { variant?: string; tone?: string; typing?: true }> = {
  fill: { variant: 'fill' },
  muted: { variant: 'soft' },
  tinted: { variant: 'soft', tone: 'action' },
  outline: { variant: 'outline' },
  ghost: { variant: 'ghost' },
  error: { variant: 'soft', tone: 'danger' },
  typing: { typing: true },
  soft: { variant: 'soft' }, // already the vocabulary
};

/** Type exports of the vocabulary: renamed (`to`; the old name stays as a deprecated alias) or gone (`manual`). */
export const VOCABULARY_TYPES: Record<string, { to?: string; manual?: string }> = {
  AvatarVariant: { to: 'AvatarContent' },
  FileInputVariant: { to: 'FileInputLayout' },
  MarkerVariant: { manual: 'MarkerVariant (deprecated) virou MarkerKind: inline, border, separator (default virou inline).' },
  CardSurface: { manual: 'CardSurface (deprecated) virou CardVariant: surface, soft, outline (default→surface, tint→soft).' },
  SidebarTone: { manual: 'SidebarTone saiu: o tema da Sidebar é o do contêiner (.ds-plate para a cor da marca, .dark para o escuro).' },
};

/**
 * Exports that only exist from 2.0 on: none of them is exported by the 1.0.2 package (`components/`, `icons/`,
 * `compat/`). Each is a 2.0 barrel export, or an entry of MOVED_EXPORTS, whose name no file of 1.0.2 exported.
 *
 * A 1.x file cannot import any of these, so a file that does is already on 2.0 — migrated by hand, or by an earlier
 * run of this codemod that was interrupted before package.json. In the 1.x mode the codemod skips it whole: running
 * the 1.x rules again on 2.0 code is not idempotent (the 1.x Avatar `size="md"` is the 2.0 `lg`, and an Avatar
 * without `size` gets `size="lg"` again).
 *
 * Generated by diffing the exported declarations of `git archive @rojaostudio/ds@1.0.2` against today's barrel. ChoiceCard
 * is not here: it exists in 1.x (with `label` and `onClick`); ChoiceCardGroup is new.
 */
export const ONLY_IN_2_0: ReadonlySet<string> = new Set([
  'ActionBar', 'ActionBarProps', 'AlertDialog', 'AlertDialogProps', 'AlertDialogTone', 'AlertTone', 'Attachment',
  'AttachmentOrientation', 'AttachmentProps', 'AttachmentStatus', 'AvatarContent', 'AvatarGroupSize', 'AvatarType',
  'AvatarVariant', 'BadgeTone', 'Banner', 'BannerProps', 'Benefits', 'BenefitsItem', 'BenefitsItemProps',
  'BenefitsProps', 'BreadcrumbLinkComponent', 'BreadcrumbTone', 'Browser', 'BrowserProps', 'Bubble', 'BubbleAlign',
  'BubbleProps', 'BubbleTone', 'BubbleVariant', 'ButtonGroup', 'ButtonGroupOrientation', 'ButtonGroupProps',
  'ButtonIconPosition', 'ButtonTone', 'Calendar', 'CalendarProps', 'CardContent', 'CardContentProps',
  'CardFooterProps', 'CardSize', 'CardSurface', 'Carousel', 'CarouselPlaceholder', 'CarouselProps', 'Chart',
  'ChartProps', 'ChartSeries', 'ChartType', 'CheckboxChecked', 'CheckboxGroup', 'CheckboxGroupProps',
  'ChoiceCardGroup', 'ChoiceCardGroupProps', 'ChoiceCardLayout', 'ChoiceList', 'ChoiceListItem',
  'ChoiceListItemProps', 'ChoiceListProps', 'ComboboxMultipleProps', 'ComboboxSingleProps', 'Command',
  'CommandGroup', 'CommandGroupProps', 'CommandItem', 'CommandItemProps', 'CommandProps', 'Contact', 'ContactProps',
  'ContextMenuItem', 'ContextMenuItemProps', 'ContextMenuItemTone', 'ContextMenuSeparator', 'Delta',
  'DeltaDirection', 'DeltaProps', 'DeltaTone', 'Dialog', 'DialogClose', 'DialogProps', 'DialogSize', 'DrawerClose',
  'DropdownMenu', 'DropdownMenuAlign', 'DropdownMenuItem', 'DropdownMenuItemProps', 'DropdownMenuItemTone',
  'DropdownMenuProps', 'DropdownMenuRadioGroup', 'DropdownMenuRadioGroupProps', 'DropdownMenuRadioItem',
  'DropdownMenuRadioItemProps', 'DropdownMenuSeparator', 'DropdownMenuSide', 'Empty', 'EmptyProps', 'FAB',
  'FABProps', 'FAQ', 'FAQProps', 'FieldLabelPosition', 'FileInput', 'FileInputLayout', 'FileInputProps',
  'FileInputVariant', 'Footer', 'FooterColumn', 'FooterColumnProps', 'FooterProps', 'FormActions',
  'FormActionsLayout', 'FormActionsProps', 'GoogleAccount', 'GoogleAccountChooser', 'GoogleAccountChooserProps',
  'GoogleButton', 'GoogleButtonProps', 'GoogleButtonShape', 'GoogleButtonTheme', 'GoogleButtonType',
  'GoogleConsent', 'GoogleConsentProps', 'GoogleLayout', 'GoogleSignIn', 'GoogleSignInProps', 'GoogleSignInStep',
  'Heading', 'HeadingElement', 'HeadingLevel', 'HeadingMark', 'HeadingMarkProps', 'HeadingProps', 'HeadingTone',
  'HoverCard', 'HoverCardProps', 'ImageCropDialog', 'ImageCropDialogProps', 'InputOTP', 'InputOTPLength',
  'InputOTPProps', 'IsoDate', 'Item', 'ItemGroup', 'ItemGroupProps', 'ItemProps', 'ItemSize', 'ItemVariant', 'Kbd',
  'KbdGroup', 'KbdGroupProps', 'KbdProps', 'Listbox', 'ListboxOption', 'ListboxOptionProps', 'ListboxProps',
  'Marker', 'MarkerKind', 'MarkerProps', 'MarkerVariant', 'MediaTileAspect', 'Message', 'MessageAlign',
  'MessageProps', 'MessageScroller', 'MessageScrollerProps', 'NavigationMenu', 'NavigationMenuEntry',
  'NavigationMenuLink', 'NavigationMenuLinkComponent', 'NavigationMenuProps', 'Newsletter', 'NewsletterProps',
  'NumberInput', 'NumberInputProps', 'NumberInputStep', 'PageHeader', 'PageHeaderHeading', 'PageHeaderProps',
  'PaginationLinkComponent', 'PasswordInput', 'PasswordInputProps', 'Phone', 'PhonePlatform', 'PhoneProps',
  'PixIconProps', 'PopoverAlign', 'PopoverClose', 'PopoverSide', 'Pricing', 'PricingPlan', 'PricingPlanProps',
  'PricingProps', 'Progress', 'ProgressKind', 'ProgressProps', 'ProgressSize', 'Questionnaire',
  'QuestionnaireAnswer', 'QuestionnaireProps', 'SavingBarStatus', 'SelectItem', 'SelectItemProps', 'Separator',
  'SeparatorOrientation', 'SeparatorProps', 'Sheet', 'SheetClose', 'SheetProps', 'SheetSide', 'Sidebar',
  'SidebarCountTone', 'SidebarGroup', 'SidebarGroupProps', 'SidebarHeader', 'SidebarItem', 'SidebarItemProps',
  'SidebarProps', 'SidebarSection', 'SidebarSectionProps', 'SidebarSeparator', 'SidebarTrigger', 'SidebarTriggerProps', 'SkeletonShape', 'Sparkline', 'SparklineProps', 'SpinnerTone', 'StarRating',
  'StarRatingProps', 'StarRatingSize', 'Stat', 'StatProps', 'StatTone', 'Status', 'StatusProps', 'StatusSize',
  'StatusTone', 'StatusVariant', 'Stepper', 'StepperProps', 'StepperStep', 'SummaryBarLayout', 'Switch',
  'SwitchLabelPosition', 'SwitchProps', 'SwitchSize', 'TableAlign', 'TableCell', 'TableCellProps', 'TableHeadProps', 'TableHeader', 'TableProps',
  'TableSort', 'TableStatus', 'TableStatusProps', 'Tabs', 'TabsContent', 'TabsContentProps', 'TabsList',
  'TabsListProps', 'TabsProps', 'TabsTrigger', 'TabsTriggerProps', 'Testimonial', 'TestimonialItem',
  'TestimonialItemProps', 'TestimonialProps', 'Tile', 'TileProps', 'TileSize', 'TileTone', 'TileVariant',
  'TimeFormat', 'ToastFn', 'ToastTone', 'ToastView', 'ToastViewProps', 'ToggleCardLayout', 'ToggleGroupItem',
  'ToggleGroupItemProps', 'ToggleVariant', 'TooltipSide', 'TopNavigation', 'TopNavigationProps', 'WhatsAppChat',
  'WhatsAppChatProps', 'WhatsAppMessage', 'WhatsAppMessageProps', 'WhatsAppMessageType', 'WhatsAppNotification',
  'WhatsAppNotificationProps', 'WhatsAppPlatform', 'WhatsAppTemplate', 'WhatsAppTemplateButton',
  'WhatsAppTemplateButtonProps', 'WhatsAppTemplateButtonStatus', 'WhatsAppTemplateButtonType',
  'WhatsAppTemplateHeader', 'WhatsAppTemplateProps',
]);
