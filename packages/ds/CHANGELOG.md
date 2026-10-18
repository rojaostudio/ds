# @rojaostudio/ds

## 2.17.0

### Minor Changes

- acb37c8: Fonts as brand identity, display sizes and form field ceilings (ds#190, ds#194).

  - New theme roles for the brand's fonts, one family each: `--type-font-text`, `--type-font-display`, `--type-font-editorial` (with `--type-font-mono`), and their stacks for `font-family`: `--type-stack-text`, `--type-stack-display`, `--type-stack-editorial`, `--type-stack-mono`. In Figma each brand's families and stacks live in the `brand` collection (`<brand>/font/<family>`, `<brand>/stack/<family>`) and the roles point to them; a brand with one font points every role to it. Every component now reads `--type-stack-text`.
  - `--type-font-family` and `--type-font-stack` keep working as `var()` of `--type-font-text` and `--type-stack-text` until 3.0. `--type-font-mono` keeps its fallback (`"Roboto Mono", monospace`) until 3.0; the stack is `--type-stack-mono`.
  - Display sizes by viewport, for marketing titles (the Figma text styles `display/hero`, `display/section`, `editorial/hero`, `editorial/section`): `--type-display-hero-size|line` (40 → 72) and `--type-display-section-size|line` (28 → 48).
  - Form field ceilings by viewport, as the `max-width` of a short field next to a FILL one: `--form-field-short-max` (88, 168 from md), `--form-field-number-max` (96, 168 from md) and `--form-field-key-max` (no ceiling, 168 from md).
  - ds-core: the theme validates and writes the new roles (a family inside quotes; a stack with each family quoted and a generic one bare), and exports `isSafeStack` and `stackCss`. A brand table exported before these roles still loads, with Inter and its own mono, and a warning to export it again.

- 95c1af2: Chat set: Composer, FloatingPanel and the delivery status of a Message (ds#178, ds#179, ds#180).

  - `Composer` (new): where a chat is written, the text and the send button in one box. It grows from 1 to 4 lines (`maxRows`) and then scrolls. Enter sends the trimmed text, Shift+Enter breaks the line; `sending` turns the button and blocks a second send; `disabled`. Controlled (`value` + `onValueChange`) or not (`defaultValue`, emptied after each send).
  - `FloatingPanel` (new): a window over the page that does not block it (support chat, help, assistant). Non-modal dialog: no veil, the focus is not trapped, a click outside keeps it open, Esc and the close button close it and the focus goes back to the opener. From lg: 400 × 640 at the bottom right, 24 from the edges, never taller than the screen less 96; compact: the whole screen with a back button. Parts: `title`, `status`, `avatar`, the scrolling body (`children`) and `footer`. New viewport tokens `--layout-floating-panel-width|height|radius`.
  - `Message`: `status="sending" | "sent" | "failed"` on the person's own message (`align="end"`), with `onRetry`. sending shows a Spinner and "Enviando" in place of the time; failed turns the Bubble to the error colours and adds "Não enviada · Tentar de novo". Each change is announced by a polite live region. New token `--message-failed`.

- 63545a6: Surface width scale (ds#189) and PageShell `maxWidth="medium"` (ds#177).

  - New tokens `--layout-surface-xs|sm|md|lg|xl` (240 · 320 · 400 · 560 · 720), always shipped: the width of a panel, menu, dialog or floating window. Sidebar, Tooltip, Popover, HoverCard, Sheet, Drawer, Dialog, AlertDialog and Command now read them, with no width change. Toast goes from 460 to 400 (md).
  - PageShell: `maxWidth="medium"` caps the content at 1152 (`--layout-content-max-width-medium`), for a site or a marketing page, between narrow (768) and wide (1536).

### Patch Changes

- e90d0b7: `styles/rds/components-styles.css` ships without the stylesheet comments (the spec of each component, kept in the sources): 389 KB → 294 KB raw, about 39 KB less in the tarball. No rule changes.
- Updated dependencies [acb37c8]
  - @rojaostudio/ds-core@1.2.0

## 2.16.0

### Minor Changes

- 6a44914: Combobox `actions` (ds#181): actions at the foot of the list, for when the search does not find the item ("Criar novo", "Lançar item livre"). They are fixed under the options that scroll, as options of a named group (`actionsLabel`, default "Ações") at the end of the listbox. The arrows reach them after the last option, Enter chooses (`onSelect` gets the typed text) and the list closes, with no Tab; Left and Right stay in the text. They show also with the field empty and when nothing matches, after the empty message, with the first one already active. The create option (`creatable`) now sits first in the same fixed group, with the same look. In Figma, the Listbox gains `showActions` and the `actions` slot, and the Combobox exposes its listbox.

## 2.15.1

### Patch Changes

- ae05f5c: Dialog `stableHeight`: the footer stays at the foot of the box on a shorter step. 2.15.0 kept the box's height, but the body did not take it, so the footer rose with the shorter content and left a gap under it (ds#160).
- 8159b98: FieldGroup and CheckboxGroup load in a Server Component again (2.15.0 broke them on import: the FieldGroup context was created in a module the server React also reads, where createContext does not exist). FieldGroup is a client component now; the context and the fields' ids hook moved to a client module of their own. The dist contract gained a check: every module without `'use client'` loads under the `react-server` condition, with the client modules stubbed as the App Router does.

## 2.15.0

### Minor Changes

- d2b6ede: Dialog: `eyebrow`, a small line above the title for a wizard's context (the window is still named by the title; the eyebrow describes it, before the description), and `stableHeight`, which keeps the box at the height of the tallest step it has shown so the footer doesn't jump between steps, still capped by the window and back to hugging when it closes. (ds#160)
- af5322d: FieldGroup e FieldGroupSeparator (ds#147): campos curtos que formam um valor só (largura × altura, de – até) num `<fieldset>` com uma legend e um erro. O erro do grupo pinta todos os campos (menos o que receber `error={false}`), a mensagem sai uma vez embaixo do conjunto e vai por `aria-describedby` a cada campo em erro; dentro do grupo o campo nunca desenha mensagem própria. `focusFirstInvalid` cai no primeiro campo errado do grupo.
- 27b076a: Stepper: the steps are an ordered list inside the "Etapas" navigation, and each step says its position after its label for screen readers ("Endereço, etapa 2 de 4"; `positionLabel` words it); later steps stay aria-disabled, readable and reachable by Tab. New `variant="embedded"`: no surface, border or shadow, for a Stepper inside a Dialog or a card (`floating`, the raised pill, stays the default). (ds#159)

## 2.14.0

### Minor Changes

- 5a44b68: PageShell: `maxWidth="full"` (no cap, for a board, a kanban or a map) and `align="start" | "center"` (default center; start puts the capped content at the inline start, next to a side menu). narrow and wide now read the new tokens `--layout-content-max-width-narrow` (768) and `--layout-content-max-width-wide` (1536) instead of a fixed 1536px; `--layout-form-max-width` stays as a deprecated alias of narrow until the next major. The codemod knows `maxWidth="full"`. (ds#162)

## 2.13.0

### Minor Changes

- bf5adcc: Dialog back and visible shortcuts (ds#152, ds#153):
  - Dialog `onBack` + `backLabel` (Figma `showBack`): a ghost IconButton with a left chevron before the title, for a Dialog in two steps.
  - Button, Input and Combobox `shortcut` (Figma `showShortcut`): the keys (Kbd, or a KbdGroup for "Control+Enter") after the label or at the end of the field, from 1024 up, and set as aria-keyshortcuts.
- 44ae310: Combobox, ChipInput and TimePicker lists in a floating layer (ds#157): portaled over everything, so a Card's overflow never cuts them and a sticky bar (SavingBar, FormActions) never covers them. Below the field when it fits, above when it doesn't, and shrinking to the room there is (scrolling inside) when neither side has it; the BottomBar counts as the foot of the useful area. The page never grows nor scrolls because of the list. Inside a modal, the layer goes above it.

## 2.12.0

### Minor Changes

- 49f18a2: Dialog: `closeButton` (Figma `showClose`, on by default). Off for a decision that has to be made, where the × would be one more, ambiguous way out; the footer's Cancel stays as the exit, also on the compact sheet (which otherwise hides it). Escape still cancels.
- 750f377: Tooltip: neutral inverse instead of the brand's primary. `tooltip/background` → `surface/inverse`, `tooltip/text` → `text/on-inverse` (dark on light, light on dark). A tooltip is a system label, not an action; in the brand colour it looked like a button.

### Patch Changes

- 2186309: PageShell: the PageHeader is 24 above the Body (the shell is a flex column with gap 24, as the Figma's content slot). Before, the first section touched the header's description.

## 2.11.0

### Minor Changes

- 28b7e1d: Error for choice groups and required lists (ds#145, ds#146), for the "send it empty" rule:
  - `ChoiceCardGroup`: `required`, `error`, `errorMessage`. The unchosen cards take the error border; one message under the group, tied by aria-describedby; aria-invalid on the fieldset.
  - `ToggleGroup`: `error`, `errorMessage`. The items that are not on take the error border (ghost included); the message follows the group.
  - `Empty`: `errorMessage`, for a required list left empty. The Tile turns danger; the Empty gets aria-invalid and tabindex -1.
  - New `focusFirstInvalid(form)`: focuses the first element with aria-invalid, handing a group's focus to its chosen item.
  - Component tokens: `choice-card/container/border/error`, `choice-card/group/required`, `choice-card/group/error-message`, `toggle/border/error`, `toggle-group/error-message`, `empty/error-message`, `empty/error-ring`.

## 2.10.0

### Minor Changes

- 1743444: **Badge `size`** (ds#133): `md` (32, o padrão) | `sm` (24, respiro 4 × 8; o contador vira um círculo de 24). O sm vai ao lado do título de uma linha (Item, célula de tabela) sem a linha crescer: dentro de uma linha de texto de 24 ele se alinha ao topo dela.
- 0924101: **`bleed`** (ds#134), para as faixas que rolam de lado chegarem à borda da tela em vez de serem cortadas na margem:

  - **`<TabsList bleed>`:** a faixa devolve o respiro lateral da página (`--layout-content-padding-x`) com margem negativa e o põe por dentro; a primeira aba fica alinhada com o conteúdo e a rolagem corta na borda da tela. Com `trailing`, o respiro do fim vai depois dele.
  - **`<DataTableHeader bleed>`:** abaixo de 1024, os filtros rápidos ganham uma linha própria que sangra do mesmo jeito; a busca, o filtro e a ação ficam onde estão. A partir de 1024 nada muda. Só uma das duas cópias aparece de cada vez, então o leitor de tela encontra o grupo uma vez.

  Sem `bleed`, nada muda.

- 83d355b: **DataTableHeader `compactFilters`** (ds#134): abaixo de 1024, onde ficam os filtros rápidos. `strip` (padrão) mantém a faixa à vista (de ponta a ponta com `bleed`). `drawer` tira os filtros rápidos da barra: o "Filtros" compacto abre um Drawer com eles no topo ("Filtros rápidos") e depois os outros filtros; `quickActiveCount` soma os rápidos ligados à contagem do botão. Use o `drawer` quando a lista quase nunca é filtrada, quando os rápidos são todos menus, ou quando a tela já tem outra faixa que rola. No Drawer, use FilterChips (não FilterChipMenu). A partir de 1024 nada muda.
- 08d15cc: Pedidos de ds#127, aditivos:

  - **Stat `loading`:** rótulo, valor e legenda viram Skeleton em linhas da mesma altura do texto, então o Stat fica com a altura do estado carregado (com e sem legenda e sparkline) e a grade não pula quando os números chegam. `aria-busy`; o rótulo continua para leitor de tela.
  - **`ItemSkeleton` (novo):** uma linha de lista carregando, no formato do `Item variant="row"`: mesmo padding, mesma altura e a linha embaixo (a última do `ItemGroup` sai sem). `size` md | sm e `showMedia`, `showDescription`, `showTrailing`, `showDivider`. Escondido do leitor de tela: ponha `aria-busy` no `ItemGroup`.
  - **`CardHeader size="lg"`:** o título em `type/heading` (24/30, peso do heading), para o cabeçalho de seção de um painel em que o conteúdo traz números grandes. A faixa da ação acompanha a linha do título. md e sm continuam vindo do Card.
  - **Chart:** nada muda no código; uma série é `series` com um item. No Figma, o `showSeries2` desliga a segunda linha e a legenda dela.
  - **CardHeader `align="start"` sem descrição:** o Tile, o título e a ação ficam no mesmo centro (antes o título de uma linha colava no topo do Tile de 48). Com descrição nada muda: a ação segue na linha do título.
  - **Sparkline `inverse`:** linha e ponto em `text/on-inverse` (tokens `sparkline/inverse/*`). Dentro do Stat `inverse` a Sparkline vira inversa sozinha, como o Delta; antes ela sumia na chapa escura.

- f87b998: **IconButton `dot`** (ds#139): um ponto de 8 no canto, sem número, para um aviso fixo e informativo ("tem algo aqui"): `neutral` (`text/muted`), `info` (`text/info`) e `danger` (`text/error`), todos com 3:1 ou mais sobre a superfície em todos os temas e na chapa. É decorativo: o que ele significa vai no `label`. Com `count`, vale o contador. Tokens novos: `icon-button/dot/neutral`, `icon-button/dot/info`, `icon-button/dot/danger`.
- 93fccc8: **PageHeader `showTitle`** (ds#136, padrão `true`): com `false`, o título, a ajuda e o `titleAddon` saem do PageHeader em qualquer largura e a descrição vira a primeira linha, para quando a barra do app mostra o título da tela. O título continua como `<h1>` só para o leitor de tela.
- 7014745: **Pagination no estreito** (ds#138): abaixo de 1024, o resumo ("51 a 100 de 1.284 eventos") vai para uma linha própria acima dos controles, e os números saem: fica "‹ 5 de 26 ›", com as setas nas pontas e alvos de 44. O leitor de tela ouve "Página 5 de 26". A partir de 1024 nada muda.
- 6dfd093: **`TableGroupRow`** (ds#137, novo): a linha que abre um grupo de linhas da tabela ("Hoje, 12/10"). Largura toda (`colSpan`), fundo `table/group/background` (surface/muted), rótulo semibold, contagem opcional à direita e linha embaixo; um `<th scope="rowgroup">`. Use um `TableBody` por grupo com a `TableGroupRow` primeiro; entre dois grupos uma linha fecha o de cima. Tokens novos: `table/group/background`, `table/group/label`, `table/group/count`.

### Patch Changes

- Updated dependencies [7aba070]
  - @rojaostudio/ds-core@1.1.2

## 2.9.2

### Patch Changes

- Updated dependencies [7801c64]
  - @rojaostudio/ds-core@1.1.1

## 2.9.1

### Patch Changes

- 870c3e7: ChipInput, NumberInput and the multiple Combobox: the box keeps its own padding and gap again. The shared field rule (same specificity, later in the stylesheet) overrode them, so the ChipInput's Chips touched the border (padding 0 instead of 4 on top, 8 on the left; rows 8 apart instead of 4).

## 2.9.0

### Minor Changes

- dbda632: MediaGrid (#118): the photos of a record in square tiles that wrap. The first is the cover (Badge "Capa"), the last tile adds (native file input, `max` cuts the extra files and says so at once), empty it is a FileInput dropzone. Uploading (Progress) and error ("Tentar de novo") per tile. Move by dragging the whole tile, by Space and the arrows, or by each photo's menu (Definir como capa, Mover para a esquerda/direita, Editar, Remover). One event for every order: `onReorder(ids)`. Tokens `--media-grid-*`.

  Reordering without dragging (WCAG 2.5.7), in ChipInput too: hold an item still, let go, and tap where it goes.

## 2.8.0

### Minor Changes

- 0a1a2f4: ChipInput `layout="list"`: the Chips wrap without a box and a "+ <addLabel>" of a chip's size closes the row and turns into a field in place (Enter adds and keeps the focus, Escape or leaving it empty closes). `reorderable` (drag, touch after a still press, or Space and the arrows, announced), `editable` (rename a free value in place) and `getChipProps(value)` with `locked`, `count` and `tooltip` for a value in use elsewhere. `size` (list only) sm 32 or md 44 for the Chips and the "+". Chip gains `count` ("Branco · 2"). Tokens: `--chip-count`, `--chip-border-editing`, `--chip-input-add-border`, `--chip-input-add-border-hover`, `--chip-input-add-label`. No new dependency (#117).

## 2.7.0

### Minor Changes

- 57b5e79: Media `dimmed`: a mídia em cinza e esmaecida (`--media-dimmed-opacity`), para produto inativo que continua clicável (ds#109). Status `icon`: um ícone no lugar do ponto ("✓ Pago"), 16 no md e 12 no sm (ds#110). Tokens de opacidade na fundação: `--opacity-50`, `--opacity-disabled` e `--opacity-dimmed`; os 0.5 soltos do ChoiceCard, ChoiceList e FilterChip passam a `--opacity-disabled`.

## 2.6.0

### Minor Changes

- ba1833c: PhoneInput com bandeiras próprias, servidas pelo pacote: SVG inline (desenhos do country-flag-icons, MIT, embutidos no pacote: nenhuma dependência nova), recortado no desenho do [RDS] (20 × 14, cantos 2, fio de 12%). Nenhuma requisição sai da página, então a CSP não precisa liberar o CDN do twemoji. Brasil, Portugal e EUA vêm embutidos; as outras carregam num pedaço separado quando a lista abre. `renderFlag` continua valendo (ds#107).

## 2.5.1

### Patch Changes

- 93b94c9: `labelAction` do Input e do PasswordInput: o padrão é um Button ghost sm ("Esqueci a senha"), não um Link, e a linha do rótulo não cresce com os 32 do botão. Documentação do Link: palavra dentro de uma frase é Link; ação solta é Button ghost.

## 2.5.0

### Minor Changes

- 7d7c7c7: Heading ganha `align` (start | center): o cabeçalho centrado de cartão e diálogo de acesso, com o título longo quebrando centrado (ds#100).
- 895ef64: Link novo: o link de texto dentro de uma frase ("Ainda não tem conta? Criar conta grátis"), sem padding nem altura de controle, sublinhado, tone action ou neutral, asChild para o Link do Next ou um botão (ds#101). Input e PasswordInput ganham `labelAction`: uma ação na linha do rótulo, à direita ("Esqueci a senha"), fora do <label> e depois do campo na ordem do Tab; com o rótulo flutuante, fica embaixo do campo (ds#102).

## 2.4.0

### Minor Changes

- 0493c87: PasswordInput ganha o medidor de força (`showStrength`, desligado por padrão): quatro segmentos e a palavra (Fraca, Razoável, Boa, Forte) entre o campo e a dica, calculado enquanto se digita (`passwordStrength`, exportado) ou vindo do produto (`strength`), com o nível anunciado quando muda (ds#97). Drawer e Dialog aceitam `returnFocus`; com ele, o PhoneInput no celular leva o foco ao número depois de escolher o país. SummaryBar `layout="grid"`: teste em 310.

## 2.3.0

### Minor Changes

- 6dc683e: **PhoneInput** vira um campo só, como no Figma: à esquerda o botão do país (bandeira, DDI e chevron), uma divisória e o número, sem prefixo. O DDI aparece uma vez. Rótulo, dica e erro são do campo inteiro, e o erro pinta a borda toda.

  - **Lista de países:** busca fixa no topo, grupos "Sugeridos" (Brasil, Portugal e Estados Unidos; troque com `preferredCountries`) e "Todos os países", com bandeira, nome e DDI à direita. Filtra por nome ou código ("port", "+351"). Escolher fecha a lista e leva o foco ao número. Abaixo de 1024 a lista abre numa gaveta.
  - **Colar:** "+55 11 9…", "5511…", "011 9…" e "0 11 9…" ficam como o número nacional; colar outro DDI troca o país. O `defaultValue` com zero na frente deixou de virar "+55011…".
  - **API nova:** `error` booleano + `errorMessage`, `size` (`sm` | `md`), `defaultCountry`, `preferredCountries`, `countries`, `countryLabel` e `renderFlag`. O botão do país se chama "País do <rótulo>: Brasil, +55".
  - **Depreciados:** `helper` (use `hint`) e `error` como texto (use `errorMessage`). Continuam funcionando, com um aviso em desenvolvimento, e saem na 3.0.

## 2.2.0

### Minor Changes

- 9c55fbe: - **Item:** prop nova `showDivider` (padrão ligado) na variante `row`. Dentro de um `ItemGroup`, a última `row` já sai sem a linha (a borda do card fecha a lista), na mesma altura.
  - **FileInput:** prop nova `ratio` no `layout="tile"`: `1:1` (padrão, 112) ou `3:2` (168 por 112, para uma capa). A prévia preenche o tile, recortada.

## 2.1.0

### Minor Changes

- 0f93e8d: A barra do `DataTableHeader` passa a ser inteira em 44 por padrão (era 32), sem eixo de tamanho: a barra nunca mistura alturas.

  - **DataTableHeader:** a busca vira `Input` md; o gatilho de filtros (Button ou IconButton), o "Limpar filtros" e os Chips dos filtros ativos vão para md. Os `FilterChip` e `FilterChipMenu` passados em `quickFilters` ficam com 44 sozinhos, sem mudar o código de quem usa. A ação (`actions`) é do consumidor: passe o `IconButton` em `size="md"`.
  - **FilterChip** e **FilterChipMenu:** prop nova `size` (`sm` 32, o padrão, ou `md` 44, com 16 de respiro).
  - **Chip:** prop nova `size` (`sm` 32, o padrão, ou `md` 44, com rótulo 14/20).

## 2.0.0

### Major Changes

- eae08d7: 2.0: os componentes passam a seguir a API do Figma [RDS].

  - **Componentes:** cerca de 100 componentes em CSS próprio (`@rojaostudio/ds/styles/rds.css`) sobre tokens de componente extraídos do Figma, cada um com teste no navegador e axe.
  - **Quebras:** quase todos os componentes mudam de API. Os principais renomes são Modal → Dialog, a troca Drawer ↔ Sheet, Menu → DropdownMenu, EmptyState → Empty e Divider → Separator. O Button passa a usar `tone`/`variant`, os campos ganham label, hint e erro embutidos, e o Select e o RadioGroup passam a receber os itens como filhos.
  - **Muda aparência:** o tema público `rojao` passa de preto + verde para navy + flare.
  - **Migração:** o guia [Migrar da 1.x](https://ds.rojao.ai/migrar) mostra, passo a passo, a instalação, a troca do CSS e do tema e os componentes e props renomeados. Nos repositórios do Rojão Studio, as trocas mecânicas saem do codemod interno deste repositório (`packages/codemod`, não publicado no npm).
  - **ds-core:** novo `generateRdsTheme`/`emitRdsCss` (os papéis de tema do [RDS] a partir de uma cor de marca) e as paletas zinc, navy, flare e coal.

### Minor Changes

- 8c2b000: Alert: a ação vai para a direita do texto na tela larga, como no Figma [RDS] de 07/10.

  - Abaixo de lg 1024 continua embaixo da descrição; de 1024 em diante fica à direita da coluna de texto, centralizada na vertical, antes do ×.
  - O texto (título + descrição) ganha o invólucro `.rds-alert__text`, que leva o respiro do título: um Alert só com título fica na linha do ícone mesmo ao lado de uma ação de 36.
  - A ação recomendada passa a ser Button `tone="neutral" variant="outline" size="sm"` (era ghost): embaixo, o contorno alinha com o texto; à direita, não some na chapa.

- 03f8d9f: AlertDialog não fecha mais no Esc: a decisão é obrigatória, só Cancelar ou a ação fecham (regra da casa, como no Figma [RDS]). Antes o Esc cancelava.
- 89d46dc: Alert ganha `icon`, `iconTone` e `layout`. `icon` troca o ícone do tom por um próprio, como um check. `iconTone` (`info` | `success` | `warning` | `danger`), só no tom `neutral`, pinta apenas o ícone com o `alert/<tom>/foreground` do estado, com 3:1 ou mais sobre a faixa neutra nos dois modos; a faixa, o título e o texto continuam neutros. Num Alert com outro tom o `iconTone` não faz nada. `layout="inline"` põe título e descrição na mesma linha como uma frase só, que quebra junto com as palavras quando não cabe; `stacked` continua o padrão. Uso: `icon={<CheckIcon />} iconTone="success" layout="inline" title="Você já pode vender:" description="PDV, Pix e pedidos no WhatsApp."`. Sem tokens novos. Exporta os tipos `AlertIconTone` e `AlertLayout`.
- dde39b7: Alert neutral segue o Figma [RDS]: a faixa vira um card, com `alert/neutral/background` em `surface/card` (era `surface/neutral`) e a borda nova `alert/neutral/border` em `border/default` (era transparente). Os tons info, success, warning e danger continuam com o próprio fundo e sem linha. Token novo na coleção Feedback: `alert/neutral/border`.
- a99fbf1: Banner attention segue o Figma [RDS]: os fundos vêm de três papéis novos do tema, `surface/attention/low` (amber/100, #fff2d6), `surface/attention/medium` (amber/200, #ffe3ab) e `surface/attention/high` (amber/400, #ffc107), com o mesmo valor no claro, no escuro e na chapa, para toda marca. O texto dos três níveis é `banner/attention/text` (text/on/warning, preto). O `color-mix` do medium sai. O CTA continua outline em low e medium e fill em high. No ds-core, o gerador e a tabela da marca rojao ganham os três papéis, e uma tabela exportada antes deles carrega o âmbar fixo com um aviso para exportar de novo. Tokens do componente: `banner/attention/{low,medium,high}/background` passam a apontar para `surface/attention/*`, `banner/attention/medium/background` e `banner/attention/text` são novos, e saem `banner/attention/low/text`, `banner/attention/medium/text` e `banner/attention/high/text`.
- c869882: Banner ganha `tone="attention"` com `level` (`low` | `medium` | `high`; padrão `low`), para o que pede ação em breve, como o fim de um teste grátis. O fundo vai do âmbar suave (`surface/warning`) ao âmbar cheio (`colors/state/warning`), nunca vermelho, e o `medium` fica no meio dos dois por `color-mix` (não existe papel de tema entre eles). Texto, destaque, ícone e × tomam a cor de texto do nível, com 4,5:1 ou mais em cada degrau, no claro e no escuro. O CTA (um Button em `action`) vira `outline` em low e medium e `fill` em high, desenhado nas cores da faixa; outra ação que não seja Button fica como veio. O layout continua trocando pela largura do contêiner, sem prop de tela. Tokens novos na coleção Blocks: `banner/attention/low/background`, `banner/attention/low/text`, `banner/attention/medium/text`, `banner/attention/high/background` e `banner/attention/high/text`. Exporta os tipos `BannerTone` e `BannerLevel`.
- 2f58488: Barra do pé floating no canto, X e desfazer de volta no compacto, e Toast embaixo no centro, como no Figma [RDS] publicado (Histórico 04/10/2026, revisão de `.bottom-bar`, FormActions, SavingBar e Toast).

  **Floating no canto inferior direito.** De 1024 para cima, o `placement="floating"` do FormActions e da SavingBar abraça o conteúdo (`width: fit-content`, nunca mais largo que o contêiner menos as margens) e fica no canto inferior direito do contêiner que rola, a 24 do fundo e da direita. Saem os 768 de largura máxima e a centralização. A folga fica menor: `bottom-bar/floating/padding-y` (8) e `bottom-bar/floating/padding-x` (12), mais os 2 do expandido, para 64 de altura. Continua `position: sticky` (não `fixed`): fica dentro do contêiner da página, então não cobre a sidebar ao lado, e o espaço que ocupa no fim do conteúdo é a folga que o conteúdo precisa. A SavingBar floating tem no mínimo 320 de largura. Abaixo de 1024, igual ao docked.

  **FormActions compacto com o X.** Abaixo de 1024, o primeiro filho (o Cancelar) volta como `IconButton` neutral ghost md com o ícone X e `aria-label` igual ao rótulo dele (o texto do filho, ou o `aria-label` que ele tiver), com o mesmo `onClick` e o mesmo `disabled`. Ordem: leading, X, primário, 8 entre os botões. A saída deixou de ser o X da topbar. Com mais de dois filhos, os do meio continuam fora do compacto.

  **SavingBar compacta com o desfazer.** Abaixo de 1024, o Descartar volta como `IconButton` neutral ghost md com o ícone undo-2, `aria-label` = `discardLabel`, chamando `onDiscard` e desabilitado no `saving`. Com o `leading` e o desfazer a 390, a mensagem padrão ocupa as 2 linhas e a barra fica com 68, como o quadro compacto do Figma.

  **Toast: padrão bottom-center.** O `Toaster` empilha embaixo e no centro em todo tamanho de tela (antes, no canto inferior direito), sem troca por breakpoint; no celular, a largura da tela menos 16 de cada lado. Com FormActions ou SavingBar na tela, a pilha sobe acima da barra: a barra preenche `--toast-offset-bottom` no `:root` enquanto está montada e visível (altura dela, mais a margem no floating, mais 16), e a variável volta ao padrão (16) quando a barra sai ou quando o teclado do celular a esconde. Não há prop de posição no `Toaster`; quem precisar de outra distância pode definir `--toast-offset-bottom` no `:root`.

  **Tokens.** Entram `bottom-bar/floating/padding-y` (→ `space/8`) e `bottom-bar/floating/padding-x` (→ `space/12`), `--bottom-bar-floating-padding-y` e `--bottom-bar-floating-padding-x`. Sai `bottom-bar/floating/max-width` (`--bottom-bar-floating-max-width`).

  **Atenção.** Quem lia `--bottom-bar-floating-max-width` deixa de tê-lo. Telas que contavam com a barra floating centralizada passam a vê-la no canto direito, e os toasts saem do canto para o centro.

- 0f62559: **BREAKING.** FormActions e SavingBar passam a montar sobre a mesma casca, o componente interno `BottomBar` (`.rds-bottom-bar`, não exportado), como no Figma [RDS] (Histórico 04/10/2026, "rumo novo do pé das telas"). As duas barras ficam na cor da marca (`bottom-bar/background` → `colors/primary/default`), 64 + área segura no compacto e 68 no expandido, 24 dos lados, `position: sticky` no pé do contêiner que rola, e saem do caminho do teclado do celular.

  **FormActions vira só ações.** Os filhos são as ações, em ordem de leitura; o último é o primário. No expandido (de 1024 para cima) aparecem todos, à direita; no compacto, só o primário (os outros ficam com `display: none`, e o Cancelar vai para o X da topbar). O fundo neutro e o fio em cima saíram.

  **SavingBar sem detalhes.** O botão de detalhes, o chevron e o anel saíram: o que falta é coisa do projeto e, se precisar de um controle, ele vai no `leading`. Ficam o status, o Descartar e as mensagens.

  **Novo nas duas:**
  - `placement="docked" | "floating"` (padrão `docked`). O `floating` só vale de 1024 para cima: 24 de margem, até 768 de largura, centralizado, `radius/container` e sombra `elevation/overlay`. Abaixo de 1024 ele é idêntico ao `docked`.
  - `leading?: ReactNode`: um controle de ~44 à esquerda, nunca texto corrido. Presente (mesmo `null` enquanto o controle está escondido), reserva 44 de largura para o resto não pular. Quem ocupa o slot anuncia as próprias mudanças.

  **Mapa de migração**

  | Sai                                                                                                                                | Entra / equivalente                                                                                                                                        |
  | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `<FormActions layout="bar">`                                                                                                       | `<FormActions>` (`placement="docked"`, o padrão)                                                                                                           |
  | `<FormActions layout="inline">` (cartão solto)                                                                                     | no pé da tela: `<FormActions placement="floating">`; no fim de card ou diálogo: Buttons soltos ou `ButtonGroup`                                            |
  | `<FormActions layout="stacked">`                                                                                                   | no pé da tela: `<FormActions>` (no compacto só o primário; o Cancelar vai para o X da topbar); fora do pé: `ButtonGroup`                                   |
  | `FormActions` `helper`, `showHelper`                                                                                               | sem equivalente na barra: a frase vai para a tela (perto do campo ou na coluna do checklist); um controle de ~44 pode ir em `leading`                      |
  | `FormActions` / `SavingBar` `onDetails`, `detailsLabel`, `detailsExpanded`, `detailsControls`                                      | `leading={<Button …>}` que abre o Drawer do projeto, com o próprio `aria-expanded`/`aria-controls`                                                         |
  | tipo `FormActionsLayout`                                                                                                           | tipo `FormActionsPlacement` (`'docked' \| 'floating'`); novo `SavingBarPlacement`                                                                          |
  | ordem invertida do `stacked` (primário primeiro)                                                                                   | ordem de leitura sempre: Cancelar primeiro, primário por último                                                                                            |
  | classes `.rds-form-actions--inline\|--stacked\|--bar\|--keyboard`, `.rds-form-actions__helper\|__text\|__details\|__icon\|__quiet` | `.rds-bottom-bar`, `.rds-bottom-bar--docked\|--floating\|--keyboard`, `.rds-bottom-bar__leading`; ficam `.rds-form-actions` e `.rds-form-actions__actions` |
  | classes `.rds-savingbar__row`, `.rds-savingbar__details`, `.rds-savingbar__message--details`, `.rds-savingbar--keyboard`           | `.rds-bottom-bar…` como acima; ficam `.rds-savingbar`, `__message`, `__text`, `__icon`, `__actions`, `__discard`                                           |
  | tokens `--savingbar-background`, `-text`, `-focus-ring`, `-button-fill-background`, `-button-fill-label`, `-button-ghost-label`    | `--bottom-bar-background`, `-text`, `-focus-ring`, `-button-fill-background`, `-button-fill-label`, `-button-ghost-label` (mesmos valores)                 |
  | tokens `--form-actions-background`, `-border`, `-text`, `-bar-background`, `-focus-ring`                                           | apagados; a barra usa `--bottom-bar-*`                                                                                                                     |
  | —                                                                                                                                  | novos: `--bottom-bar-padding-x`, `-padding-y`, `-gap`, `-leading-min-width`, `-floating-radius`, `-floating-margin`, `-floating-max-width`                 |

  Continua valendo: o conteúdo precisa de folga embaixo igual à altura da barra (`scroll-padding-bottom` e `padding-bottom`, mais a margem no `floating`, mais `env(safe-area-inset-bottom)`), e o primário nunca fica desabilitado.

- eae08d7: Button e IconButton ganham `size` (`sm` 36, `md` 44, `lg` 52; padrão `md`), e o Button ganha `iconPosition` (`start` | `end`; padrão `end`), como no Figma [RDS].

  - As medidas saem dos 24 tokens novos `--button-size-<sm|md|lg>-*` (coleção Actions).
  - A área de toque é 44 × 44 em todos os tamanhos: no `sm`, uma camada invisível estende o toque em `@media (pointer: coarse)`, sem mexer no layout nem no anel de foco.
  - Sem mudança de aparência para quem não passa `size`: o padrão `md` é o botão de antes.

- 5524dc7: Button e IconButton `size="sm"` passam de 36 para 32 (padding vertical 6). A barra do DataTableHeader fica toda em 32, junto com o Input sm e o FilterChip. O alvo de toque segue 44 no ponteiro grosso (camada invisível de 6 px).
- 8c2b000: Card: o conteúdo empilha os blocos com o mesmo espaço do padding (24 no md, 16 no sm), como o gap do slot `cardContent` no Figma [RDS] de 07/10. Alert + lista dentro do Card não precisam mais de espaçador.
- 757e6e8: Card `variant="inverse"`: o fundo escuro da marca (`surface/inverse`; branco no escuro e na chapa), sem borda e sem sombra. Título, conteúdo, nota do rodapé e ícones em `currentColor` usam `text/on-inverse`; a descrição, `text/on-inverse-subtle`. No print o fundo se mantém (é preenchimento cheio). Tokens novos na coleção Content: `--card-inverse-background`, `--card-inverse-title` e `--card-inverse-description`.
- 8c2b000: Chart `type="bar"` pinta todas as barras com a primeira cor de série: é um ranking, a cor categórica por linha não dizia nada (Figma [RDS] 09/10, pedido do [GRA]).
- 3401f79: Chart, como no Figma [RDS] (`dates` e barras com destino):
  - `dates="edges" | "all"`: troca o `showAllDates`, que fica deprecado. O padrão passa a ser `edges` (primeira, meio e última data).
  - `dateEvery={N}`: uma data a cada N pontos, com um tique em cada ponto (token `chart/tick`).
  - `hrefs` (um por item) ou `onSelect(index)`: no bar, cada barra vira link ou botão, com o nome "<rótulo>: <valor>", hover em `chart/bar/hover` e anel de foco em `chart/focus/ring`. No column, clique ou Enter no gráfico escolhe o ponto. Na tabela visível, o rótulo vira link.
- 40ac985: ChoiceCard `layout="preview"` passa a desenhar a imagem com o `Media` (16:9, decorativo), com a mesma borda de 1px, o raio radius/container, o check no canto e o ícone de imagem vazia quando não há `preview`. As medidas não mudam. A classe interna do ícone vazio passa a ser `.rds-media__fallback` (era `.rds-choice-card__placeholder`).
- 8c2b000: ChoiceCard: o selecionado fica leve, como no Figma [RDS] de 07/10. Antes era uma chapa cheia na cor da marca, que brigava com o botão primário do diálogo.

  - Selecionado = borda de 2 px na marca + fundo `surface/tint/subtle`, título e descrição nos tons normais, ícone na marca sobre `surface/card`, radio (anel e ponto) na marca.
  - Vale para os três layouts; o check do tile passa a ser cheio na marca com o glifo em `text/on/primary`.
  - Tokens `choice-card/*/selected`, `choice-card/radio/dot` e `choice-card/check/*/tile` mudam de alvo; a chapa cheia fica só para o ToggleGroup.

- b170037: ChoiceList, a lista densa de escolha única (#4), como no Figma [RDS] (Content/ChoiceList e `.choice-list/item`):
  - `<ChoiceList value | defaultValue onValueChange aria-label>` com `<ChoiceListItem value title description media trailing disabled />`. Cada linha: mídia de 32 (Avatar ou Tile), nome, meta apagada e um valor à direita; recuo 12 16, borda só embaixo, 60 de altura com descrição (44 sem), dezenas na tela.
  - Semântica de listbox: a lista tem um só ponto de Tab (`role="listbox"`, `aria-activedescendant`), cada linha é `role="option"` com `aria-selected`. Setas, Home e End andam pulando as desabilitadas; Enter, espaço ou clique escolhem. O título dá o nome da linha; a meta e o valor a descrevem; a mídia é decorativa.
  - Estados: hover em `choice-list/item/background/hover`; a escolhida ganha o tint e uma faixa de 2 à esquerda (`choice-list/item/indicator`), sem hover; o anel de foco da linha ativa em `choice-list/focus/ring`; a desabilitada nos tokens `*/disabled`.
  - 12 tokens novos na coleção Content, grupo `choice-list` (`--choice-list-*`), todos apontando para papéis do theme.
- 68b5965: Correções de contraste do Figma [RDS] (tokens extraídos de novo).

  - **Tema:** papel novo `--border-error` (red/600 no claro, red/400 no escuro, red/300 na chapa). `--text-on-info` passa a preto (era branco sobre blue/500, 3,12:1) e `--chart-series-2` claro passa a orange/600.
  - **Borda de erro dos campos:** `--input-border-error`, `--textarea-border-error`, `--select-border-error`, `--checkbox-control-border-error`, `--radio-control-border-error`, `--otp-slot-border-error`, `--file-input-area-border-error`, `--chip-input-border-error`, `--number-input-border-error`, `--color-input-border-error` e `--attachment-border-error` passam de `colors/state/error` para `border/error`. Na Rojão a cor não muda no claro; no escuro e na chapa a borda fica no vermelho claro, que passa 3:1 sobre o card.
  - **Tabs:** o selo "em breve" (`--tabs-soon-text`) passa de `text/disabled` para `text/subtle`.
  - **ChoiceCard:** a descrição do cartão escolhido (tile e preview) perde a opacidade de 70%. **FilterChip:** a contagem perde a opacidade de 60%. As duas ficam na cor cheia do token.
  - Quem gera o tema de uma marca com `rdsThemeFromTable` precisa reexportar a tabela da marca (`figma/export-brand.js`) por causa do papel novo; a tabela antiga carrega com aviso até lá (ver `@rojaostudio/ds-core`).

- 9164583: DateRangePicker e Calendar em intervalo, como no Figma [RDS] de 10/10 (#42, item 4).

  - **Calendar** ganha `mode="single" | "range"` (single é o padrão; tipos `CalendarSingleProps`, `CalendarRangeProps` e `DateRange`). No range, a primeira escolha é o início e a segunda o fim (um dia anterior troca os dois; a terceira recomeça), e `onValueChange` recebe `{ from, to }`. O dia em range é start, middle ou end: start e end são a chapa de selecionado, middle é só a faixa contínua, sem cantos. Todos os dias do intervalo ficam `aria-selected` e as pontas dizem isso no nome ("1 de outubro de 2026, início do período").
  - **DateRangePicker** novo: `value={{ from, to }}`, `onValueChange` (só com o intervalo inteiro) e `presets` (padrão Hoje, Últimos 7 dias, Este mês e Mês passado, de `dateRangePresets(today)`; aceita presets próprios `{ label, range }`). O campo mostra o intervalo; o painel abre com os presets à esquerda (escolha única, com o check, como o DropdownMenuRadioItem) e o Calendar em range. No compacto (abaixo de 1024) o painel vira o sheet do Dialog, com os presets como FilterChips no topo e o Calendar embaixo.
  - Teclado: os presets são um listbox (setas movem, Enter ou Espaço escolhem), Tab leva ao calendário, Escape fecha sem mudar. O intervalo escolhido é anunciado ("Período escolhido: de … a …") e fica na descrição do campo; o início escolhido no calendário é anunciado dentro do painel.
  - Token novo: `--calendar-day-background-range` (surface/tint/default).

- ccacba9: `DescriptionList` + `DescriptionItem`: pares rótulo → valor (`<dl>`, cada par num `<div>` com `<dt>` e `<dd>`), item 2 da #42. Figma [RDS] 07/10: Content/DescriptionList.

  - `layout`: `stacked` (rótulo em cima, o padrão) ou `inline` (rótulo numa coluna de 160, ou 104 no `sm`; no compacto, abaixo de 1024, vira empilhado).
  - `density`: `md` (tela) ou `sm` (folha impressa, 12/16).
  - `columns`: `1` (um par por linha) ou `'auto'` (colunas de no mínimo 300 que quebram: 1 no celular, 2 num card).
  - O valor aceita texto ou componente (Status, Badge, link).
  - Tokens novos `--description-list-label`, `--description-list-value`, `--description-list-label-width-md` e `--description-list-label-width-sm`.

- 03f8d9f: Dialog ganha `footerStart`: conteúdo fixo no começo do rodapé, antes dos botões (um total ao vivo), que não rola com o conteúdo. Quando os botões não cabem ao lado (sm, e sempre no sheet do compacto) ele sobe para cima deles. Só no Dialog (Figma [RDS] 09/10, pedido do [GRA]).
- 6e6f8ca: Dialog e AlertDialog viram sheet ancorado embaixo no compacto (abaixo de 1024), com a mesma API (#45). Figma [RDS] 06/10: pelo modo viewport, sem variante.

  - **Dialog**: encosta embaixo, com a largura da tela até 560 em qualquer `size`; ganha a alça (arrastar para baixo fecha), sobe acima do teclado da tela e respeita a área segura. O Cancelar padrão sai (fecham a alça, o véu, o Escape e o ×) e a ação ocupa a largura. Um `footer` próprio empilha em largura cheia, o último (a ação principal) em cima.
  - **AlertDialog**: também vira sheet, sem alça e sem fechar no véu; as duas ações ficam, em largura cheia, a de confirmar em cima. O foco continua abrindo no Cancelar.
  - **Drawer**: o rodapé passa a respeitar a área segura (`env(safe-area-inset-bottom)`).
  - Token novo `--dialog-handle`.

- 40d360e: DropdownMenuRadioItem segue o `.menu/radio-item` do Figma (#53): o check vai para uma coluna de 20 antes do rótulo, reservada em todas as opções, e os rótulos ficam alinhados com e sem o check (os idiomas de um UserMenu, um filtro). Antes o check vinha à direita e só existia na opção marcada. `DropdownMenuRadioGroup` e `DropdownMenuRadioItem` continuam públicos, com `role="menuitemradio"` e `aria-checked` pelo primitivo do Radix.
- cda2023: DataTableHeader com o arranjo compact do Figma [RDS]: a barra é um contêiner de tamanho (`container-type: inline-size`) e, abaixo de 1024 de largura da própria barra (`@container (max-width: 1023px)`, o mesmo corte da SavingBar), troca de arranjo; o `@media (min-width: 768px)` saiu. Sem prop de tela.

  - **Compact:** a busca aceita 200 (`min-width: min(200px, 100%)`); o filtro vira um IconButton outline neutral md (44 × 44) com o ícone sliders e Tooltip com o rótulo, abrindo o mesmo Drawer ou Popover de antes. Com filtro ativo, um ponto (um filtro, na cor do Badge neutral) ou um Badge neutral com o número (vários), ambos `aria-hidden`; o estado vai no nome acessível ("Categoria, Pago", "Filtros, 3 ativos"). A 390, busca, filtro e uma ação IconButton cabem numa linha.
  - **Expanded (1024 para cima):** igual a antes: Separator vertical e o Button com rótulo ("Status", "Filtros · N"); a busca segue com mínimo de 320.

  O arranjo agora segue a largura da barra, não a da tela: uma barra estreita numa tela larga (painel, coluna) fica compact.

- 3da6776: DataTableHeader reconstruído 1:1 com o Figma [RDS] (componente sem variantes, átomo `.filter-trigger`).

  Novo:

  - `count?: ReactNode` — contagem de resultados no fim das ferramentas ("128 resultados"), região viva (`aria-live="polite"`).
  - `search.label` — nome acessível da busca, separado do placeholder (padrão "Buscar"; placeholder padrão "Buscar…"). A busca fica num `role="search"` com o mesmo nome.
  - Linha própria de filtros ativos (`__active`) abaixo da barra: os Chips ("Status: Abertos", `removeLabel` "Remover filtro Status: Abertos") e "Limpar filtros" (Button ghost sm, `onClear`), que devolve o foco à busca. Vale também para um filtro só e para o arranjo compacto.
  - Filtros rápidos num `role="group"` "Filtros rápidos". Gatilhos com `aria-expanded`/`aria-haspopup`; Esc fecha o menu, o Popover ou o Drawer e devolve o foco ao gatilho.
  - Token de componente local `--data-table-header-search-min`: 320px, 200px abaixo de 1024 (variável `data-table-header/search-min` do Figma, ainda não publicada no Base Tokens).

  Breaking (visual e de acessibilidade; nenhuma prop saiu, sem regra de codemod por não ser mecânico):

  - O nome acessível da busca deixa de ser o placeholder: passe `search.label` ("Buscar produtos") se o nome antigo importava.
  - Sai o Separator entre a busca e os filtros.
  - Compacto: saem o ponto e o Badge sobre o IconButton. Com filtro ativo o gatilho vira Button fill com o ícone sliders e o número no rótulo ("2"); o nome continua "Filtros, 2 ativos" / "Categoria, Pago".
  - Um filtro, expandido: o gatilho é Button com sliders à esquerda e o rótulo do filtro ("Status"), fill quando ativo (nome "Status, Abertos"); antes mostrava a opção escolhida com chevron à direita. Sai o IconButton X "Limpar filtros" ao lado.
  - Os Chips dos filtros ativos saem da linha das ferramentas e vão para a linha `__active`; o texto passa a "Rótulo: opção". "Limpar filtros" sai de dentro do Popover e do Drawer.
  - `__tools` alinha ao início (`justify-content: flex-start`; antes `flex-end`). A raiz vira coluna, com `__row` (ferramentas + ação) e `__active`.
  - Classes: saem `__dot` e `__trigger`; `__count` agora é a contagem de resultados; `__search` é o wrapper `role="search"` (o `className` não vai mais no Input).

- 4826129: FAB: `count` e `countLabel`. Uma pílula depois do rótulo mostra o número em bold `tabular-nums` ("99+" acima de 99) e some com 0 ou undefined. O nome acessível inclui o número real: "Carrinho, 12 itens" (sem `countLabel`, "Carrinho, 12"). O `FABConfig` do `usePageFAB` aceita os dois e repassa. Tokens novos `fab/count/background` (o fundo da pílula, a 20%) e `fab/count/text`, ambos em `text/on/primary`.

  O hover do FAB deixa de escurecer o fundo: `fab/cta/background/hover` passa a `colors/primary/default` e a sombra sobe de `elevation/raised` (repouso) para `elevation/overlay`, o que mantém o número da pílula acima de 4,5:1 no hover. A pílula tem 20 de altura e o número em `type/small` (14/20).

- 0e2eab7: Sincronia com o Figma [RDS] de 03/10/2026: tokens extraídos de novo (agora por um script que está no repositório) e Card, Sidebar, DataTableHeader, SavingBar e ColorInput alinhados à spec atual.

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

- cccda9a: `FilterChipMenu`: filtro em pílula com menu de múltipla escolha, para uma categoria com muitas opções numa barra de lista (#47). Figma [RDS] 06/10: Forms/FilterChipMenu.

  - A pílula é o FilterChip (32 de altura, 44 de toque, os mesmos tokens e o estado ligado) com um chevron; fechada mostra o valor: "Processo: Todos", "Processo: Laser", "Processo · 2". Liga enquanto há algo marcado.
  - O menu (DropdownMenu) traz uma opção marcável por item, com a contagem à direita, e "Limpar" no fim. Marcar não fecha; Limpar desmarca tudo, fecha e devolve o foco à pílula.
  - Acessível: `aria-haspopup="menu"` e `aria-expanded` na pílula, o valor no nome; itens `menuitemcheckbox`.
  - `DropdownMenuCheckboxItem` novo (`checked`, `onCheckedChange`, `count`, `closeOnSelect`), e `count` também no `DropdownMenuItem` e no `DropdownMenuRadioItem`.
  - Nenhum token novo.

- 578bd89: FormActions ganha `layout="bar"`, o pé da criação, como no Figma [RDS] (03/10). Aditivo: `inline` e `stacked` seguem iguais.

  - **Novo:** `layout="bar"`, o mesmo esqueleto da SavingBar, mas neutro: fundo `form-actions/bar/background` (`surface/page`) com a linha fina `form-actions/border` em cima, nunca a cor da marca (essa é sinal da SavingBar, na edição). A partir de 1024 é uma faixa de 68 (12 24), a frase de apoio à esquerda e Cancelar + primário à direita. Abaixo de 1024 (pela largura da tela, o mesmo corte da SavingBar) é uma linha de 64 mais a área segura: a frase (até 2 linhas) à esquerda e só o primário (o último filho) à direita. No celular o Cancelar sai do pé: a saída é o voltar ou X da topbar, com "Sair sem criar?" se houver algo digitado, e ele pode ir também no rodapé do Drawer.
  - **Novo:** `onDetails`, `detailsLabel` (padrão "Ver o que falta"), `detailsExpanded` e `detailsControls` (o `showDetails` do Figma), como na SavingBar. Com `onDetails` no `bar` compacto, a frase vira um botão com chevron para cima que abre o que falta (um Drawer); o nome acessível é a frase seguida de `detailsLabel`, com `aria-expanded` e `aria-controls`. Hover sublinha, o foco desenha o anel `form-actions/focus/ring` (novo token, `focus/ring`), e a área de toque tem 44 de altura.
  - **Muda:** a frase de apoio (`helper`) passa a ser `<p role="status">` em todos os layouts: quando muda, é anunciada sem mover o foco.
  - **Tokens novos:** `form-actions/bar/background` e `form-actions/focus/ring`.

- 71fd5b3: Heading, como no Figma [RDS] Content/Heading: o título na dupla da marca.
  - `level="band" | "heading" | "value"` (36/48, 24/30, 20/30, negrito), `tone="default" | "accent"` e `as="h1"`…`"h6"` (padrão `h2`; o tamanho não decide o nível do HTML).
  - `<Heading.Mark>` (ou `HeadingMark`) pinta um trecho na outra cor da dupla: laranja num título `default`, a cor do título num `accent`.
  - Tokens novos na coleção Content: `--heading-default` (→ `text/heading`) e `--heading-accent` (→ `colors/accent/default`).
  - Laranja sobre branco não passa contraste nem em título grande (2,9:1 na Rojão): o `accent` e o destaque laranja são para fundo escuro ou a chapa da marca.

  Muda aparência: na Rojão, `text/heading` no claro passa de laranja (#ff6a00) para azul (#1b2a4a), como no Figma. Mudam junto os componentes que usam o papel: títulos de Card, Dialog, AlertDialog, Accordion, Calendar e dos blocos, rótulos de campo, a etapa atual do Breadcrumb, o rótulo do Button neutral outline/ghost e outros. No escuro e na chapa nada muda.

- 88377ee: Os tokens do contador do IconButton passam a ter o nome do Figma [RDS]: `button/count/background` vira `icon-button/count/background` e `button/count/label` vira `icon-button/count/label`, com os mesmos valores (colors/state/error e text/on/error). Quem lia `--button-count-background` ou `--button-count-label` passa a ler `--icon-button-count-background` e `--icon-button-count-label`.
- a1ac2f3: IconButton ganha `count` e `countLabel` (#53): uma pílula danger no canto superior direito, 4 além da borda, com "99+" acima de 99, que some com 0 ou `undefined`. O número real entra no nome acessível depois do `label`, e o `countLabel` diz o que ele conta: `label="Notificações" count={3} countLabel="não lidas"` vira "Notificações, 3 não lidas" (sem `countLabel`, "Notificações, 3"). Funciona também com `asChild`. Tokens novos na coleção Actions: `button/count/background` (colors/state/error) e `button/count/label` (text/on/error).
- 8c2b000: Input ganha `size` (`md` 44, padrão; `sm` 32) para barras densas, como a busca ao lado dos FilterChips. No `sm` o texto continua 16/24 (o iOS não dá zoom), os ícones vão a 16 e o limpar a 24; não tem label flutuante. Figma [RDS] 07/10.
- 95191b8: Item ganha a lista densa e a seleção, como no Figma [RDS] de 10/10 (#4).

  - `variant="row"`: sem cantos, só o separador embaixo (`item/border`), recuo 12 × 16 no md e 8 × 16 no sm, mídia numa caixa de 48 ou 32, título e descrição numa linha cada com reticências; o valor vai no `trailing`. Para dezenas de linhas num painel lateral ou numa busca de cliente.
  - `selected?: boolean`, em qualquer variante: fundo `item/selected/background` (surface/tint/subtle) e faixa de 3px no começo da linha em `item/selected/indicator` (text/action).
  - `onSelect?: () => void`: a linha vira pressionável. O título é um `<button>` com a área de clique esticada sobre a linha toda, descrito pela descrição, com `aria-pressed` quando há `selected`; o anel de foco é desenhado na linha e o `action` continua um controle à parte. `aria-pressed` e não `listbox`/`option` porque cada linha segue um botão comum numa lista comum (a lista e o tamanho dela continuam anunciados), pode manter o próprio `action` e dispensa foco itinerante.
  - Tokens novos: `--item-selected-background` e `--item-selected-indicator`.

- 8c2b000: Item ganha `trailing`: a meta da linha entre o texto e a ação (Status ou Badge sm, ou um valor), como o slot `trailing` do Figma [RDS] de 07/10. Estado vai aí, não no fim da descrição.
- 6290ef7: LoadingOverlay novo; SavingBar compacta numa linha e com um só indicador no `saving`; Spinner com as cores novas do Figma [RDS] (03/10).

  - **Novo: `LoadingOverlay`** (`@rojaostudio/ds/components` ou `@rojaostudio/ds/components/loading-overlay`). A espera longa de uma ação que leva a outra página (criar o produto e cair na edição). Props: `open`, `label` (padrão "Carregando…"), `delay` (padrão 400 ms) e `container`. Só aparece se `open` continuar `true` depois do `delay`; antes disso a espera é o botão principal em loading, e se a página nova abrir antes, o overlay nem aparece. No erro, o app fecha (`open={false}`), o foco volta ao botão e o erro vai para a SavingBar em `status="error"`. Véu `loading-overlay/scrim` em `position: fixed` na camada `--z-overlay` (portal no body, ou no `container`); no centro, um painel `loading-overlay/background` (radius/container, elevation/modal, até 320) com o Spinner lg e o `label` numa região `aria-live="polite"`. `role="dialog"` `aria-modal="true"` com o `label` de nome; o foco vai para o painel e fica preso, Esc não fecha, e o resto da página leva `inert` e `aria-busy="true"` enquanto ele está aberto (devolvidos ao fechar). Com `prefers-reduced-motion`, sem fade e o giro lento. Tokens novos: `loading-overlay/scrim`, `loading-overlay/background` e `loading-overlay/text` (Overlays).
  - **Muda aparência — SavingBar no celular.** Abaixo de 1024 a barra vira uma linha só, 64 de altura (`padding-block: 10px`, mais `env(safe-area-inset-bottom)` embaixo): a mensagem (ou o botão "ver o que falta", com `onDetails`) à esquerda, em até 2 linhas, e só o botão principal à direita. O Descartar não aparece no compacto: no celular ele é do app, no rodapé do Drawer de detalhes ou na confirmação ao sair. O expandido (a partir de 1024) não muda.
  - **Muda aparência — SavingBar em `status="saving"`.** Sai o loader da mensagem: o indicador é o Salvar em loading (`<Button loading>`), com o rótulo `savingLabel` (novo, padrão "Salvando…"), e o Descartar fica desabilitado. Um só indicador, inclusive com o LoadingOverlay por cima.
  - **Muda aparência — Spinner.** `spinner/indicator` passou de `colors/primary/default` a `colors/primary/dark` (o arco passa 3:1 também numa marca clara, como um ciano), e `spinner/inverse/indicator` e `spinner/inverse/label` de `text/on/primary-strong` a `text/on/primary`.

- 6e9c1b0: MediaTile pega a largura do pai: o tile ocupa 100% do container e a mídia mantém a proporção por aspect-ratio, sem largura fixa e sem mínimo ou máximo. `size="sm" | "md"` passa a mudar só o rótulo (sm numa linha com reticências, md em duas); o sm deixa de ter 96 de largura.

  **Breaking:** sai `fluid` (e a faixa de 72 a 100). Sem `fluid`; envolva o tile num wrapper com a largura que quiser (ex.: flex 1 1 72px; max-width 100px).

- 862da32: MediaTile ganha `size` e `fluid`. `size="sm"` tem 96 de largura e a legenda em caption 12/16 numa linha só, com reticências; `md` (padrão) continua como era, ocupando a coluna (160 no Figma) com a legenda em duas linhas. `fluid` deixa o tile crescer e encolher entre 72 e 100 numa linha flex (`flex: 1 1 72px`, `max-width: 100px`), com a mídia sempre quadrada, mesmo com `aspect="video"`: quatro miniaturas por linha num card de 480. Exporta o tipo `MediaTileSize`.
- 01bd5bd: MediaTile passa a usar o `Media` por dentro e ganha `ratio` com as cinco proporções (`1:1`, `4:3`, `3:4`, `16:9`, `9:16`). Dentro do tile a mídia fica sem raio e mantém as cores `media-tile/*`, então o visual não muda.

  - `aspect` e o tipo `MediaTileAspect` ficam deprecated: `square` vira `1:1` e `video` vira `16:9`. Se vierem os dois, `ratio` vence.
  - No fallback com `alt`, a mídia vira role="img" com esse nome; sem `alt`, a mídia é decorativa (o rótulo já diz o que é).
  - A classe interna do fallback passa a ser `.rds-media__fallback` (era `.rds-media-tile__fallback`).

- 05a172f: Componente novo `Media`: uma caixa de imagem ou vídeo numa proporção fixa, `<Media ratio="1:1" | "4:3" | "3:4" | "16:9" | "9:16" src alt fit="cover" | "contain" />`.

  - Ocupa 100% do pai e a altura vem do aspect-ratio, então a imagem nunca distorce. Raio em `media/radius` (radius/card) e overflow hidden.
  - O tipo exige `alt` ou `decorative`. Com `decorative`, a imagem leva alt="" e a caixa aria-hidden.
  - Sem `src`, ou quando a imagem falha, mostra o fallback: fundo `media/background` (surface/muted) e o ícone de imagem quebrada centrado em `media/fallback` (text/subtle). No fallback com `alt`, a caixa vira role="img" com esse nome.
  - Aceita `children` no lugar de `src` (next/image, picture, video) e uma prop `fallback` para trocar o ícone.
  - Exporta `Media`, `MediaProps`, `MediaRatio` e `MediaFit`. Tokens novos na coleção Content: `media/background`, `media/fallback`, `media/radius`.

- 907c6f7: O alvo nativo (`@rojaostudio/ds/native`, `/native/components`, `/native/theme`, `/native/icons`, `/native/preset`) fica **experimental, fora do semver na 2.0**: o alvo nativo segue a API 1.x na 2.0 e será alinhado na 2.1. Ele continua com `Button variant="primary"`, `Modal`, `Menu` e o tema do `generateTheme` 1.x, e pode mudar em qualquer versão até lá (fixe a versão exata se depende dele). Os pontos de entrada levam `@experimental` no JSDoc e o README diz o mesmo. Um teste garante que nenhum componente web importa do alvo nativo.
- dbb1ee4: NumberInput ganha `size?: 'sm' | 'md'` e `onRemove`.

  - `sm`: moldura de 32 de altura que abraça o conteúdo; − e + com 32 de largura e o número com no mínimo 32, crescendo com os dígitos. O rótulo fica visualmente oculto e continua dando nome ao campo. No ponteiro grosso, − e + chegam a 44 × 44 crescendo para fora (o − para a esquerda, o + para a direita, e os dois para cima e para baixo), sem cobrir o número. `md` (padrão) continua como era.
  - `onRemove?: () => void` e `removeLabel` (padrão "Remover item"): no mínimo, o − vira uma lixeira, fica ativo, entra no Tab e chama `onRemove`. Sem `onRemove` nada muda: o − desliga no mínimo.
  - Exporta o tipo `NumberInputSize`.

- c337b76: Papéis novos no tema, para o Card inverso: `surface/inverse`, `text/on-inverse` e `text/on-inverse-subtle` (`--surface-inverse`, `--text-on-inverse`, `--text-on-inverse-subtle`).

  - **Claro e print:** o fundo é a primária da marca quando o branco passa 4,5:1 sobre ela; senão (uma marca clara, como um ciano), coal/900. Texto branco; subtítulo branco a 70%, mais opaco de 5 em 5% quando 70% não passa 4,5:1 sobre o fundo (um violeta, um verde médio).
  - **Escuro e chapa:** fundo branco, texto coal/900, subtítulo coal/600.
  - Na Rojão: navy/900 no claro. A tabela `rojao.rds.json` ganha os três papéis; uma tabela exportada antes deles continua carregando, com os papéis tirados da mesma regra e um aviso pedindo a reexportação.
  - O par `text/on-inverse` sobre `surface/inverse` entra no relatório de contraste. O tema passa de 107 para 110 papéis.

- 07963a7: Modo print no tema publicado (issue #42, item 5). `styles/rds/theme.css` ganha o bloco `@media print` do `ds-core`: na impressão, fundos brancos, sem sombra, bordas e textos do claro, inclusive em `.dark` e `.ds-plate`. Entram as variáveis `--media-type-<papel>-size|line` (`caption`, `small`, `body`, `label`, `title`), a tipografia de tela na tela e 8/10, 9/12, 10/14, 12/16 e 18/24 pt no papel, para a folha impressa do consumidor. Os componentes mantêm a própria tipografia.
- e19fa90: Progress ganha `tone` (`neutral` | `success` | `warning` | `danger`; padrão `neutral`, o preenchimento de antes). Só o preenchimento muda, o trilho fica igual. Tokens novos na coleção Indicators, escolhidos para dar contraste não-texto de 3:1 ou mais contra o trilho (`surface/tint/strong`) no claro e no escuro: `progress/fill/success` (colors/state/success-strong), `progress/fill/warning` (text/warning) e `progress/fill/danger` (text/error). Exporta o tipo `ProgressTone`.
- f6efbd9: **Card:** a ação do cabeçalho segue o `.card/header` do Figma de 04/10/2026.

  - **Muda aparência:** com `align="start"`, a ação fica numa faixa da altura da linha do título (`type/label/line`, 24, no md; `type/small/line`, 20, no sm), centrada nela, com ou sem descrição. Antes, ela se alinhava ao topo do cabeçalho. Um IconButton de 44 ou um Button sm de 36 transborda a faixa por igual, em cima e embaixo, e nada o corta. Com `align="center"`, nada muda.
  - `action` aceita também o Switch (use `size="sm"`).

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

- f6efbd9: **Switch:** `size` e `labelPosition`, como no Figma de 04/10/2026.

  - `size="md" | "sm"` (padrão `md`, o de antes). O `sm` é só o controle e o texto: sem padding em cima e embaixo (24 de altura), com a largura do conteúdo (`fit-content`). Serve para o cabeçalho do Card e para uma linha de 24. O alvo de toque de 44 continua: uma camada invisível em volta do controle (pseudo-elemento, 10 em cima e embaixo, 4 nos lados), que não ocupa layout. Substitui o override que zerava o padding vertical.
  - `labelPosition="end" | "start"` (padrão `end`, o de antes). No `start`, o rótulo vem antes e o controle fica na borda direita: no md, o rótulo preenche; no sm, o controle vem logo depois do texto. O hint e o erro perdem o recuo do controle e se alinham ao rótulo. Só muda a ordem visual: o DOM, a ordem de Tab e o nome acessível ficam iguais.
  - Tipos novos no barril: `SwitchSize` e `SwitchLabelPosition`.

- 426963b: Alinhamento ao Figma [RDS] dos componentes que só existiam no código (o Figma é a verdade; o código segue um para um):

  - **ToggleCard** ganha `layout="default" | "compact"`, como o componente do Figma (Forms/ToggleCard). O `compact` é a antiga linha do `ToggleCardCompact` (Item outline, resumo sob o rótulo, lápis que abre as opções) e traz as props `summary`, `icon`, `onEdit` e `editLabel`. `onCheckedChange` passa a ser opcional. O `ToggleCardCompact` continua exportado como wrapper deprecated de `<ToggleCard layout="compact">`; o codemod troca um pelo outro.
  - **FloatingStepper**: a linha antes da ação agora é um `<Separator orientation="vertical">` de 24.
  - **DataTableHeader**: a contagem de filtros vai no rótulo do botão, "Filtros · 3" (sem Badge), com o ícone antes do texto, como no Figma. Na largura de 796 a busca não espreme: o que não cabe ao lado dela desce para a linha de baixo.
  - **ImageCropModal**: tokens novos na coleção Overlays, `image-crop-modal/shade` (surface/scrim), `/selection` e `/handle` (text/on/cover) e `/stage/background` (surface/muted). O palco ganha fundo e passa a ter 320 de altura (com teto de 60vh em tela baixa); a sombra fora do recorte, a linha do recorte (sólida, sem as formigas da biblioteca) e as alças leem esses tokens. As proporções usam os ícones do [RDS] (square, rectangle-vertical, rectangle-horizontal, square-dashed). No estado pronto aparece a dica "Arraste as alças para ajustar o recorte." (no Livre, a dica das proporções).
  - **ChoiceCarousel**: a seta some de vez (não é renderizada) quando não há mais nada para aquele lado, em vez de ficar transparente.
  - **PageSkeleton** e **CardsSkeleton**: os Cards voltam a ter a sombra `elevation/raised`, como no Figma.
  - **SectionHeader**: `eyebrow` e `number` ficam deprecated (não existem no Figma). Ainda renderizam.

  **Breaking** (2.0):

  - **CurrencyInput**: sai a prop `size`, que já era ignorada.
  - **SelectableCard**: saem `as`, `href`, `indicator` e `ribbon`, que já eram ignoradas.
  - **ChoicePreviewCard**: saem `locked`, `badge` e `previewAspect`, que já eram ignoradas.
  - **ImageUpload**: saem `aspect`, `variant`, `previewClassName` e `previewWrapperClassName`, que já eram ignoradas, e com elas os tipos `ImageUploadAspect` e `ImageUploadVariant`.

  Codemod interno do repositório: `ToggleCardCompact` vira `<ToggleCard layout="compact">` (e `ToggleCardCompactProps` vira `ToggleCardProps`); remove `size` do CurrencyInput, `indicator` e `as="button"` do SelectableCard, `previewAspect` e `locked={false}` do ChoicePreviewCard, e `aspect`, `variant`, `previewClassName` e `previewWrapperClassName` do ImageUpload. Ficam para revisão manual, com a orientação no relatório, `as="a"`, `href` e `ribbon` do SelectableCard, `locked` e `badge` do ChoicePreviewCard e os tipos `ImageUploadAspect` e `ImageUploadVariant`.

- ceff9a1: Tema e CSS da 2.0:

  - **Rojão um para um com o Figma.** `styles/rds/theme.css` passa a sair da tabela da marca `rojao` exportada do [RDS] Base Tokens (`ds-core/figma/brands/rojao.rds.json`, via `rdsThemeFromTable`), não mais da regra derivada. Mudam, entre outros: tints azuis (`surface/tint/*`), capa azul (`surface/cover` blue/700), `colors/accent/mark` azul, `text/on/accent` e `text/on/tint` navy, o card do modo brand navy/800, a secundária do escuro em azul. Entram as variáveis da marca (`--rojao-primary`, `--rojao-accent`…).
  - **`base.css` não briga mais com `rds.css`.** Tudo do `base.css` (1.x, deprecated) vai para a camada `rds.legacy`, declarada antes de `rds.theme` nos dois arquivos: com os dois importados, vence o 2.0 nos 31 nomes em comum (`--surface-page`, `--text-muted`, `--border-default`, `--radius-card`, `--z-modal`, `--space-*`, `--toast-text`…) e a regra global `h1`–`h6` perde para o `Heading`. Os `@utility` e `@theme` do Tailwind seguem no topo; o anel de foco segue na camada `base` do Tailwind.
  - **Escopos genéricos.** Os tokens de componente passam a ser redeclarados também em `[data-rds-scope]`, `[data-rds-mode]` e `[data-rds-plate]`, e o tema publicado troca para escuro também em `[data-rds-mode="dark"]` e para a placa em `[data-rds-plate]`. Uma seção `<section data-rds-mode="dark">` numa página clara repinta os componentes dentro dela.

- 907c6f7: Renomes da 2.0, como no Figma [RDS]: **`FloatingStepper` → `Stepper`** e **`ImageCropModal` → `ImageCropDialog`**. As props não mudam.

  - `Stepper`, `StepperProps` e `StepperStep` vêm do barril e de `@rojaostudio/ds/components/stepper`. `ImageCropDialog` e `ImageCropDialogProps` vêm de `@rojaostudio/ds/components/image-crop-dialog` (fora do barril, como antes: dependem do peer opcional `react-image-crop`); `CropPreset` também.
  - Os nomes antigos continuam funcionando como alias `@deprecated`: `FloatingStepper` (barril e `.../components/floating-stepper`) e `ImageCropModal` (`.../components/image-crop-modal`). O codemod troca os imports, os componentes e os tipos.

  **Breaking (para quem estiliza por classe ou token):**

  - A classe `rds-floating-stepper` (e `rds-floating-stepper__divider`) virou `rds-stepper` (e `rds-stepper__divider`). O alias deprecated renderiza a classe nova.
  - Os tokens `--image-crop-modal-*` (coleção Overlays) viraram `--image-crop-dialog-*`: `shade`, `selection`, `handle` e `stage-background`. As classes do recorte (`rds-image-crop__*`) não mudam.

- d425be0: SavingBar na chapa da marca e com o botão de detalhes; Drawer com teto de 85% e rolagem por dentro, como no Figma [RDS] (03/10).

  - **Muda aparência.** A SavingBar agora é a chapa (`.ds-plate` no elemento da barra, em todas as marcas): `savingbar/background` passou a `surface/page` e `savingbar/text` a `text/body`, lidos no modo brand. Sobre página clara ou escura a barra sai igual. Os botões deixam o `tone="inverse"`: Salvar é `tone="action"` (fill) e Descartar `tone="neutral" variant="ghost"`, lidos na chapa. Numa marca clara (um ciano, por exemplo) o texto e os botões seguem o contraste da chapa, em vez do branco fixo do inverse.
  - **Novo:** `onDetails`, `detailsLabel` (padrão "Ver o que falta"), `detailsExpanded` e `detailsControls` (o `showDetails` do Figma). Com `onDetails` em `status="unsaved"`, no arranjo compacto (abaixo de 1024) a mensagem vira um botão com chevron para cima que abre o painel do que falta (um Drawer); o nome acessível é a mensagem seguida de `detailsLabel`, com `aria-expanded` e `aria-controls`. Hover sublinha, o foco desenha o anel `savingbar/focus/ring` (novo token, `focus/ring` na chapa), e a área de toque tem 44 de altura sem mudar o desenho. No expandido a mensagem continua texto.
  - **Drawer:** a altura vem do conteúdo até 85% da tela (`85dvh`, antes `100dvh - 48`); passou disso, só o conteúdo rola por dentro (`overscroll-behavior: contain`), e alça, título e rodapé ficam parados.
  - **Dialog, Sheet e Drawer controlados sem `trigger`:** ao fechar, o foco volta para o elemento que tinha o foco quando abriram (o botão de detalhes da SavingBar, por exemplo). Antes ia para o `body`.

- 02d6246: SidebarItem ganha `status` (`{ tone, label }`, tons do Status), o selo de estado à direita, exclusivo com o contador (#53): aberta, um Status `sm` com o rótulo; recolhida, o ponto de 8 no canto do ícone na cor do tom. O rótulo entra no nome acessível nas duas larguras ("Caixa, aberto"). Os tipos não deixam passar `status` junto de `count`. Tokens novos na coleção Navigation: `sidebar/dot/success`, `sidebar/dot/warning` e `sidebar/dot/info` (os pontos `neutral` e `danger` já existiam). Exporta o tipo `SidebarItemStatus`.
- 8c2b000: Sidebar `header="logo"`: o cabeçalho tem 64 (8 em cima e embaixo) e o `logo` mantém a proporção dele, até 48 de altura e nunca mais largo que o cabeçalho (`max-height: 48px; max-width: 100%`; a largura fica com o produto, ex. `<img width={100}>`); logo muito horizontal fica limitado pela largura e sai mais baixo. No Figma [RDS] de 07/10 o logo virou slot.
- cd4b06b: Stat ganha `inverse` e Delta ganha `tone="inverse"`, como no Figma [RDS] de 10/10.

  - **Stat** `<Stat framed inverse>` (só com `framed`, `tone="neutral"` e sem `muted`; fora disso é ignorado, com aviso no console): fundo `stat/inverse/background` (surface/inverse), valor em `stat/inverse/value` (text/on-inverse), rótulo e legenda em `stat/inverse/label` (text/on-inverse-subtle). O Delta dentro dele vira inverse sozinho, qualquer que seja o tom. Legível (≥ 4,5:1) no claro, no escuro e na impressão.
  - **Delta** `tone="inverse"`: seta e valor em `delta/inverse` (text/on-inverse), para um fundo escuro.
  - Tokens novos: `--stat-inverse-background`, `--stat-inverse-value`, `--stat-inverse-label` e `--delta-inverse`.

- 8c2b000: Switch: o rótulo passa de 16/24 regular para 14/20 medium, o mesmo do label do Input, para Switch e Input do mesmo formulário parecerem da mesma família (`--switch-text-size`/`--switch-text-line` agora apontam para `type/small`). A linha continua com 44 (sm 24): o respiro sai do trilho de 24, e a primeira linha do rótulo fica no meio dele. Figma [RDS] 07/10.
- ccacba9: `TableFooter`: a linha de totais no fim da Table (`tfoot`), item 1 da #42. Figma [RDS] 06/10: `.table/cell` `type=footer`.

  - 48 de altura, fundo de painel, texto mais forte que o corpo (600), uma linha em cima e nenhuma embaixo.
  - O rótulo vai num `TableHead scope="row"` ("Total"); as somas em `TableCell align="end"` (tabular).
  - Tokens novos `--table-footer-background` e `--table-footer-label`.

- ccacba9: `TabsTrigger` ganha `icon`: um ícone decorativo de 16 antes do rótulo, na cor do rótulo em cada estado, para abas que trocam de visão (#49). Figma [RDS] 06/10: `.tabs/tab` `showIcon` + `icon`.
- a7088d8: Papel novo `text/on/success-strong` (`--text-on-success-strong`): branco no claro e no print, preto no escuro e na chapa, o ícone sobre `colors/state/success-strong`. O par entra no relatório de contraste de não-texto (3:1). A tabela `rojao.rds.json` ganha o papel; uma tabela exportada antes dele continua carregando, com aviso. O tema passa a 111 papéis.

  Muda aparência: o Tile `tone="success" variant="fill"` passa a usar o fundo `colors/state/success-strong` (green/600 no claro, green/300 no escuro) e o ícone `text/on/success-strong`, com 3:1 ou mais em claro, escuro, chapa e print.

- 5b427f3: `Timeline`, `TimelineDay` e `TimelineItem`: o histórico de um registro, quem fez o quê e quando, agrupado por dia (item 3 da #42). Figma [RDS] 07/10: Content/Timeline.

  - Cada dia é uma `<ol>` nomeada pelo rótulo, que é um `<h3>` ("Hoje", "06/10") em peso de subtítulo, com 24 de respiro em cima; cada hora é um `<time dateTime>`.
  - O item: Avatar sm com anel e a linha até o próximo (some no último do dia), ator em medium e ação na mesma linha, a hora numa coluna de 48 à direita (caption) e a mudança opcional ("Aberto → Em produção").
  - Tokens novos `--timeline-line`, `--timeline-actor`, `--timeline-action`, `--timeline-meta`, `--timeline-day` e `--timeline-avatar-border`.

- 74bf719: PageHeader ganha `titleAddon`: um selo logo depois do título (e da ajuda), centrado na linha do título; no estreito quebra para baixo dele, 4 abaixo. Status ganha `dotColor`: com `tone="neutral"`, o ponto aceita cor própria para categoria ou etapa, com chapa e texto neutros. Figma [RDS] 06/10: `showTitleAddon` + slot `titleAddon` no PageHeader; descrição do Status com a exceção do ponto.

  No mesmo PageHeader: o título e o "?" andam juntos (no estreito quebra o texto do título e o "?" fica ao lado, nunca sozinho na linha de baixo), e a prop nova `compactTitle="inline" | "bar"` (#50): com `bar`, abaixo de 1024 o voltar, o título e o "?" saem (a barra do app passa a ser a dona deles; o `<h1>` continua para leitores de tela) e ficam o selo, a descrição, as abas e as ações. Padrão `inline`: nada muda para quem já usa.

- 907c6f7: Toast com ação não some mais sozinho (WCAG 2.2.1, Timing Adjustable). Antes ficava 6 s; agora, com `action` e sem `duration`, fica na tela até a pessoa usar a ação ou o ×. Sem ação, continua 5 s. Uma `duration` explícita ainda vale, também com ação; dê uma só quando a ação puder ser feita por outro caminho.

  O `Toaster` ganha `closeLabel`, o nome acessível (e o Tooltip) do × de todos os toasts. Padrão "Fechar", que antes era fixo.

  **Breaking:** quem contava com o toast de ação fechando sozinho em 6 s passa a ver o toast até fechá-lo; para o comportamento antigo, passe `duration: 6000`.

- ce1241b: Toggle e ToggleGroup ganham `size?: 'sm' | 'md'` (padrão `md`, o tamanho de hoje, 44 de altura).

  - `sm`: 32 de altura e ícone de 16; só com ícone vira um quadrado de 32.
  - No ponteiro grosso, uma camada invisível leva o alvo de toque a 44, como no Button sm: na vertical, e nos quatro lados quando é só ícone. O layout não se mexe.
  - `<ToggleGroup size>` repassa o tamanho aos itens. Num ToggleGroup `sm`, no ponteiro grosso, os itens ficam 12 de distância (eram 4), nas linhas e entre linhas, para que as camadas de toque de itens vizinhos se encontrem sem se sobrepor.
  - Exporta o tipo `ToggleSize`.

- b7c2da8: Vocabulário único de props, igual ao Figma [RDS] de 03/10/2026: `tone` neutral|action|accent|info|success|warning|danger|inverse (nunca `default`); `variant` só para ênfase (fill|soft|outline|ghost; no Card, surface|soft|outline); `size` sm|md|lg (+ xs/xl), com `md` como padrão (nunca `default`); seleção como booleano; tema não é prop. O JSDoc de cada prop cita o nome do Figma (`(Figma: \`variant\`)`no lugar do antigo`style`).

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

### Patch Changes

- 8c2b000: Avatar: as iniciais do fallback passam de `text/subtle` para `text/muted` (`--avatar-fallback-label`), para lerem sobre `surface/muted`. Figma [RDS] 07/10.
- 6e2a0b4: O pacote `ds` passa a trazer o `THIRD_PARTY_NOTICES.md`, com as licenças do Lucide e do Feather (ícones), o aviso da marca Pix e a lista das dependências e fontes de terceiros. No `ds-core`, o exemplo de variável de marca nos comentários e no script de exportação passa a ser genérico (`marca/ciano`).
- c9e1f4b: Badge neutral soft: a chapa passa a surface/muted-strong e se separa da página e do cartão em todas as marcas (antes sumia sobre surface/page). O texto não muda.
- 84bb36b: FormActions e SavingBar saem do caminho do teclado do celular, como o Figma [RDS] pede nas duas specs ("Com o teclado do celular aberto (foco num campo), o pé some; volta no blur"). A promessa já estava no JSDoc do FormActions, mas não havia implementação.
  - Novo hook interno `useOnScreenKeyboard` (`components/internal/`), sem dependência nova: só no compacto (`max-width: 1023px`), com um campo editável em foco (texto, textarea ou contenteditable; checkbox, rádio e afins não contam) e a área visível (`visualViewport`, corrigida pelo zoom) abaixo de 75% da `innerHeight`. Mede um quadro depois de `resize` do visualViewport, `focusin`/`focusout` e da troca de faixa da tela. No servidor e sem `visualViewport` a barra fica.
  - FormActions `bar` e `stacked` (o pé da tela) e a SavingBar ganham `rds-form-actions--keyboard` / `rds-savingbar--keyboard`: descem (`translateY(100%)`) e ficam `visibility: hidden` ao fim da descida, fora da ordem de Tab e da árvore de acessibilidade; voltam quando o teclado fecha ou no blur. O foco nunca é movido. `inline` não muda.
  - A transição (`motion/duration/base`, saída `motion/easing/exit`, volta `motion/easing/enter`) só existe com `prefers-reduced-motion: no-preference`; com `reduce` a barra some e volta sem animação.
  - FormActions passa a ser `'use client'` (usa o hook).
- eae08d7: O barril `@rojaostudio/ds/components` não puxa mais dependências opcionais. Por isso `PhoneInput`, `ImageCropModal` e `ImageUpload` saem dele e passam a vir de `@rojaostudio/ds/components/phone-input`, `.../image-crop-modal` e `.../image-upload`. Quem não usa esses componentes não precisa mais instalar `react-international-phone` nem `react-image-crop`. Basta trocar o caminho do import; nos repositórios do Rojão Studio, o codemod interno do repositório faz essa troca. Um teste novo impede que um componente do barril volte a importar uma dependência opcional.
- 6bc09ce: `Chart`: `hrefs` só são seguidos quando são `http(s):`, caminho relativo ou `#fragmento`. Outro esquema (`javascript:`, `data:`…) é ignorado, no link da barra, na tabela e no Enter da coluna, com aviso no console em desenvolvimento.
- b09adbf: Chart: a tabela alternativa (para leitor de tela) não estica mais a rolagem da página. Uma `<table>` ignora o recorte de 1px do `.rds-visually-hidden`; agora a tabela fica dentro de um wrapper oculto, e o gráfico é o ancestral posicionado.
- 79453b7: ChoiceList: o disco do Avatar segue a linha, em surface/muted-strong na linha normal e em surface/card na escolhida (tokens choice-list/item/avatar/background e /selected).
- 97e22b2: ChoiceList: a última linha não tem o fio embaixo (a borda do container fecha a lista); a altura da linha não muda.
- 6997f8b: DataTableHeader e SavingBar: o arranjo compacto volta a seguir a largura da tela (abaixo de 1024), como o modo viewport do Figma (`layout/compact`). Na next.18 ele seguia a largura da própria barra, e uma lista com Sidebar numa tela de 1280 caía no compacto no desktop.
- 03f8d9f: Dialog e AlertDialog param em `100dvh − 96px` (48 em cima, 48 embaixo; antes, 32 no total). No Dialog só o corpo rola; no AlertDialog o texto rola e os botões ficam à vista. (Figma [RDS] 09/10, pedido do [GRA]).
- bc090a1: Dialog: o JSDoc e o comentário do CSS diziam que o sheet do compacto vai até 85% da tela; o CSS usa a altura da tela menos 48 (`100dvh − 48`). O texto agora diz isso.
- 1b98652: DataTableHeader: os filtros rápidos abraçam os chips e a busca fica com a sobra (antes dividiam meio a meio e o último chip saía cortado). Quando não cabem ao lado da busca, descem para a própria linha e rolam.
- 8c2b000: DataTableHeader: os filtros rápidos ficam numa linha só e rolam de lado, em vez de quebrar. No celular a fileira descia cortada; agora ocupa a linha e rola (Figma [RDS] 09/10).
- 8a50913: DataTableHeader: a busca, os filtros rápidos, os filtros e a visão ficam num grupo `tools` (`.rds-data-table-header__tools`), que é quem quebra linha; a barra não quebra mais e a ação (`actions`) fica fora dele, sempre no fim da primeira linha, presa à direita, como no Figma [RDS]. A ação é um IconButton neutral outline com Tooltip (ex.: engrenagem "Organizar categorias"); criar não é ação da barra, criar é o FAB.
- d0cba81: Os campos (Input, PasswordInput e os que usam a mesma base) não mostram mais um retângulo azul ou amarelo no meio quando o navegador preenche sozinho (autofill). O fundo do autofill passa a ser coberto pela cor da caixa, e o texto mantém a cor do valor.
- 8c2b000: Campos: o hint e a mensagem de erro deixam de começar 4 px para dentro e alinham com o label e a borda do campo (Input, Select, Textarea, PasswordInput, NumberInput, ChipInput, ColorInput, FileInput, InputOTP, DatePicker). Figma [RDS] 07/10.
- e8ed903: FormActions ganha `showHelper`, como no Figma [RDS] (Histórico 03/10, "helper × detalhes"). Aditivo: o padrão é `true`, e quem não passa nada vê o mesmo de antes.

  - **Novo:** `showHelper?: boolean` (padrão `true`) controla só o texto estático da frase de apoio: no expandido aparece com `showHelper && helper`, no compacto com `showHelper && helper && !onDetails`. Sem `onDetails`, `showHelper={false}` tira a frase de vez, em qualquer layout.
  - **Muda:** no `layout="bar"` com `onDetails`, o compacto (abaixo de 1024) mostra sempre o botão de detalhes com o texto de `helper` e o chevron, mesmo com `showHelper={false}`. É o pé da criação: `<FormActions layout="bar" helper="Falta preço e prazo" showHelper={false} onDetails={…}>` fica só Cancelar + primário em 1280 (o checklist está na coluna da direita) e "Falta preço e prazo ˄" + primário em 390.
  - **Acessibilidade:** o `role="status"` continua anunciando as mudanças da frase também quando ela não está na tela: com `showHelper={false}` e `onDetails`, uma cópia visualmente oculta dentro do mesmo status responde no expandido, e no compacto quem responde é o botão. Só uma das formas fica na árvore de acessibilidade por vez, então a mudança é dita uma vez.

- 8c2b000: PixIcon vira ícone de linha, como o icon/finance/pix do Figma [RDS] Icons de 08/10: o contorno do símbolo em traço (1,5 a 24), em currentColor. Cheio, ele não pegava a cor onde os ícones de linha são recoloridos.
- 7193688: Print: o texto sobre um fundo que vira branco na impressão (`text/on/cover`, `text/on/tint`, `text/on/band-base`) passa a ser o `text/body` do claro, como no Figma [RDS]. Antes, uma capa de acento escuro levava texto branco sobre a capa branca (1:1). Os textos sobre preenchimento cheio (`on/primary`, `secondary`, `accent`, `success`, `warning`, `error`, `info`, `neutral`) não mudam. Novo exportado `RDS_PRINT_ON_WHITE`.
- f6efbd9: Sincronia com o Figma [RDS] de 04/10/2026: tokens e tabela da Rojão extraídos de novo.

  - **Muda aparência:** o hover do Button danger (`colors/state/error-strong`) no escuro e na chapa passa de red/400 (`#ff6c5c`) para red/700 (`#990001`) na tabela da Rojão (`figma/brands/rojao.rds.json`) e no `styles/rds/theme.css`. O claro continua red/800. O rótulo branco sobre o hover sobe de 2,78:1 para AA.
  - No Figma, esse papel aponta direto para o primitivo no escuro e na chapa (`@color:red/700` no `theme.txt`), não mais para um token do `base`. O `export-brand.js` e o extrator já lidavam com isso: a tabela reextraída bate byte a byte com o Figma.
  - `ROLES` ganha uma fonte nova, `"p"`: um primitivo fixo, o mesmo para toda marca. É o caso de `colors/state/error-strong` no escuro e na chapa. `generateRdsTheme` passa a usar red/700 direto (antes, andava na rampa até carregar o rótulo e chegava ao mesmo valor), e o gerador e a tabela da Rojão deixam de divergir nesse papel (snapshot atualizado).

- 75a0630: SavingBar volta para a cor primária da marca (sai da chapa), como no Figma [RDS] (03/10).

  - **Muda aparência.** A barra não leva mais `.ds-plate`: `savingbar/background` é `colors/primary/default` e `savingbar/text` é `text/on/primary` (texto, alerta de erro, chevron e loader), no tema claro e no escuro, em todas as marcas. O anel de foco `savingbar/focus/ring` passa a `text/on/primary`.
  - **Botões:** continuam o mesmo Button, Salvar `tone="action"` (fill) e Descartar `tone="neutral" variant="ghost"`, com as cores da barra pelos tokens novos `savingbar/button/fill/background` (`text/on/primary`), `savingbar/button/fill/label` (`colors/primary/default`) e `savingbar/button/ghost/label` (`text/on/primary`). Hover do Salvar: o fundo a 85% sobre a barra; hover do Descartar: a cor do rótulo a 15%; desabilitado (`status="saving"`): 40% sobre a barra. Numa marca de primário claro (um ciano, por exemplo) o `text/on/primary` escolhido por contraste vale para o texto e para o fundo do Salvar.

- 5524dc7: Dialog e AlertDialog no compacto (sheet): altura máxima 100dvh − 48 no topo (antes 85dvh). Cabeçalho e rodapé fixos; só o conteúdo rola, então o total do `footerStart` e a ação ficam sempre à vista.
- bb6a8db: Sidebar: o item do bloco account já é do produto, pelo `footer` (#53). A documentação do `footer` passa a dizer isso: SidebarItems com ícone, rótulo, `href` e `current` próprios ("Plano e consumo" em /billing, "Sair"), cujo `href` conta para o `currentPath` como o de qualquer item e que no trilho guardam o nome no Tooltip. Testes novos cobrem a rota marcando o item do rodapé como página atual, o `current` dele e o trilho.
- cad9444: Sidebar: o rótulo da seção (`SidebarSection`) passa a seguir o Figma (`.sidebar/section`): caixa alta e tracking de 6%, em 11/14 bold. A contagem continua em caixa normal.
- 84bb36b: Table: uma tabela larga dentro de um Card a 390 rola em vez de cortar. A causa estava na própria Table: a região de rolagem (`.rds-table`, `overflow-x: auto`) era um bloco comum e repassava o min-content da tabela aos ancestrais. Qualquer ancestral dimensionado pelo conteúdo (o main do app como item flex sem `min-width: 0`, item de grid em trilha auto, pilha alinhada ao início, inline-block) crescia até a largura da tabela, o Card passava da tela e era cortado. Agora `.rds-table` é uma grade de uma coluna `minmax(0, 1fr)`: sob min-content a trilha é 0 (não empurra ninguém), sob max-content é a largura da tabela (quem abraça o conteúdo continua abraçando a tabela inteira no desktop) e com largura definida ela preenche e a tabela rola por dentro. Card não mudou.
- 993c3a9: `--heading-accent` (o `tone="accent"` do Heading e o `Heading.Mark` de um Heading neutro) passa de `colors/accent/default` para o papel novo `text/accent`, que garante 3:1 sobre page e card em qualquer tema gerado.

  - **Tema padrão:** papel novo `--text-accent`. O destaque do Heading fica mais escuro no claro (#D95A00, era #FF6A00 a 2,9:1 sobre branco) e mais vivo no escuro (#FF6A00, era #FFB066); na chapa não muda.
  - O destaque como texto é só para título grande (24px ou mais, ou 18,66px ou mais em negrito). Todos os níveis do Heading cabem nessa regra.

- 208533f: Tile deixa de ser círculo no tema padrão e segue o raio dos controles da marca: o token novo `tile/radius` aponta para `radius/control` (8 no tema rojao; antes era `radius/full` fixo). O mesmo vale para a chapa de ícone do FileInput dropzone (o ícone de upload e o clipe do arquivo escolhido), com o token novo `file-input/area/icon-radius` → `radius/control`. Uma marca com outro `radius/control` muda os cantos dos dois. O Avatar de pessoa continua círculo.
- 3c3c88d: `toggle/label/pressed`, `toggle/border/pressed` e `pagination/item/label/current` passam a apontar para `text/selected`. No tema padrão nada muda de cor (vale `colors/primary/default`); num tema gerado com primária clara, o texto, o ícone e a borda do Toggle pressionado e o número da página atual descem para um degrau escuro da primária e passam 4,5:1 sobre o tint da seleção.
- Updated dependencies [6e2a0b4]
- Updated dependencies [a99fbf1]
- Updated dependencies [041a28e]
- Updated dependencies [68b5965]
- Updated dependencies [7b7510c]
- Updated dependencies [eae08d7]
- Updated dependencies [6bc09ce]
- Updated dependencies [c337b76]
- Updated dependencies [67fe858]
- Updated dependencies [e7f2453]
- Updated dependencies [7193688]
- Updated dependencies [f6efbd9]
- Updated dependencies [f6efbd9]
- Updated dependencies [f6efbd9]
- Updated dependencies [0aa4bac]
- Updated dependencies [3401f79]
- Updated dependencies [ceff9a1]
- Updated dependencies [578bd89]
- Updated dependencies [057850b]
- Updated dependencies [71fd5b3]
- Updated dependencies [4a98e4b]
- Updated dependencies [dba8f1b]
- Updated dependencies [a7088d8]
  - @rojaostudio/ds-core@1.1.0

## 2.0.0-next.44

### Patch Changes

- 1b98652: DataTableHeader: os filtros rápidos abraçam os chips e a busca fica com a sobra (antes dividiam meio a meio e o último chip saía cortado). Quando não cabem ao lado da busca, descem para a própria linha e rolam.

## 2.0.0-next.43

### Patch Changes

- Updated dependencies [7b7510c]
  - @rojaostudio/ds-core@1.1.0-next.16

## 2.0.0-next.42

### Patch Changes

- c9e1f4b: Badge neutral soft: a chapa passa a surface/muted-strong e se separa da página e do cartão em todas as marcas (antes sumia sobre surface/page). O texto não muda.
- 79453b7: ChoiceList: o disco do Avatar segue a linha, em surface/muted-strong na linha normal e em surface/card na escolhida (tokens choice-list/item/avatar/background e /selected).

## 2.0.0-next.41

### Patch Changes

- 97e22b2: ChoiceList: a última linha não tem o fio embaixo (a borda do container fecha a lista); a altura da linha não muda.
- 3c3c88d: `toggle/label/pressed`, `toggle/border/pressed` e `pagination/item/label/current` passam a apontar para `text/selected`. No tema padrão nada muda de cor (vale `colors/primary/default`); num tema gerado com primária clara, o texto, o ícone e a borda do Toggle pressionado e o número da página atual descem para um degrau escuro da primária e passam 4,5:1 sobre o tint da seleção.
- Updated dependencies [67fe858]
  - @rojaostudio/ds-core@1.1.0-next.15

## 2.0.0-next.40

### Minor Changes

- 4826129: FAB: `count` e `countLabel`. Uma pílula depois do rótulo mostra o número em bold `tabular-nums` ("99+" acima de 99) e some com 0 ou undefined. O nome acessível inclui o número real: "Carrinho, 12 itens" (sem `countLabel`, "Carrinho, 12"). O `FABConfig` do `usePageFAB` aceita os dois e repassa. Tokens novos `fab/count/background` (o fundo da pílula, a 20%) e `fab/count/text`, ambos em `text/on/primary`.

  O hover do FAB deixa de escurecer o fundo: `fab/cta/background/hover` passa a `colors/primary/default` e a sombra sobe de `elevation/raised` (repouso) para `elevation/overlay`, o que mantém o número da pílula acima de 4,5:1 no hover. A pílula tem 20 de altura e o número em `type/small` (14/20).

## 2.0.0-next.39

### Minor Changes

- 40ac985: ChoiceCard `layout="preview"` passa a desenhar a imagem com o `Media` (16:9, decorativo), com a mesma borda de 1px, o raio radius/container, o check no canto e o ícone de imagem vazia quando não há `preview`. As medidas não mudam. A classe interna do ícone vazio passa a ser `.rds-media__fallback` (era `.rds-choice-card__placeholder`).
- 6e9c1b0: MediaTile pega a largura do pai: o tile ocupa 100% do container e a mídia mantém a proporção por aspect-ratio, sem largura fixa e sem mínimo ou máximo. `size="sm" | "md"` passa a mudar só o rótulo (sm numa linha com reticências, md em duas); o sm deixa de ter 96 de largura.

  **Breaking:** sai `fluid` (e a faixa de 72 a 100). Sem `fluid`; envolva o tile num wrapper com a largura que quiser (ex.: flex 1 1 72px; max-width 100px).

- 01bd5bd: MediaTile passa a usar o `Media` por dentro e ganha `ratio` com as cinco proporções (`1:1`, `4:3`, `3:4`, `16:9`, `9:16`). Dentro do tile a mídia fica sem raio e mantém as cores `media-tile/*`, então o visual não muda.

  - `aspect` e o tipo `MediaTileAspect` ficam deprecated: `square` vira `1:1` e `video` vira `16:9`. Se vierem os dois, `ratio` vence.
  - No fallback com `alt`, a mídia vira role="img" com esse nome; sem `alt`, a mídia é decorativa (o rótulo já diz o que é).
  - A classe interna do fallback passa a ser `.rds-media__fallback` (era `.rds-media-tile__fallback`).

- 05a172f: Componente novo `Media`: uma caixa de imagem ou vídeo numa proporção fixa, `<Media ratio="1:1" | "4:3" | "3:4" | "16:9" | "9:16" src alt fit="cover" | "contain" />`.

  - Ocupa 100% do pai e a altura vem do aspect-ratio, então a imagem nunca distorce. Raio em `media/radius` (radius/card) e overflow hidden.
  - O tipo exige `alt` ou `decorative`. Com `decorative`, a imagem leva alt="" e a caixa aria-hidden.
  - Sem `src`, ou quando a imagem falha, mostra o fallback: fundo `media/background` (surface/muted) e o ícone de imagem quebrada centrado em `media/fallback` (text/subtle). No fallback com `alt`, a caixa vira role="img" com esse nome.
  - Aceita `children` no lugar de `src` (next/image, picture, video) e uma prop `fallback` para trocar o ícone.
  - Exporta `Media`, `MediaProps`, `MediaRatio` e `MediaFit`. Tokens novos na coleção Content: `media/background`, `media/fallback`, `media/radius`.

- dbb1ee4: NumberInput ganha `size?: 'sm' | 'md'` e `onRemove`.

  - `sm`: moldura de 32 de altura que abraça o conteúdo; − e + com 32 de largura e o número com no mínimo 32, crescendo com os dígitos. O rótulo fica visualmente oculto e continua dando nome ao campo. No ponteiro grosso, − e + chegam a 44 × 44 crescendo para fora (o − para a esquerda, o + para a direita, e os dois para cima e para baixo), sem cobrir o número. `md` (padrão) continua como era.
  - `onRemove?: () => void` e `removeLabel` (padrão "Remover item"): no mínimo, o − vira uma lixeira, fica ativo, entra no Tab e chama `onRemove`. Sem `onRemove` nada muda: o − desliga no mínimo.
  - Exporta o tipo `NumberInputSize`.

- ce1241b: Toggle e ToggleGroup ganham `size?: 'sm' | 'md'` (padrão `md`, o tamanho de hoje, 44 de altura).

  - `sm`: 32 de altura e ícone de 16; só com ícone vira um quadrado de 32.
  - No ponteiro grosso, uma camada invisível leva o alvo de toque a 44, como no Button sm: na vertical, e nos quatro lados quando é só ícone. O layout não se mexe.
  - `<ToggleGroup size>` repassa o tamanho aos itens. Num ToggleGroup `sm`, no ponteiro grosso, os itens ficam 12 de distância (eram 4), nas linhas e entre linhas, para que as camadas de toque de itens vizinhos se encontrem sem se sobrepor.
  - Exporta o tipo `ToggleSize`.

## 2.0.0-next.38

### Minor Changes

- 757e6e8: Card `variant="inverse"`: o fundo escuro da marca (`surface/inverse`; branco no escuro e na chapa), sem borda e sem sombra. Título, conteúdo, nota do rodapé e ícones em `currentColor` usam `text/on-inverse`; a descrição, `text/on-inverse-subtle`. No print o fundo se mantém (é preenchimento cheio). Tokens novos na coleção Content: `--card-inverse-background`, `--card-inverse-title` e `--card-inverse-description`.
- 9164583: DateRangePicker e Calendar em intervalo, como no Figma [RDS] de 10/10 (#42, item 4).

  - **Calendar** ganha `mode="single" | "range"` (single é o padrão; tipos `CalendarSingleProps`, `CalendarRangeProps` e `DateRange`). No range, a primeira escolha é o início e a segunda o fim (um dia anterior troca os dois; a terceira recomeça), e `onValueChange` recebe `{ from, to }`. O dia em range é start, middle ou end: start e end são a chapa de selecionado, middle é só a faixa contínua, sem cantos. Todos os dias do intervalo ficam `aria-selected` e as pontas dizem isso no nome ("1 de outubro de 2026, início do período").
  - **DateRangePicker** novo: `value={{ from, to }}`, `onValueChange` (só com o intervalo inteiro) e `presets` (padrão Hoje, Últimos 7 dias, Este mês e Mês passado, de `dateRangePresets(today)`; aceita presets próprios `{ label, range }`). O campo mostra o intervalo; o painel abre com os presets à esquerda (escolha única, com o check, como o DropdownMenuRadioItem) e o Calendar em range. No compacto (abaixo de 1024) o painel vira o sheet do Dialog, com os presets como FilterChips no topo e o Calendar embaixo.
  - Teclado: os presets são um listbox (setas movem, Enter ou Espaço escolhem), Tab leva ao calendário, Escape fecha sem mudar. O intervalo escolhido é anunciado ("Período escolhido: de … a …") e fica na descrição do campo; o início escolhido no calendário é anunciado dentro do painel.
  - Token novo: `--calendar-day-background-range` (surface/tint/default).

- 95191b8: Item ganha a lista densa e a seleção, como no Figma [RDS] de 10/10 (#4).

  - `variant="row"`: sem cantos, só o separador embaixo (`item/border`), recuo 12 × 16 no md e 8 × 16 no sm, mídia numa caixa de 48 ou 32, título e descrição numa linha cada com reticências; o valor vai no `trailing`. Para dezenas de linhas num painel lateral ou numa busca de cliente.
  - `selected?: boolean`, em qualquer variante: fundo `item/selected/background` (surface/tint/subtle) e faixa de 3px no começo da linha em `item/selected/indicator` (text/action).
  - `onSelect?: () => void`: a linha vira pressionável. O título é um `<button>` com a área de clique esticada sobre a linha toda, descrito pela descrição, com `aria-pressed` quando há `selected`; o anel de foco é desenhado na linha e o `action` continua um controle à parte. `aria-pressed` e não `listbox`/`option` porque cada linha segue um botão comum numa lista comum (a lista e o tamanho dela continuam anunciados), pode manter o próprio `action` e dispensa foco itinerante.
  - Tokens novos: `--item-selected-background` e `--item-selected-indicator`.

- c337b76: Papéis novos no tema, para o Card inverso: `surface/inverse`, `text/on-inverse` e `text/on-inverse-subtle` (`--surface-inverse`, `--text-on-inverse`, `--text-on-inverse-subtle`).

  - **Claro e print:** o fundo é a primária da marca quando o branco passa 4,5:1 sobre ela; senão (uma marca clara, como um ciano), coal/900. Texto branco; subtítulo branco a 70%, mais opaco de 5 em 5% quando 70% não passa 4,5:1 sobre o fundo (um violeta, um verde médio).
  - **Escuro e chapa:** fundo branco, texto coal/900, subtítulo coal/600.
  - Na Rojão: navy/900 no claro. A tabela `rojao.rds.json` ganha os três papéis; uma tabela exportada antes deles continua carregando, com os papéis tirados da mesma regra e um aviso pedindo a reexportação.
  - O par `text/on-inverse` sobre `surface/inverse` entra no relatório de contraste. O tema passa de 107 para 110 papéis.

- 07963a7: Modo print no tema publicado (issue #42, item 5). `styles/rds/theme.css` ganha o bloco `@media print` do `ds-core`: na impressão, fundos brancos, sem sombra, bordas e textos do claro, inclusive em `.dark` e `.ds-plate`. Entram as variáveis `--media-type-<papel>-size|line` (`caption`, `small`, `body`, `label`, `title`), a tipografia de tela na tela e 8/10, 9/12, 10/14, 12/16 e 18/24 pt no papel, para a folha impressa do consumidor. Os componentes mantêm a própria tipografia.
- cd4b06b: Stat ganha `inverse` e Delta ganha `tone="inverse"`, como no Figma [RDS] de 10/10.

  - **Stat** `<Stat framed inverse>` (só com `framed`, `tone="neutral"` e sem `muted`; fora disso é ignorado, com aviso no console): fundo `stat/inverse/background` (surface/inverse), valor em `stat/inverse/value` (text/on-inverse), rótulo e legenda em `stat/inverse/label` (text/on-inverse-subtle). O Delta dentro dele vira inverse sozinho, qualquer que seja o tom. Legível (≥ 4,5:1) no claro, no escuro e na impressão.
  - **Delta** `tone="inverse"`: seta e valor em `delta/inverse` (text/on-inverse), para um fundo escuro.
  - Tokens novos: `--stat-inverse-background`, `--stat-inverse-value`, `--stat-inverse-label` e `--delta-inverse`.

- a7088d8: Papel novo `text/on/success-strong` (`--text-on-success-strong`): branco no claro e no print, preto no escuro e na chapa, o ícone sobre `colors/state/success-strong`. O par entra no relatório de contraste de não-texto (3:1). A tabela `rojao.rds.json` ganha o papel; uma tabela exportada antes dele continua carregando, com aviso. O tema passa a 111 papéis.

  Muda aparência: o Tile `tone="success" variant="fill"` passa a usar o fundo `colors/state/success-strong` (green/600 no claro, green/300 no escuro) e o ícone `text/on/success-strong`, com 3:1 ou mais em claro, escuro, chapa e print.

### Patch Changes

- bc090a1: Dialog: o JSDoc e o comentário do CSS diziam que o sheet do compacto vai até 85% da tela; o CSS usa a altura da tela menos 48 (`100dvh − 48`). O texto agora diz isso.
- 7193688: Print: o texto sobre um fundo que vira branco na impressão (`text/on/cover`, `text/on/tint`, `text/on/band-base`) passa a ser o `text/body` do claro, como no Figma [RDS]. Antes, uma capa de acento escuro levava texto branco sobre a capa branca (1:1). Os textos sobre preenchimento cheio (`on/primary`, `secondary`, `accent`, `success`, `warning`, `error`, `info`, `neutral`) não mudam. Novo exportado `RDS_PRINT_ON_WHITE`.
- Updated dependencies [c337b76]
- Updated dependencies [e7f2453]
- Updated dependencies [7193688]
- Updated dependencies [a7088d8]
  - @rojaostudio/ds-core@1.1.0-next.14

## 2.0.0-next.37

### Patch Changes

- 208533f: Tile deixa de ser círculo no tema padrão e segue o raio dos controles da marca: o token novo `tile/radius` aponta para `radius/control` (8 no tema rojao; antes era `radius/full` fixo). O mesmo vale para a chapa de ícone do FileInput dropzone (o ícone de upload e o clipe do arquivo escolhido), com o token novo `file-input/area/icon-radius` → `radius/control`. Uma marca com outro `radius/control` muda os cantos dos dois. O Avatar de pessoa continua círculo.

## 2.0.0-next.36

### Minor Changes

- dde39b7: Alert neutral segue o Figma [RDS]: a faixa vira um card, com `alert/neutral/background` em `surface/card` (era `surface/neutral`) e a borda nova `alert/neutral/border` em `border/default` (era transparente). Os tons info, success, warning e danger continuam com o próprio fundo e sem linha. Token novo na coleção Feedback: `alert/neutral/border`.
- a99fbf1: Banner attention segue o Figma [RDS]: os fundos vêm de três papéis novos do tema, `surface/attention/low` (amber/100, #fff2d6), `surface/attention/medium` (amber/200, #ffe3ab) e `surface/attention/high` (amber/400, #ffc107), com o mesmo valor no claro, no escuro e na chapa, para toda marca. O texto dos três níveis é `banner/attention/text` (text/on/warning, preto). O `color-mix` do medium sai. O CTA continua outline em low e medium e fill em high. No ds-core, o gerador e a tabela da marca rojao ganham os três papéis, e uma tabela exportada antes deles carrega o âmbar fixo com um aviso para exportar de novo. Tokens do componente: `banner/attention/{low,medium,high}/background` passam a apontar para `surface/attention/*`, `banner/attention/medium/background` e `banner/attention/text` são novos, e saem `banner/attention/low/text`, `banner/attention/medium/text` e `banner/attention/high/text`.
- 88377ee: Os tokens do contador do IconButton passam a ter o nome do Figma [RDS]: `button/count/background` vira `icon-button/count/background` e `button/count/label` vira `icon-button/count/label`, com os mesmos valores (colors/state/error e text/on/error). Quem lia `--button-count-background` ou `--button-count-label` passa a ler `--icon-button-count-background` e `--icon-button-count-label`.

### Patch Changes

- Updated dependencies [a99fbf1]
  - @rojaostudio/ds-core@1.1.0-next.13

## 2.0.0-next.35

### Minor Changes

- 89d46dc: Alert ganha `icon`, `iconTone` e `layout`. `icon` troca o ícone do tom por um próprio, como um check. `iconTone` (`info` | `success` | `warning` | `danger`), só no tom `neutral`, pinta apenas o ícone com o `alert/<tom>/foreground` do estado, com 3:1 ou mais sobre a faixa neutra nos dois modos; a faixa, o título e o texto continuam neutros. Num Alert com outro tom o `iconTone` não faz nada. `layout="inline"` põe título e descrição na mesma linha como uma frase só, que quebra junto com as palavras quando não cabe; `stacked` continua o padrão. Uso: `icon={<CheckIcon />} iconTone="success" layout="inline" title="Você já pode vender:" description="PDV, Pix e pedidos no WhatsApp."`. Sem tokens novos. Exporta os tipos `AlertIconTone` e `AlertLayout`.
- c869882: Banner ganha `tone="attention"` com `level` (`low` | `medium` | `high`; padrão `low`), para o que pede ação em breve, como o fim de um teste grátis. O fundo vai do âmbar suave (`surface/warning`) ao âmbar cheio (`colors/state/warning`), nunca vermelho, e o `medium` fica no meio dos dois por `color-mix` (não existe papel de tema entre eles). Texto, destaque, ícone e × tomam a cor de texto do nível, com 4,5:1 ou mais em cada degrau, no claro e no escuro. O CTA (um Button em `action`) vira `outline` em low e medium e `fill` em high, desenhado nas cores da faixa; outra ação que não seja Button fica como veio. O layout continua trocando pela largura do contêiner, sem prop de tela. Tokens novos na coleção Blocks: `banner/attention/low/background`, `banner/attention/low/text`, `banner/attention/medium/text`, `banner/attention/high/background` e `banner/attention/high/text`. Exporta os tipos `BannerTone` e `BannerLevel`.
- 40d360e: DropdownMenuRadioItem segue o `.menu/radio-item` do Figma (#53): o check vai para uma coluna de 20 antes do rótulo, reservada em todas as opções, e os rótulos ficam alinhados com e sem o check (os idiomas de um UserMenu, um filtro). Antes o check vinha à direita e só existia na opção marcada. `DropdownMenuRadioGroup` e `DropdownMenuRadioItem` continuam públicos, com `role="menuitemradio"` e `aria-checked` pelo primitivo do Radix.
- a1ac2f3: IconButton ganha `count` e `countLabel` (#53): uma pílula danger no canto superior direito, 4 além da borda, com "99+" acima de 99, que some com 0 ou `undefined`. O número real entra no nome acessível depois do `label`, e o `countLabel` diz o que ele conta: `label="Notificações" count={3} countLabel="não lidas"` vira "Notificações, 3 não lidas" (sem `countLabel`, "Notificações, 3"). Funciona também com `asChild`. Tokens novos na coleção Actions: `button/count/background` (colors/state/error) e `button/count/label` (text/on/error).
- 862da32: MediaTile ganha `size` e `fluid`. `size="sm"` tem 96 de largura e a legenda em caption 12/16 numa linha só, com reticências; `md` (padrão) continua como era, ocupando a coluna (160 no Figma) com a legenda em duas linhas. `fluid` deixa o tile crescer e encolher entre 72 e 100 numa linha flex (`flex: 1 1 72px`, `max-width: 100px`), com a mídia sempre quadrada, mesmo com `aspect="video"`: quatro miniaturas por linha num card de 480. Exporta o tipo `MediaTileSize`.
- e19fa90: Progress ganha `tone` (`neutral` | `success` | `warning` | `danger`; padrão `neutral`, o preenchimento de antes). Só o preenchimento muda, o trilho fica igual. Tokens novos na coleção Indicators, escolhidos para dar contraste não-texto de 3:1 ou mais contra o trilho (`surface/tint/strong`) no claro e no escuro: `progress/fill/success` (colors/state/success-strong), `progress/fill/warning` (text/warning) e `progress/fill/danger` (text/error). Exporta o tipo `ProgressTone`.
- 02d6246: SidebarItem ganha `status` (`{ tone, label }`, tons do Status), o selo de estado à direita, exclusivo com o contador (#53): aberta, um Status `sm` com o rótulo; recolhida, o ponto de 8 no canto do ícone na cor do tom. O rótulo entra no nome acessível nas duas larguras ("Caixa, aberto"). Os tipos não deixam passar `status` junto de `count`. Tokens novos na coleção Navigation: `sidebar/dot/success`, `sidebar/dot/warning` e `sidebar/dot/info` (os pontos `neutral` e `danger` já existiam). Exporta o tipo `SidebarItemStatus`.

### Patch Changes

- bb6a8db: Sidebar: o item do bloco account já é do produto, pelo `footer` (#53). A documentação do `footer` passa a dizer isso: SidebarItems com ícone, rótulo, `href` e `current` próprios ("Plano e consumo" em /billing, "Sair"), cujo `href` conta para o `currentPath` como o de qualquer item e que no trilho guardam o nome no Tooltip. Testes novos cobrem a rota marcando o item do rodapé como página atual, o `current` dele e o trilho.

## 2.0.0-next.34

### Minor Changes

- 8c2b000: Alert: a ação vai para a direita do texto na tela larga, como no Figma [RDS] de 07/10.

  - Abaixo de lg 1024 continua embaixo da descrição; de 1024 em diante fica à direita da coluna de texto, centralizada na vertical, antes do ×.
  - O texto (título + descrição) ganha o invólucro `.rds-alert__text`, que leva o respiro do título: um Alert só com título fica na linha do ícone mesmo ao lado de uma ação de 36.
  - A ação recomendada passa a ser Button `tone="neutral" variant="outline" size="sm"` (era ghost): embaixo, o contorno alinha com o texto; à direita, não some na chapa.

- 03f8d9f: AlertDialog não fecha mais no Esc: a decisão é obrigatória, só Cancelar ou a ação fecham (regra da casa, como no Figma [RDS]). Antes o Esc cancelava.
- 5524dc7: Button e IconButton `size="sm"` passam de 36 para 32 (padding vertical 6). A barra do DataTableHeader fica toda em 32, junto com o Input sm e o FilterChip. O alvo de toque segue 44 no ponteiro grosso (camada invisível de 6 px).
- 8c2b000: Card: o conteúdo empilha os blocos com o mesmo espaço do padding (24 no md, 16 no sm), como o gap do slot `cardContent` no Figma [RDS] de 07/10. Alert + lista dentro do Card não precisam mais de espaçador.
- 8c2b000: Chart `type="bar"` pinta todas as barras com a primeira cor de série: é um ranking, a cor categórica por linha não dizia nada (Figma [RDS] 09/10, pedido do [GRA]).
- 8c2b000: ChoiceCard: o selecionado fica leve, como no Figma [RDS] de 07/10. Antes era uma chapa cheia na cor da marca, que brigava com o botão primário do diálogo.

  - Selecionado = borda de 2 px na marca + fundo `surface/tint/subtle`, título e descrição nos tons normais, ícone na marca sobre `surface/card`, radio (anel e ponto) na marca.
  - Vale para os três layouts; o check do tile passa a ser cheio na marca com o glifo em `text/on/primary`.
  - Tokens `choice-card/*/selected`, `choice-card/radio/dot` e `choice-card/check/*/tile` mudam de alvo; a chapa cheia fica só para o ToggleGroup.

- ccacba9: `DescriptionList` + `DescriptionItem`: pares rótulo → valor (`<dl>`, cada par num `<div>` com `<dt>` e `<dd>`), item 2 da #42. Figma [RDS] 07/10: Content/DescriptionList.

  - `layout`: `stacked` (rótulo em cima, o padrão) ou `inline` (rótulo numa coluna de 160, ou 104 no `sm`; no compacto, abaixo de 1024, vira empilhado).
  - `density`: `md` (tela) ou `sm` (folha impressa, 12/16).
  - `columns`: `1` (um par por linha) ou `'auto'` (colunas de no mínimo 300 que quebram: 1 no celular, 2 num card).
  - O valor aceita texto ou componente (Status, Badge, link).
  - Tokens novos `--description-list-label`, `--description-list-value`, `--description-list-label-width-md` e `--description-list-label-width-sm`.

- 03f8d9f: Dialog ganha `footerStart`: conteúdo fixo no começo do rodapé, antes dos botões (um total ao vivo), que não rola com o conteúdo. Quando os botões não cabem ao lado (sm, e sempre no sheet do compacto) ele sobe para cima deles. Só no Dialog (Figma [RDS] 09/10, pedido do [GRA]).
- 6e6f8ca: Dialog e AlertDialog viram sheet ancorado embaixo no compacto (abaixo de 1024), com a mesma API (#45). Figma [RDS] 06/10: pelo modo viewport, sem variante.

  - **Dialog**: encosta embaixo, com a largura da tela até 560 em qualquer `size`; ganha a alça (arrastar para baixo fecha), sobe acima do teclado da tela e respeita a área segura. O Cancelar padrão sai (fecham a alça, o véu, o Escape e o ×) e a ação ocupa a largura. Um `footer` próprio empilha em largura cheia, o último (a ação principal) em cima.
  - **AlertDialog**: também vira sheet, sem alça e sem fechar no véu; as duas ações ficam, em largura cheia, a de confirmar em cima. O foco continua abrindo no Cancelar.
  - **Drawer**: o rodapé passa a respeitar a área segura (`env(safe-area-inset-bottom)`).
  - Token novo `--dialog-handle`.

- cccda9a: `FilterChipMenu`: filtro em pílula com menu de múltipla escolha, para uma categoria com muitas opções numa barra de lista (#47). Figma [RDS] 06/10: Forms/FilterChipMenu.

  - A pílula é o FilterChip (32 de altura, 44 de toque, os mesmos tokens e o estado ligado) com um chevron; fechada mostra o valor: "Processo: Todos", "Processo: Laser", "Processo · 2". Liga enquanto há algo marcado.
  - O menu (DropdownMenu) traz uma opção marcável por item, com a contagem à direita, e "Limpar" no fim. Marcar não fecha; Limpar desmarca tudo, fecha e devolve o foco à pílula.
  - Acessível: `aria-haspopup="menu"` e `aria-expanded` na pílula, o valor no nome; itens `menuitemcheckbox`.
  - `DropdownMenuCheckboxItem` novo (`checked`, `onCheckedChange`, `count`, `closeOnSelect`), e `count` também no `DropdownMenuItem` e no `DropdownMenuRadioItem`.
  - Nenhum token novo.

- 8c2b000: Input ganha `size` (`md` 44, padrão; `sm` 32) para barras densas, como a busca ao lado dos FilterChips. No `sm` o texto continua 16/24 (o iOS não dá zoom), os ícones vão a 16 e o limpar a 24; não tem label flutuante. Figma [RDS] 07/10.
- 8c2b000: Item ganha `trailing`: a meta da linha entre o texto e a ação (Status ou Badge sm, ou um valor), como o slot `trailing` do Figma [RDS] de 07/10. Estado vai aí, não no fim da descrição.
- 8c2b000: Sidebar `header="logo"`: o cabeçalho tem 64 (8 em cima e embaixo) e o `logo` mantém a proporção dele, até 48 de altura e nunca mais largo que o cabeçalho (`max-height: 48px; max-width: 100%`; a largura fica com o produto, ex. `<img width={100}>`); logo muito horizontal fica limitado pela largura e sai mais baixo. No Figma [RDS] de 07/10 o logo virou slot.
- 8c2b000: Switch: o rótulo passa de 16/24 regular para 14/20 medium, o mesmo do label do Input, para Switch e Input do mesmo formulário parecerem da mesma família (`--switch-text-size`/`--switch-text-line` agora apontam para `type/small`). A linha continua com 44 (sm 24): o respiro sai do trilho de 24, e a primeira linha do rótulo fica no meio dele. Figma [RDS] 07/10.
- ccacba9: `TableFooter`: a linha de totais no fim da Table (`tfoot`), item 1 da #42. Figma [RDS] 06/10: `.table/cell` `type=footer`.

  - 48 de altura, fundo de painel, texto mais forte que o corpo (600), uma linha em cima e nenhuma embaixo.
  - O rótulo vai num `TableHead scope="row"` ("Total"); as somas em `TableCell align="end"` (tabular).
  - Tokens novos `--table-footer-background` e `--table-footer-label`.

- ccacba9: `TabsTrigger` ganha `icon`: um ícone decorativo de 16 antes do rótulo, na cor do rótulo em cada estado, para abas que trocam de visão (#49). Figma [RDS] 06/10: `.tabs/tab` `showIcon` + `icon`.
- 5b427f3: `Timeline`, `TimelineDay` e `TimelineItem`: o histórico de um registro, quem fez o quê e quando, agrupado por dia (item 3 da #42). Figma [RDS] 07/10: Content/Timeline.

  - Cada dia é uma `<ol>` nomeada pelo rótulo, que é um `<h3>` ("Hoje", "06/10") em peso de subtítulo, com 24 de respiro em cima; cada hora é um `<time dateTime>`.
  - O item: Avatar sm com anel e a linha até o próximo (some no último do dia), ator em medium e ação na mesma linha, a hora numa coluna de 48 à direita (caption) e a mudança opcional ("Aberto → Em produção").
  - Tokens novos `--timeline-line`, `--timeline-actor`, `--timeline-action`, `--timeline-meta`, `--timeline-day` e `--timeline-avatar-border`.

- 74bf719: PageHeader ganha `titleAddon`: um selo logo depois do título (e da ajuda), centrado na linha do título; no estreito quebra para baixo dele, 4 abaixo. Status ganha `dotColor`: com `tone="neutral"`, o ponto aceita cor própria para categoria ou etapa, com chapa e texto neutros. Figma [RDS] 06/10: `showTitleAddon` + slot `titleAddon` no PageHeader; descrição do Status com a exceção do ponto.

  No mesmo PageHeader: o título e o "?" andam juntos (no estreito quebra o texto do título e o "?" fica ao lado, nunca sozinho na linha de baixo), e a prop nova `compactTitle="inline" | "bar"` (#50): com `bar`, abaixo de 1024 o voltar, o título e o "?" saem (a barra do app passa a ser a dona deles; o `<h1>` continua para leitores de tela) e ficam o selo, a descrição, as abas e as ações. Padrão `inline`: nada muda para quem já usa.

### Patch Changes

- 8c2b000: Avatar: as iniciais do fallback passam de `text/subtle` para `text/muted` (`--avatar-fallback-label`), para lerem sobre `surface/muted`. Figma [RDS] 07/10.
- 03f8d9f: Dialog e AlertDialog param em `100dvh − 96px` (48 em cima, 48 embaixo; antes, 32 no total). No Dialog só o corpo rola; no AlertDialog o texto rola e os botões ficam à vista. (Figma [RDS] 09/10, pedido do [GRA]).
- 8c2b000: DataTableHeader: os filtros rápidos ficam numa linha só e rolam de lado, em vez de quebrar. No celular a fileira descia cortada; agora ocupa a linha e rola (Figma [RDS] 09/10).
- 8c2b000: Campos: o hint e a mensagem de erro deixam de começar 4 px para dentro e alinham com o label e a borda do campo (Input, Select, Textarea, PasswordInput, NumberInput, ChipInput, ColorInput, FileInput, InputOTP, DatePicker). Figma [RDS] 07/10.
- 8c2b000: PixIcon vira ícone de linha, como o icon/finance/pix do Figma [RDS] Icons de 08/10: o contorno do símbolo em traço (1,5 a 24), em currentColor. Cheio, ele não pegava a cor onde os ícones de linha são recoloridos.
- 5524dc7: Dialog e AlertDialog no compacto (sheet): altura máxima 100dvh − 48 no topo (antes 85dvh). Cabeçalho e rodapé fixos; só o conteúdo rola, então o total do `footerStart` e a ação ficam sempre à vista.

## 2.0.0-next.33

### Minor Changes

- f6efbd9: **Card:** a ação do cabeçalho segue o `.card/header` do Figma de 04/10/2026.

  - **Muda aparência:** com `align="start"`, a ação fica numa faixa da altura da linha do título (`type/label/line`, 24, no md; `type/small/line`, 20, no sm), centrada nela, com ou sem descrição. Antes, ela se alinhava ao topo do cabeçalho. Um IconButton de 44 ou um Button sm de 36 transborda a faixa por igual, em cima e embaixo, e nada o corta. Com `align="center"`, nada muda.
  - `action` aceita também o Switch (use `size="sm"`).

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

- f6efbd9: **Switch:** `size` e `labelPosition`, como no Figma de 04/10/2026.

  - `size="md" | "sm"` (padrão `md`, o de antes). O `sm` é só o controle e o texto: sem padding em cima e embaixo (24 de altura), com a largura do conteúdo (`fit-content`). Serve para o cabeçalho do Card e para uma linha de 24. O alvo de toque de 44 continua: uma camada invisível em volta do controle (pseudo-elemento, 10 em cima e embaixo, 4 nos lados), que não ocupa layout. Substitui o override que zerava o padding vertical.
  - `labelPosition="end" | "start"` (padrão `end`, o de antes). No `start`, o rótulo vem antes e o controle fica na borda direita: no md, o rótulo preenche; no sm, o controle vem logo depois do texto. O hint e o erro perdem o recuo do controle e se alinham ao rótulo. Só muda a ordem visual: o DOM, a ordem de Tab e o nome acessível ficam iguais.
  - Tipos novos no barril: `SwitchSize` e `SwitchLabelPosition`.

### Patch Changes

- f6efbd9: Sincronia com o Figma [RDS] de 04/10/2026: tokens e tabela da Rojão extraídos de novo.

  - **Muda aparência:** o hover do Button danger (`colors/state/error-strong`) no escuro e na chapa passa de red/400 (`#ff6c5c`) para red/700 (`#990001`) na tabela da Rojão (`figma/brands/rojao.rds.json`) e no `styles/rds/theme.css`. O claro continua red/800. O rótulo branco sobre o hover sobe de 2,78:1 para AA.
  - No Figma, esse papel aponta direto para o primitivo no escuro e na chapa (`@color:red/700` no `theme.txt`), não mais para um token do `base`. O `export-brand.js` e o extrator já lidavam com isso: a tabela reextraída bate byte a byte com o Figma.
  - `ROLES` ganha uma fonte nova, `"p"`: um primitivo fixo, o mesmo para toda marca. É o caso de `colors/state/error-strong` no escuro e na chapa. `generateRdsTheme` passa a usar red/700 direto (antes, andava na rampa até carregar o rótulo e chegava ao mesmo valor), e o gerador e a tabela da Rojão deixam de divergir nesse papel (snapshot atualizado).

- Updated dependencies [f6efbd9]
- Updated dependencies [f6efbd9]
- Updated dependencies [f6efbd9]
  - @rojaostudio/ds-core@1.1.0-next.12

## 2.0.0-next.32

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.11

## 2.0.0-next.31

### Minor Changes

- Barra do pé floating no canto, X e desfazer de volta no compacto, e Toast embaixo no centro, como no Figma [RDS] publicado (Histórico 04/10/2026, revisão de `.bottom-bar`, FormActions, SavingBar e Toast).

  **Floating no canto inferior direito.** De 1024 para cima, o `placement="floating"` do FormActions e da SavingBar abraça o conteúdo (`width: fit-content`, nunca mais largo que o contêiner menos as margens) e fica no canto inferior direito do contêiner que rola, a 24 do fundo e da direita. Saem os 768 de largura máxima e a centralização. A folga fica menor: `bottom-bar/floating/padding-y` (8) e `bottom-bar/floating/padding-x` (12), mais os 2 do expandido, para 64 de altura. Continua `position: sticky` (não `fixed`): fica dentro do contêiner da página, então não cobre a sidebar ao lado, e o espaço que ocupa no fim do conteúdo é a folga que o conteúdo precisa. A SavingBar floating tem no mínimo 320 de largura. Abaixo de 1024, igual ao docked.

  **FormActions compacto com o X.** Abaixo de 1024, o primeiro filho (o Cancelar) volta como `IconButton` neutral ghost md com o ícone X e `aria-label` igual ao rótulo dele (o texto do filho, ou o `aria-label` que ele tiver), com o mesmo `onClick` e o mesmo `disabled`. Ordem: leading, X, primário, 8 entre os botões. A saída deixou de ser o X da topbar. Com mais de dois filhos, os do meio continuam fora do compacto.

  **SavingBar compacta com o desfazer.** Abaixo de 1024, o Descartar volta como `IconButton` neutral ghost md com o ícone undo-2, `aria-label` = `discardLabel`, chamando `onDiscard` e desabilitado no `saving`. Com o `leading` e o desfazer a 390, a mensagem padrão ocupa as 2 linhas e a barra fica com 68, como o quadro compacto do Figma.

  **Toast: padrão bottom-center.** O `Toaster` empilha embaixo e no centro em todo tamanho de tela (antes, no canto inferior direito), sem troca por breakpoint; no celular, a largura da tela menos 16 de cada lado. Com FormActions ou SavingBar na tela, a pilha sobe acima da barra: a barra preenche `--toast-offset-bottom` no `:root` enquanto está montada e visível (altura dela, mais a margem no floating, mais 16), e a variável volta ao padrão (16) quando a barra sai ou quando o teclado do celular a esconde. Não há prop de posição no `Toaster`; quem precisar de outra distância pode definir `--toast-offset-bottom` no `:root`.

  **Tokens.** Entram `bottom-bar/floating/padding-y` (→ `space/8`) e `bottom-bar/floating/padding-x` (→ `space/12`), `--bottom-bar-floating-padding-y` e `--bottom-bar-floating-padding-x`. Sai `bottom-bar/floating/max-width` (`--bottom-bar-floating-max-width`).

  **Atenção.** Quem lia `--bottom-bar-floating-max-width` deixa de tê-lo. Telas que contavam com a barra floating centralizada passam a vê-la no canto direito, e os toasts saem do canto para o centro.

## 2.0.0-next.30

### Minor Changes

- **BREAKING.** FormActions e SavingBar passam a montar sobre a mesma casca, o componente interno `BottomBar` (`.rds-bottom-bar`, não exportado), como no Figma [RDS] (Histórico 04/10/2026, "rumo novo do pé das telas"). As duas barras ficam na cor da marca (`bottom-bar/background` → `colors/primary/default`), 64 + área segura no compacto e 68 no expandido, 24 dos lados, `position: sticky` no pé do contêiner que rola, e saem do caminho do teclado do celular.

  **FormActions vira só ações.** Os filhos são as ações, em ordem de leitura; o último é o primário. No expandido (de 1024 para cima) aparecem todos, à direita; no compacto, só o primário (os outros ficam com `display: none`, e o Cancelar vai para o X da topbar). O fundo neutro e o fio em cima saíram.

  **SavingBar sem detalhes.** O botão de detalhes, o chevron e o anel saíram: o que falta é coisa do projeto e, se precisar de um controle, ele vai no `leading`. Ficam o status, o Descartar e as mensagens.

  **Novo nas duas:**
  - `placement="docked" | "floating"` (padrão `docked`). O `floating` só vale de 1024 para cima: 24 de margem, até 768 de largura, centralizado, `radius/container` e sombra `elevation/overlay`. Abaixo de 1024 ele é idêntico ao `docked`.
  - `leading?: ReactNode`: um controle de ~44 à esquerda, nunca texto corrido. Presente (mesmo `null` enquanto o controle está escondido), reserva 44 de largura para o resto não pular. Quem ocupa o slot anuncia as próprias mudanças.

  **Mapa de migração**

  | Sai                                                                                                                                | Entra / equivalente                                                                                                                                        |
  | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `<FormActions layout="bar">`                                                                                                       | `<FormActions>` (`placement="docked"`, o padrão)                                                                                                           |
  | `<FormActions layout="inline">` (cartão solto)                                                                                     | no pé da tela: `<FormActions placement="floating">`; no fim de card ou diálogo: Buttons soltos ou `ButtonGroup`                                            |
  | `<FormActions layout="stacked">`                                                                                                   | no pé da tela: `<FormActions>` (no compacto só o primário; o Cancelar vai para o X da topbar); fora do pé: `ButtonGroup`                                   |
  | `FormActions` `helper`, `showHelper`                                                                                               | sem equivalente na barra: a frase vai para a tela (perto do campo ou na coluna do checklist); um controle de ~44 pode ir em `leading`                      |
  | `FormActions` / `SavingBar` `onDetails`, `detailsLabel`, `detailsExpanded`, `detailsControls`                                      | `leading={<Button …>}` que abre o Drawer do projeto, com o próprio `aria-expanded`/`aria-controls`                                                         |
  | tipo `FormActionsLayout`                                                                                                           | tipo `FormActionsPlacement` (`'docked' \| 'floating'`); novo `SavingBarPlacement`                                                                          |
  | ordem invertida do `stacked` (primário primeiro)                                                                                   | ordem de leitura sempre: Cancelar primeiro, primário por último                                                                                            |
  | classes `.rds-form-actions--inline\|--stacked\|--bar\|--keyboard`, `.rds-form-actions__helper\|__text\|__details\|__icon\|__quiet` | `.rds-bottom-bar`, `.rds-bottom-bar--docked\|--floating\|--keyboard`, `.rds-bottom-bar__leading`; ficam `.rds-form-actions` e `.rds-form-actions__actions` |
  | classes `.rds-savingbar__row`, `.rds-savingbar__details`, `.rds-savingbar__message--details`, `.rds-savingbar--keyboard`           | `.rds-bottom-bar…` como acima; ficam `.rds-savingbar`, `__message`, `__text`, `__icon`, `__actions`, `__discard`                                           |
  | tokens `--savingbar-background`, `-text`, `-focus-ring`, `-button-fill-background`, `-button-fill-label`, `-button-ghost-label`    | `--bottom-bar-background`, `-text`, `-focus-ring`, `-button-fill-background`, `-button-fill-label`, `-button-ghost-label` (mesmos valores)                 |
  | tokens `--form-actions-background`, `-border`, `-text`, `-bar-background`, `-focus-ring`                                           | apagados; a barra usa `--bottom-bar-*`                                                                                                                     |
  | —                                                                                                                                  | novos: `--bottom-bar-padding-x`, `-padding-y`, `-gap`, `-leading-min-width`, `-floating-radius`, `-floating-margin`, `-floating-max-width`                 |

  Continua valendo: o conteúdo precisa de folga embaixo igual à altura da barra (`scroll-padding-bottom` e `padding-bottom`, mais a margem no `floating`, mais `env(safe-area-inset-bottom)`), e o primário nunca fica desabilitado.

## 2.0.0-next.29

### Patch Changes

- FormActions e SavingBar saem do caminho do teclado do celular, como o Figma [RDS] pede nas duas specs ("Com o teclado do celular aberto (foco num campo), o pé some; volta no blur"). A promessa já estava no JSDoc do FormActions, mas não havia implementação.
  - Novo hook interno `useOnScreenKeyboard` (`components/internal/`), sem dependência nova: só no compacto (`max-width: 1023px`), com um campo editável em foco (texto, textarea ou contenteditable; checkbox, rádio e afins não contam) e a área visível (`visualViewport`, corrigida pelo zoom) abaixo de 75% da `innerHeight`. Mede um quadro depois de `resize` do visualViewport, `focusin`/`focusout` e da troca de faixa da tela. No servidor e sem `visualViewport` a barra fica.
  - FormActions `bar` e `stacked` (o pé da tela) e a SavingBar ganham `rds-form-actions--keyboard` / `rds-savingbar--keyboard`: descem (`translateY(100%)`) e ficam `visibility: hidden` ao fim da descida, fora da ordem de Tab e da árvore de acessibilidade; voltam quando o teclado fecha ou no blur. O foco nunca é movido. `inline` não muda.
  - A transição (`motion/duration/base`, saída `motion/easing/exit`, volta `motion/easing/enter`) só existe com `prefers-reduced-motion: no-preference`; com `reduce` a barra some e volta sem animação.
  - FormActions passa a ser `'use client'` (usa o hook).
- Table: uma tabela larga dentro de um Card a 390 rola em vez de cortar. A causa estava na própria Table: a região de rolagem (`.rds-table`, `overflow-x: auto`) era um bloco comum e repassava o min-content da tabela aos ancestrais. Qualquer ancestral dimensionado pelo conteúdo (o main do app como item flex sem `min-width: 0`, item de grid em trilha auto, pilha alinhada ao início, inline-block) crescia até a largura da tabela, o Card passava da tela e era cortado. Agora `.rds-table` é uma grade de uma coluna `minmax(0, 1fr)`: sob min-content a trilha é 0 (não empurra ninguém), sob max-content é a largura da tabela (quem abraça o conteúdo continua abraçando a tabela inteira no desktop) e com largura definida ela preenche e a tabela rola por dentro. Card não mudou.

## 2.0.0-next.28

### Patch Changes

- FormActions ganha `showHelper`, como no Figma [RDS] (Histórico 03/10, "helper × detalhes"). Aditivo: o padrão é `true`, e quem não passa nada vê o mesmo de antes.

  - **Novo:** `showHelper?: boolean` (padrão `true`) controla só o texto estático da frase de apoio: no expandido aparece com `showHelper && helper`, no compacto com `showHelper && helper && !onDetails`. Sem `onDetails`, `showHelper={false}` tira a frase de vez, em qualquer layout.
  - **Muda:** no `layout="bar"` com `onDetails`, o compacto (abaixo de 1024) mostra sempre o botão de detalhes com o texto de `helper` e o chevron, mesmo com `showHelper={false}`. É o pé da criação: `<FormActions layout="bar" helper="Falta preço e prazo" showHelper={false} onDetails={…}>` fica só Cancelar + primário em 1280 (o checklist está na coluna da direita) e "Falta preço e prazo ˄" + primário em 390.
  - **Acessibilidade:** o `role="status"` continua anunciando as mudanças da frase também quando ela não está na tela: com `showHelper={false}` e `onDetails`, uma cópia visualmente oculta dentro do mesmo status responde no expandido, e no compacto quem responde é o botão. Só uma das formas fica na árvore de acessibilidade por vez, então a mudança é dita uma vez.

## 2.0.0-next.27

### Minor Changes

- DataTableHeader reconstruído 1:1 com o Figma [RDS] (componente sem variantes, átomo `.filter-trigger`).

  Novo:

  - `count?: ReactNode` — contagem de resultados no fim das ferramentas ("128 resultados"), região viva (`aria-live="polite"`).
  - `search.label` — nome acessível da busca, separado do placeholder (padrão "Buscar"; placeholder padrão "Buscar…"). A busca fica num `role="search"` com o mesmo nome.
  - Linha própria de filtros ativos (`__active`) abaixo da barra: os Chips ("Status: Abertos", `removeLabel` "Remover filtro Status: Abertos") e "Limpar filtros" (Button ghost sm, `onClear`), que devolve o foco à busca. Vale também para um filtro só e para o arranjo compacto.
  - Filtros rápidos num `role="group"` "Filtros rápidos". Gatilhos com `aria-expanded`/`aria-haspopup`; Esc fecha o menu, o Popover ou o Drawer e devolve o foco ao gatilho.
  - Token de componente local `--data-table-header-search-min`: 320px, 200px abaixo de 1024 (variável `data-table-header/search-min` do Figma, ainda não publicada no Base Tokens).

  Breaking (visual e de acessibilidade; nenhuma prop saiu, sem regra de codemod por não ser mecânico):

  - O nome acessível da busca deixa de ser o placeholder: passe `search.label` ("Buscar produtos") se o nome antigo importava.
  - Sai o Separator entre a busca e os filtros.
  - Compacto: saem o ponto e o Badge sobre o IconButton. Com filtro ativo o gatilho vira Button fill com o ícone sliders e o número no rótulo ("2"); o nome continua "Filtros, 2 ativos" / "Categoria, Pago".
  - Um filtro, expandido: o gatilho é Button com sliders à esquerda e o rótulo do filtro ("Status"), fill quando ativo (nome "Status, Abertos"); antes mostrava a opção escolhida com chevron à direita. Sai o IconButton X "Limpar filtros" ao lado.
  - Os Chips dos filtros ativos saem da linha das ferramentas e vão para a linha `__active`; o texto passa a "Rótulo: opção". "Limpar filtros" sai de dentro do Popover e do Drawer.
  - `__tools` alinha ao início (`justify-content: flex-start`; antes `flex-end`). A raiz vira coluna, com `__row` (ferramentas + ação) e `__active`.
  - Classes: saem `__dot` e `__trigger`; `__count` agora é a contagem de resultados; `__search` é o wrapper `role="search"` (o `className` não vai mais no Input).

## 2.0.0-next.26

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.10

## 2.0.0-next.25

### Minor Changes

- FormActions ganha `layout="bar"`, o pé da criação, como no Figma [RDS] (03/10). Aditivo: `inline` e `stacked` seguem iguais.

  - **Novo:** `layout="bar"`, o mesmo esqueleto da SavingBar, mas neutro: fundo `form-actions/bar/background` (`surface/page`) com a linha fina `form-actions/border` em cima, nunca a cor da marca (essa é sinal da SavingBar, na edição). A partir de 1024 é uma faixa de 68 (12 24), a frase de apoio à esquerda e Cancelar + primário à direita. Abaixo de 1024 (pela largura da tela, o mesmo corte da SavingBar) é uma linha de 64 mais a área segura: a frase (até 2 linhas) à esquerda e só o primário (o último filho) à direita. No celular o Cancelar sai do pé: a saída é o voltar ou X da topbar, com "Sair sem criar?" se houver algo digitado, e ele pode ir também no rodapé do Drawer.
  - **Novo:** `onDetails`, `detailsLabel` (padrão "Ver o que falta"), `detailsExpanded` e `detailsControls` (o `showDetails` do Figma), como na SavingBar. Com `onDetails` no `bar` compacto, a frase vira um botão com chevron para cima que abre o que falta (um Drawer); o nome acessível é a frase seguida de `detailsLabel`, com `aria-expanded` e `aria-controls`. Hover sublinha, o foco desenha o anel `form-actions/focus/ring` (novo token, `focus/ring`), e a área de toque tem 44 de altura.
  - **Muda:** a frase de apoio (`helper`) passa a ser `<p role="status">` em todos os layouts: quando muda, é anunciada sem mover o foco.
  - **Tokens novos:** `form-actions/bar/background` e `form-actions/focus/ring`.

## 2.0.0-next.24

### Minor Changes

- LoadingOverlay novo; SavingBar compacta numa linha e com um só indicador no `saving`; Spinner com as cores novas do Figma [RDS] (03/10).

  - **Novo: `LoadingOverlay`** (`@rojaostudio/ds/components` ou `@rojaostudio/ds/components/loading-overlay`). A espera longa de uma ação que leva a outra página (criar o produto e cair na edição). Props: `open`, `label` (padrão "Carregando…"), `delay` (padrão 400 ms) e `container`. Só aparece se `open` continuar `true` depois do `delay`; antes disso a espera é o botão principal em loading, e se a página nova abrir antes, o overlay nem aparece. No erro, o app fecha (`open={false}`), o foco volta ao botão e o erro vai para a SavingBar em `status="error"`. Véu `loading-overlay/scrim` em `position: fixed` na camada `--z-overlay` (portal no body, ou no `container`); no centro, um painel `loading-overlay/background` (radius/container, elevation/modal, até 320) com o Spinner lg e o `label` numa região `aria-live="polite"`. `role="dialog"` `aria-modal="true"` com o `label` de nome; o foco vai para o painel e fica preso, Esc não fecha, e o resto da página leva `inert` e `aria-busy="true"` enquanto ele está aberto (devolvidos ao fechar). Com `prefers-reduced-motion`, sem fade e o giro lento. Tokens novos: `loading-overlay/scrim`, `loading-overlay/background` e `loading-overlay/text` (Overlays).
  - **Muda aparência — SavingBar no celular.** Abaixo de 1024 a barra vira uma linha só, 64 de altura (`padding-block: 10px`, mais `env(safe-area-inset-bottom)` embaixo): a mensagem (ou o botão "ver o que falta", com `onDetails`) à esquerda, em até 2 linhas, e só o botão principal à direita. O Descartar não aparece no compacto: no celular ele é do app, no rodapé do Drawer de detalhes ou na confirmação ao sair. O expandido (a partir de 1024) não muda.
  - **Muda aparência — SavingBar em `status="saving"`.** Sai o loader da mensagem: o indicador é o Salvar em loading (`<Button loading>`), com o rótulo `savingLabel` (novo, padrão "Salvando…"), e o Descartar fica desabilitado. Um só indicador, inclusive com o LoadingOverlay por cima.
  - **Muda aparência — Spinner.** `spinner/indicator` passou de `colors/primary/default` a `colors/primary/dark` (o arco passa 3:1 também numa marca clara, como um ciano), e `spinner/inverse/indicator` e `spinner/inverse/label` de `text/on/primary-strong` a `text/on/primary`.

## 2.0.0-next.23

### Patch Changes

- `Chart`: `hrefs` só são seguidos quando são `http(s):`, caminho relativo ou `#fragmento`. Outro esquema (`javascript:`, `data:`…) é ignorado, no link da barra, na tabela e no Enter da coluna, com aviso no console em desenvolvimento.
- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.9

## 2.0.0-next.22

### Patch Changes

- SavingBar volta para a cor primária da marca (sai da chapa), como no Figma [RDS] (03/10).

  - **Muda aparência.** A barra não leva mais `.ds-plate`: `savingbar/background` é `colors/primary/default` e `savingbar/text` é `text/on/primary` (texto, alerta de erro, chevron e loader), no tema claro e no escuro, em todas as marcas. O anel de foco `savingbar/focus/ring` passa a `text/on/primary`.
  - **Botões:** continuam o mesmo Button, Salvar `tone="action"` (fill) e Descartar `tone="neutral" variant="ghost"`, com as cores da barra pelos tokens novos `savingbar/button/fill/background` (`text/on/primary`), `savingbar/button/fill/label` (`colors/primary/default`) e `savingbar/button/ghost/label` (`text/on/primary`). Hover do Salvar: o fundo a 85% sobre a barra; hover do Descartar: a cor do rótulo a 15%; desabilitado (`status="saving"`): 40% sobre a barra. Numa marca de primário claro (um ciano, por exemplo) o `text/on/primary` escolhido por contraste vale para o texto e para o fundo do Salvar.

## 2.0.0-next.21

### Patch Changes

- DataTableHeader: a busca, os filtros rápidos, os filtros e a visão ficam num grupo `tools` (`.rds-data-table-header__tools`), que é quem quebra linha; a barra não quebra mais e a ação (`actions`) fica fora dele, sempre no fim da primeira linha, presa à direita, como no Figma [RDS]. A ação é um IconButton neutral outline com Tooltip (ex.: engrenagem "Organizar categorias"); criar não é ação da barra, criar é o FAB.

## 2.0.0-next.20

### Minor Changes

- SavingBar na chapa da marca e com o botão de detalhes; Drawer com teto de 85% e rolagem por dentro, como no Figma [RDS] (03/10).

  - **Muda aparência.** A SavingBar agora é a chapa (`.ds-plate` no elemento da barra, em todas as marcas): `savingbar/background` passou a `surface/page` e `savingbar/text` a `text/body`, lidos no modo brand. Sobre página clara ou escura a barra sai igual. Os botões deixam o `tone="inverse"`: Salvar é `tone="action"` (fill) e Descartar `tone="neutral" variant="ghost"`, lidos na chapa. Numa marca clara (um ciano, por exemplo) o texto e os botões seguem o contraste da chapa, em vez do branco fixo do inverse.
  - **Novo:** `onDetails`, `detailsLabel` (padrão "Ver o que falta"), `detailsExpanded` e `detailsControls` (o `showDetails` do Figma). Com `onDetails` em `status="unsaved"`, no arranjo compacto (abaixo de 1024) a mensagem vira um botão com chevron para cima que abre o painel do que falta (um Drawer); o nome acessível é a mensagem seguida de `detailsLabel`, com `aria-expanded` e `aria-controls`. Hover sublinha, o foco desenha o anel `savingbar/focus/ring` (novo token, `focus/ring` na chapa), e a área de toque tem 44 de altura sem mudar o desenho. No expandido a mensagem continua texto.
  - **Drawer:** a altura vem do conteúdo até 85% da tela (`85dvh`, antes `100dvh - 48`); passou disso, só o conteúdo rola por dentro (`overscroll-behavior: contain`), e alça, título e rodapé ficam parados.
  - **Dialog, Sheet e Drawer controlados sem `trigger`:** ao fechar, o foco volta para o elemento que tinha o foco quando abriram (o botão de detalhes da SavingBar, por exemplo). Antes ia para o `body`.

## 2.0.0-next.19

### Patch Changes

- DataTableHeader e SavingBar: o arranjo compacto volta a seguir a largura da tela (abaixo de 1024), como o modo viewport do Figma (`layout/compact`). Na next.18 ele seguia a largura da própria barra, e uma lista com Sidebar numa tela de 1280 caía no compacto no desktop.

## 2.0.0-next.18

### Minor Changes

- DataTableHeader com o arranjo compact do Figma [RDS]: a barra é um contêiner de tamanho (`container-type: inline-size`) e, abaixo de 1024 de largura da própria barra (`@container (max-width: 1023px)`, o mesmo corte da SavingBar), troca de arranjo; o `@media (min-width: 768px)` saiu. Sem prop de tela.

  - **Compact:** a busca aceita 200 (`min-width: min(200px, 100%)`); o filtro vira um IconButton outline neutral md (44 × 44) com o ícone sliders e Tooltip com o rótulo, abrindo o mesmo Drawer ou Popover de antes. Com filtro ativo, um ponto (um filtro, na cor do Badge neutral) ou um Badge neutral com o número (vários), ambos `aria-hidden`; o estado vai no nome acessível ("Categoria, Pago", "Filtros, 3 ativos"). A 390, busca, filtro e uma ação IconButton cabem numa linha.
  - **Expanded (1024 para cima):** igual a antes: Separator vertical e o Button com rótulo ("Status", "Filtros · N"); a busca segue com mínimo de 320.

  O arranjo agora segue a largura da barra, não a da tela: uma barra estreita numa tela larga (painel, coluna) fica compact.

## 2.0.0-next.17

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

## 2.0.0-next.16

### Minor Changes

- Correções de contraste do Figma [RDS] (tokens extraídos de novo).

  - **Tema:** papel novo `--border-error` (red/600 no claro, red/400 no escuro, red/300 na chapa). `--text-on-info` passa a preto (era branco sobre blue/500, 3,12:1) e `--chart-series-2` claro passa a orange/600.
  - **Borda de erro dos campos:** `--input-border-error`, `--textarea-border-error`, `--select-border-error`, `--checkbox-control-border-error`, `--radio-control-border-error`, `--otp-slot-border-error`, `--file-input-area-border-error`, `--chip-input-border-error`, `--number-input-border-error`, `--color-input-border-error` e `--attachment-border-error` passam de `colors/state/error` para `border/error`. Na Rojão a cor não muda no claro; no escuro e na chapa a borda fica no vermelho claro, que passa 3:1 sobre o card.
  - **Tabs:** o selo "em breve" (`--tabs-soon-text`) passa de `text/disabled` para `text/subtle`.
  - **ChoiceCard:** a descrição do cartão escolhido (tile e preview) perde a opacidade de 70%. **FilterChip:** a contagem perde a opacidade de 60%. As duas ficam na cor cheia do token.
  - Quem gera o tema de uma marca com `rdsThemeFromTable` precisa reexportar a tabela da marca (`figma/export-brand.js`) por causa do papel novo; a tabela antiga carrega com aviso até lá (ver `@rojaostudio/ds-core`).

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.8

## 2.0.0-next.15

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

## 2.0.0-next.14

### Minor Changes

- Tema e CSS da 2.0:

  - **Rojão um para um com o Figma.** `styles/rds/theme.css` passa a sair da tabela da marca `rojao` exportada do [RDS] Base Tokens (`ds-core/figma/brands/rojao.rds.json`, via `rdsThemeFromTable`), não mais da regra derivada. Mudam, entre outros: tints azuis (`surface/tint/*`), capa azul (`surface/cover` blue/700), `colors/accent/mark` azul, `text/on/accent` e `text/on/tint` navy, o card do modo brand navy/800, a secundária do escuro em azul. Entram as variáveis da marca (`--rojao-primary`, `--rojao-accent`…).
  - **`base.css` não briga mais com `rds.css`.** Tudo do `base.css` (1.x, deprecated) vai para a camada `rds.legacy`, declarada antes de `rds.theme` nos dois arquivos: com os dois importados, vence o 2.0 nos 31 nomes em comum (`--surface-page`, `--text-muted`, `--border-default`, `--radius-card`, `--z-modal`, `--space-*`, `--toast-text`…) e a regra global `h1`–`h6` perde para o `Heading`. Os `@utility` e `@theme` do Tailwind seguem no topo; o anel de foco segue na camada `base` do Tailwind.
  - **Escopos genéricos.** Os tokens de componente passam a ser redeclarados também em `[data-rds-scope]`, `[data-rds-mode]` e `[data-rds-plate]`, e o tema publicado troca para escuro também em `[data-rds-mode="dark"]` e para a placa em `[data-rds-plate]`. Uma seção `<section data-rds-mode="dark">` numa página clara repinta os componentes dentro dela.

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.7

## 2.0.0-next.13

### Minor Changes

- O alvo nativo (`@rojaostudio/ds/native`, `/native/components`, `/native/theme`, `/native/icons`, `/native/preset`) fica **experimental, fora do semver na 2.0**: o alvo nativo segue a API 1.x na 2.0 e será alinhado na 2.1. Ele continua com `Button variant="primary"`, `Modal`, `Menu` e o tema do `generateTheme` 1.x, e pode mudar em qualquer versão até lá (fixe a versão exata se depende dele). Os pontos de entrada levam `@experimental` no JSDoc e o README diz o mesmo. Um teste garante que nenhum componente web importa do alvo nativo.
- Renomes da 2.0, como no Figma [RDS]: **`FloatingStepper` → `Stepper`** e **`ImageCropModal` → `ImageCropDialog`**. As props não mudam.

  - `Stepper`, `StepperProps` e `StepperStep` vêm do barril e de `@rojaostudio/ds/components/stepper`. `ImageCropDialog` e `ImageCropDialogProps` vêm de `@rojaostudio/ds/components/image-crop-dialog` (fora do barril, como antes: dependem do peer opcional `react-image-crop`); `CropPreset` também.
  - Os nomes antigos continuam funcionando como alias `@deprecated`: `FloatingStepper` (barril e `.../components/floating-stepper`) e `ImageCropModal` (`.../components/image-crop-modal`). O codemod troca os imports, os componentes e os tipos.

  **Breaking (para quem estiliza por classe ou token):**

  - A classe `rds-floating-stepper` (e `rds-floating-stepper__divider`) virou `rds-stepper` (e `rds-stepper__divider`). O alias deprecated renderiza a classe nova.
  - Os tokens `--image-crop-modal-*` (coleção Overlays) viraram `--image-crop-dialog-*`: `shade`, `selection`, `handle` e `stage-background`. As classes do recorte (`rds-image-crop__*`) não mudam.

- Toast com ação não some mais sozinho (WCAG 2.2.1, Timing Adjustable). Antes ficava 6 s; agora, com `action` e sem `duration`, fica na tela até a pessoa usar a ação ou o ×. Sem ação, continua 5 s. Uma `duration` explícita ainda vale, também com ação; dê uma só quando a ação puder ser feita por outro caminho.

  O `Toaster` ganha `closeLabel`, o nome acessível (e o Tooltip) do × de todos os toasts. Padrão "Fechar", que antes era fixo.

  **Breaking:** quem contava com o toast de ação fechando sozinho em 6 s passa a ver o toast até fechá-lo; para o comportamento antigo, passe `duration: 6000`.

## 2.0.0-next.12

### Minor Changes

- Alinhamento ao Figma [RDS] dos componentes que só existiam no código (o Figma é a verdade; o código segue um para um):

  - **ToggleCard** ganha `layout="default" | "compact"`, como o componente do Figma (Forms/ToggleCard). O `compact` é a antiga linha do `ToggleCardCompact` (Item outline, resumo sob o rótulo, lápis que abre as opções) e traz as props `summary`, `icon`, `onEdit` e `editLabel`. `onCheckedChange` passa a ser opcional. O `ToggleCardCompact` continua exportado como wrapper deprecated de `<ToggleCard layout="compact">`; o codemod troca um pelo outro.
  - **FloatingStepper**: a linha antes da ação agora é um `<Separator orientation="vertical">` de 24.
  - **DataTableHeader**: a contagem de filtros vai no rótulo do botão, "Filtros · 3" (sem Badge), com o ícone antes do texto, como no Figma. Na largura de 796 a busca não espreme: o que não cabe ao lado dela desce para a linha de baixo.
  - **ImageCropModal**: tokens novos na coleção Overlays, `image-crop-modal/shade` (surface/scrim), `/selection` e `/handle` (text/on/cover) e `/stage/background` (surface/muted). O palco ganha fundo e passa a ter 320 de altura (com teto de 60vh em tela baixa); a sombra fora do recorte, a linha do recorte (sólida, sem as formigas da biblioteca) e as alças leem esses tokens. As proporções usam os ícones do [RDS] (square, rectangle-vertical, rectangle-horizontal, square-dashed). No estado pronto aparece a dica "Arraste as alças para ajustar o recorte." (no Livre, a dica das proporções).
  - **ChoiceCarousel**: a seta some de vez (não é renderizada) quando não há mais nada para aquele lado, em vez de ficar transparente.
  - **PageSkeleton** e **CardsSkeleton**: os Cards voltam a ter a sombra `elevation/raised`, como no Figma.
  - **SectionHeader**: `eyebrow` e `number` ficam deprecated (não existem no Figma). Ainda renderizam.

  **Breaking** (2.0):

  - **CurrencyInput**: sai a prop `size`, que já era ignorada.
  - **SelectableCard**: saem `as`, `href`, `indicator` e `ribbon`, que já eram ignoradas.
  - **ChoicePreviewCard**: saem `locked`, `badge` e `previewAspect`, que já eram ignoradas.
  - **ImageUpload**: saem `aspect`, `variant`, `previewClassName` e `previewWrapperClassName`, que já eram ignoradas, e com elas os tipos `ImageUploadAspect` e `ImageUploadVariant`.

  Codemod (`rojao-ds migrate`): `ToggleCardCompact` vira `<ToggleCard layout="compact">` (e `ToggleCardCompactProps` vira `ToggleCardProps`); remove `size` do CurrencyInput, `indicator` e `as="button"` do SelectableCard, `previewAspect` e `locked={false}` do ChoicePreviewCard, e `aspect`, `variant`, `previewClassName` e `previewWrapperClassName` do ImageUpload. Ficam para revisão manual, com a orientação no relatório, `as="a"`, `href` e `ribbon` do SelectableCard, `locked` e `badge` do ChoicePreviewCard e os tipos `ImageUploadAspect` e `ImageUploadVariant`.

## 2.0.0-next.11

### Minor Changes

- Heading, como no Figma [RDS] Content/Heading: o título na dupla da marca.
  - `level="band" | "heading" | "value"` (36/48, 24/30, 20/30, negrito), `tone="default" | "accent"` e `as="h1"`…`"h6"` (padrão `h2`; o tamanho não decide o nível do HTML).
  - `<Heading.Mark>` (ou `HeadingMark`) pinta um trecho na outra cor da dupla: laranja num título `default`, a cor do título num `accent`.
  - Tokens novos na coleção Content: `--heading-default` (→ `text/heading`) e `--heading-accent` (→ `colors/accent/default`).
  - Laranja sobre branco não passa contraste nem em título grande (2,9:1 na Rojão): o `accent` e o destaque laranja são para fundo escuro ou a chapa da marca.

  Muda aparência: na Rojão, `text/heading` no claro passa de laranja (#ff6a00) para azul (#1b2a4a), como no Figma. Mudam junto os componentes que usam o papel: títulos de Card, Dialog, AlertDialog, Accordion, Calendar e dos blocos, rótulos de campo, a etapa atual do Breadcrumb, o rótulo do Button neutral outline/ghost e outros. No escuro e na chapa nada muda.

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.6

## 2.0.0-next.10

### Minor Changes

- ChoiceList, a lista densa de escolha única (#4), como no Figma [RDS] (Content/ChoiceList e `.choice-list/item`):
  - `<ChoiceList value | defaultValue onValueChange aria-label>` com `<ChoiceListItem value title description media trailing disabled />`. Cada linha: mídia de 32 (Avatar ou Tile), nome, meta apagada e um valor à direita; recuo 12 16, borda só embaixo, 60 de altura com descrição (44 sem), dezenas na tela.
  - Semântica de listbox: a lista tem um só ponto de Tab (`role="listbox"`, `aria-activedescendant`), cada linha é `role="option"` com `aria-selected`. Setas, Home e End andam pulando as desabilitadas; Enter, espaço ou clique escolhem. O título dá o nome da linha; a meta e o valor a descrevem; a mídia é decorativa.
  - Estados: hover em `choice-list/item/background/hover`; a escolhida ganha o tint e uma faixa de 2 à esquerda (`choice-list/item/indicator`), sem hover; o anel de foco da linha ativa em `choice-list/focus/ring`; a desabilitada nos tokens `*/disabled`.
  - 12 tokens novos na coleção Content, grupo `choice-list` (`--choice-list-*`), todos apontando para papéis do theme.

## 2.0.0-next.9

### Patch Changes

- O pacote `ds` passa a trazer o `THIRD_PARTY_NOTICES.md`, com as licenças do Lucide e do Feather (ícones), o aviso da marca Pix e a lista das dependências e fontes de terceiros. No `ds-core`, o exemplo de variável de marca nos comentários e no script de exportação passa a ser genérico (`marca/ciano`).
- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.5

## 2.0.0-next.8

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.4

## 2.0.0-next.7

### Minor Changes

- Chart, como no Figma [RDS] (`dates` e barras com destino):
  - `dates="edges" | "all"`: troca o `showAllDates`, que fica deprecado. O padrão passa a ser `edges` (primeira, meio e última data).
  - `dateEvery={N}`: uma data a cada N pontos, com um tique em cada ponto (token `chart/tick`).
  - `hrefs` (um por item) ou `onSelect(index)`: no bar, cada barra vira link ou botão, com o nome "<rótulo>: <valor>", hover em `chart/bar/hover` e anel de foco em `chart/focus/ring`. No column, clique ou Enter no gráfico escolhe o ponto. Na tabela visível, o rótulo vira link.

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.3

## 2.0.0-next.6

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.2

## 2.0.0-next.5

### Patch Changes

- Chart: a tabela alternativa (para leitor de tela) não estica mais a rolagem da página. Uma `<table>` ignora o recorte de 1px do `.rds-visually-hidden`; agora a tabela fica dentro de um wrapper oculto, e o gráfico é o ancestral posicionado.

## 2.0.0-next.4

### Patch Changes

- Sidebar: o rótulo da seção (`SidebarSection`) passa a seguir o Figma (`.sidebar/section`): caixa alta e tracking de 6%, em 11/14 bold. A contagem continua em caixa normal.

## 2.0.0-next.3

### Patch Changes

- Os campos (Input, PasswordInput e os que usam a mesma base) não mostram mais um retângulo azul ou amarelo no meio quando o navegador preenche sozinho (autofill). O fundo do autofill passa a ser coberto pela cor da caixa, e o texto mantém a cor do valor.

## 2.0.0-next.2

### Patch Changes

- Updated dependencies
  - @rojaostudio/ds-core@1.1.0-next.1

## 2.0.0-next.1

### Patch Changes

- aaf580d: O barril `@rojaostudio/ds/components` não puxa mais dependências opcionais. Por isso `PhoneInput`, `ImageCropModal` e `ImageUpload` saem dele e passam a vir de `@rojaostudio/ds/components/phone-input`, `.../image-crop-modal` e `.../image-upload`. Quem não usa esses componentes não precisa mais instalar `react-international-phone` nem `react-image-crop`. O `migrate:consumer` reescreve os imports. Um teste novo impede que um componente do barril volte a importar uma dependência opcional.

## 2.0.0-next.0

### Major Changes

- 45962a7: 2.0: os componentes passam a seguir a API do Figma [RDS].

  - **Componentes:** cerca de 100 componentes em CSS próprio (`@rojaostudio/ds/styles/rds.css`) sobre tokens de componente extraídos do Figma, cada um com teste no navegador e axe.
  - **Quebras:** quase todos os componentes mudam de API. Os principais renomes são Modal → Dialog, a troca Drawer ↔ Sheet, Menu → DropdownMenu, EmptyState → Empty e Divider → Separator. O Button passa a usar `tone`/`variant`, os campos ganham label, hint e erro embutidos, e o Select e o RadioGroup passam a receber os itens como filhos.
  - **Muda aparência:** o tema público `rojao` passa de preto + verde para navy + flare.
  - **Migração:** `pnpm migrate:consumer <projeto>` simula as trocas, e `--apply` aplica.
  - **ds-core:** novo `generateRdsTheme`/`emitRdsCss` (os papéis de tema do [RDS] a partir de uma cor de marca) e as paletas zinc, navy, flare e coal.

### Minor Changes

- e94f024: Button e IconButton ganham `size` (`sm` 36, `md` 44, `lg` 52; padrão `md`), e o Button ganha `iconPosition` (`start` | `end`; padrão `end`), como no Figma [RDS].

  - As medidas saem dos 24 tokens novos `--button-size-<sm|md|lg>-*` (coleção Actions).
  - A área de toque é 44 × 44 em todos os tamanhos: no `sm`, uma camada invisível estende o toque em `@media (pointer: coarse)`, sem mexer no layout nem no anel de foco.
  - Sem mudança de aparência para quem não passa `size`: o padrão `md` é o botão de antes.

### Patch Changes

- Updated dependencies [45962a7]
  - @rojaostudio/ds-core@1.1.0-next.0

## 1.0.2

### Patch Changes

- cf67e55: Corrige `ReferenceError: React is not defined` no servidor do consumidor

  A `1.0.1` saiu com o JSX compilado no **transform clássico**: 83 componentes chamando `React.createElement`, e só 43 importando React. Os outros 40 estouravam em runtime, no SSR de quem instalou.

  O `tsconfig` declara `jsx: preserve` — correto quando o Next compila a fonte, que era o caso no monorepo. Com o pré-build da #100, quem transpila passou a ser o esbuild, que caiu no clássico e não injeta o import. **Trocar quem transpila trocou o resultado**, e o monorepo não tinha como mostrar isso: lá o Next lia o `.tsx` e usava o runtime automático.

  Agora o build força `jsx: "automatic"`, e o `dist-contract.test.ts` falha se um `React.createElement` reaparecer no `dist`.

## 1.0.0

**Primeira versão pública.** O pacote sai do GitHub Packages, onde exigia token até para
instalar, e passa a viver no npmjs sob a MIT. As versões `0.x` ficam congeladas no registry
antigo para quem ainda não migrou.

O que mudou entre a `0.34.0` e esta: licença e identidade de pacote, marca de cliente fora do
que é publicado, o motor separado em `@rojaostudio/ds-core` (sem peer dependency nenhuma), e o
fim do TypeScript cru — agora sai ESM com tipos, e funciona fora do Next.

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

- 340548e: Marca de cliente fora do pacote público, e o alvo React Native passa a ser temável

  Fecha o #101. A auditoria achou **quatro** vazamentos onde a issue previa um:

  1. `styles/themes/*.css` — sete temas de produto e de cliente
  2. `recipes/index.ts` — **ia no tarball** com os oito `BrandDef`, ou seja, a cor de marca de cada cliente em código-fonte
  3. `targets/native/theme.ts` — exportava um símbolo com o nome de uma marca específica, gerado da receita dela
  4. `README.md` — tabela de `--brand-primary` por cliente. O npm **sempre** inclui o README no tarball, esteja ou não no `files[]`

  O pacote público passa a carregar só o tema `rojao` e o catálogo de presets genéricos, que não descreve marca de ninguém.

  ## O alvo nativo era o pior dos quatro

  Não era só vazamento: o `DSThemeProvider` estava **cravado numa marca**, sem prop de override. Qualquer app React Native que instalasse o pacote recebia as cores do um produto consumidor e não tinha como trocar — o lado web é temável por classe, o nativo não era temável de jeito nenhum.

  Agora a base é a receita pública e a marca entra por prop:

  ```tsx
  <DSThemeProvider theme={brandTheme}>
  ```

  O símbolo antigo saiu: a API não carrega mais nome de marca.

  ## Para quem consome uma marca

  `pnpm build:brands` gera a entrega em `brands-out/`: o CSS de cada marca e o mapa nativo completo. É assim que o tema sai do pacote e entra no repositório do consumidor, e é como ele é **refeito** quando uma melhoria do motor justifica reentregar.

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

- 51fc204: Licença MIT, marca reservada e identidade de pacote público

  Primeiro passo da abertura (#98). O pacote não tinha licença — sem ela, código público é "olha mas não usa": legalmente ninguém pode.

  - `LICENSE` MIT na raiz e dentro do pacote (entra no `files[]`, então vai no tarball)
  - `TRADEMARK.md` separando código de marca: o nome "Rojão", os logos e os domínios ficam de fora da MIT. Qualquer um usa o código; ninguém publica um fork chamado "Rojão DS"
  - `package.json` ganha `license`, `author`, `homepage`, `repository`, `bugs` e `keywords`

  O `repository` não é cosmético: o npm exige que ele bata com o repo que buildou para verificar a proveniência. Sem ele, `npm publish --provenance` falha.

  **A propriedade do output ficou escrita em dois lugares** — no cabeçalho de todo `theme.css` gerado e na página, ao lado do download. O gerador é MIT; o que sai dele é de quem gerou. Quem recebe um `theme.css` de um colega meses depois não viu a página nenhuma, então a frase viaja com o arquivo.

- 66ed985: Documentação pública: README externo, SECURITY, SUPPORT e CONTRIBUTING

  Fecha o #104. A documentação era interna: o README do `ds` descrevia o repo pra quem já era de casa, e o `consuming.md` ensinava a configurar PAT.

  Os dois READMEs de pacote foram reescritos **em inglês** — eles são publicados no npm, que é registry global, e o npm inclui o `README.md` no tarball esteja ou não no `files[]`. O site continua em português e cada README aponta pra ele.

  Novos na raiz: **SECURITY.md** (canal privado de report, escopo, e o que esperar de prazo — dito honestamente, sem SLA que ninguém está de plantão pra cumprir), **SUPPORT.md** (o que é mantido e o que não é, escrito na entrada em vez de descoberto seis meses depois) e **CONTRIBUTING.md** público, com a regra que mais importa num repositório aberto: nunca `pull_request_target`, nunca secret em workflow que roda código de fork.

  Os sete documentos internos saíram de `docs/` para `private/docs/` — quatro nomeavam clientes e iriam para o repositório público.

- Updated dependencies [66ed985]
- Updated dependencies [64d476c]
- Updated dependencies [74d63a2]
  - @rojaostudio/ds-core@0.35.0

## 0.34.0

### Minor Changes

- be447fd: Contraste: `--text-muted` e `--text-placeholder` atingem AA no modo claro

  Fecha o #109, a parte da correção de contraste que ficou de fora da 0.33.0 por precisar de decisão visual.

  A `--surface-raised` é a **mais escura** das três superfícies claras, e é ela quem manda. Sobre `#ededed` o `neutral-500` dá 4,05 e reprova por pouco; o `600` dá 6,17. Abaixo do `--text-secondary` (700) o `600` é o único degrau que passa — então o `--text-placeholder` aterrissa no mesmo tom.

  - `--text-muted` no claro: 500 → **600**
  - `--text-placeholder` no claro: 400 → **600** (dava 2,80 / 2,92 / 2,49)
  - `--text-placeholder` no escuro: 600 → **300** (dava 2,69 / 2,18 / 1,53)
  - mesmo ajuste nos valores à mão do `base.css`, nos dois modos

  **A escada do texto passa a ter três níveis, não quatro:** `muted` e `placeholder` compartilham o tom. Colapso deliberado — os dois são texto de baixa ênfase que precisa ser lido. O `--text-disabled` continua abaixo do piso de propósito: a WCAG 1.4.3 dispensa componente desabilitado, e é o único dos quatro que pode.

  **Muda aparência.** Legenda, metadado, timestamp e placeholder de campo escurecem no modo claro — que é o modo padrão. O teste de contraste agora cobre os quatro tokens nos dois modos, sem lista de exceção.

## 0.33.0

### Minor Changes

- 32768f3: Contraste: escala de texto do escuro recalibrada e `--surface-invert` ganha origem

  Três defeitos com a mesma raiz — a escala era calibrada contra a página, e a `--surface-raised` (o tom mais claro das três superfícies) nunca entrava na conta.

  - **#91 · #92** — no escuro, `--text-secondary` sobe de 400 para 200 e `--text-muted` de 500 para 300. Sobre `--surface-raised` só 100/200/300 alcançam os 4,5:1 da WCAG 1.4.3; o muted estava no 500, o mesmo degrau do claro, e era o único token de texto que não invertia. O mesmo ajuste vai pro bloco escuro do `base.css`.
  - **#93** — `--surface-invert` passa a ser derivado nos dois modos. O `base.css` exportava o utilitário `--color-surface-invert` sem que nenhum tema neutro ou chromatic definisse a origem: `bg-surface-invert` não pintava nada e o par com `--text-inverse` dava 1:1. Atinge `Card` variante `invert`, `PricingCard` em destaque e `ToggleGroup` selecionado.

  **Muda aparência.** Todo texto de apoio no modo escuro fica mais claro, e as três superfícies invertidas passam a pintar. Olhar antes de subir a versão nos projetos.

  Fica de fora, medido e registrado no #109: `--text-muted` reprova por pouco no modo **claro** sobre `--surface-raised` (4,03–4,49) e `--text-placeholder` reprova nos dois modos.

### Patch Changes

- 5d77fd1: Foco visível como padrão do sistema

  O DS não definia foco em lugar nenhum além do slider. Todo produto que o
  consome herdava o outline do navegador, que qualquer `border` ou `border-radius`
  acaba encobrindo — e uma tela inteira navegada por teclado sem indicação de
  posição viola o 2.4.7 (WCAG AA) por omissão do sistema, não por descuido de quem
  consome.

  A regra usa `:focus-visible`, então o anel aparece para quem navega por teclado
  e não para quem clica com o mouse. O seletor é envolvido em `:where()`, de
  especificidade zero: qualquer componente que já resolva o próprio foco continua
  vencendo sem precisar de `!important`.

  A cor sai de `--border-focus`, que já existia e já inverte entre os temas — um
  produto com chrome escuro sobre tema claro redefine o token no escopo daquela
  superfície, sem tocar na regra.

## 0.32.0

### Minor Changes

- a24d4f5: a11y: borda de controle com 3:1 — novo token `--border-control` (#87).

  O `Input` desenhava o campo com `--border-default`, que dá **1,45:1** sobre a superfície branca
  em qualquer marca. A WCAG 2.2 SC 1.4.11 pede 3:1 para o que identifica um componente de
  interface, e num campo vazio, sem foco, a borda é exatamente isso. Não dependia da cor de quem
  usa — era dívida da base, e valia para todos os consumidores.

  O motor passa a emitir `--border-control` nos três caminhos (light, dark e mix), com o alias
  `stroke-control` no `@theme`. No claro é o step 500 da família de texto (4,74:1 — o 400 dá 2,92
  e falha por um triz); no escuro, branco a 40% (3,71:1).

  Migram para ele os 14 componentes que são **controle**: input, select, textarea, checkbox,
  radio, combobox, date-picker, currency-input, color-input, chip-input, phone-input, search,
  dropzone e toggle. Os outros 26 seguem com `--border-default` — card, accordion, badge, drawer
  e afins são decoração, onde borda sutil é escolha legítima e o critério não se aplica.

  **Mudança visível:** a borda dos campos fica mais escura. É o preço dos 3:1, e a alternativa era
  manter um campo que alguém com baixa visão não enxerga. Os temas gerados continuam
  byte-idênticos fora a linha nova do token (`validate:themes` reproduz 8/8), e um teste trava o
  contraste nas famílias neutras reais do DS.

### Patch Changes

- 06c817a: fix(generate): `emitClaudeMd` mandava linkar uma URL morta.

  Sem `cssUrl`, o arquivo gerado trazia `<link rel="stylesheet" href="https://ds.rojao.ai/themes/<slug>.css">`
  — o serving de tema por conta, que saiu para o studio junto com o resto do editor. A rota responde
  404, então todo `CLAUDE.md` entregue pelo site público mandava o leitor apontar para um arquivo
  que não existe. Pior: a instrução seguinte prometia que editar no painel atualizaria "todos os seus
  apps de uma vez", o que não vale mais para quem gera de fora.

  Agora, sem `cssUrl`, o arquivo instrui a importar o `theme.css` local — que é baixado junto — e
  diz o que passou a ser verdade: o tema é um arquivo do consumidor, sem dependência de host. Quem
  tem serving próprio segue passando `cssUrl` e recebe o bloco de link ao vivo, inalterado.

## 0.31.0

### Minor Changes

- 899f0e8: Motor de cor: remove os tokens `--brand-secondary-sunken` e `--brand-on-secondary-sunken` (#44).

  Depois do épico de cor do um produto consumidor (#523 / 0.29.0), a banda de identidade das faces (Bio + vitrine)
  passou a usar a secondary **literal** e todos os consumidores migraram — os dois tokens viravam
  dead output em todo tema gerado, junto com a lógica que só existia pra alimentá-los
  (`surfaceable`/`darkenSunken` no dark, e os helpers `mixHex`/`onSecondarySunken`).

  `--brand-secondary-surface` e `--brand-secondary-band` continuam idênticos: o diff dos 8 temas
  gerados, ignorando o realinhamento de whitespace, é só a remoção das linhas do sunken. Um teste
  trava a ausência dos tokens. O target native perde o skip que descartava o sunken na resolução.

### Patch Changes

- 28eeb78: fix(color): `--brand-hover` saía igual a `--brand-primary` em marcas com cor custom.

  `brandTones` recalculava o passo da cor na escala por luminância (`nearestStep`), enquanto o
  `buildScale` crava a cor por outro critério (piso adaptativo + âncora de croma). Quando os dois
  divergiam em um step — o que acontece em cerca de metade das cores testadas — o "próximo step"
  caía exatamente sobre a própria cor, e o botão ficava sem nenhum feedback de hover.

  O passo agora vem de onde a cor foi **efetivamente cravada** na escala, com o cálculo por
  luminância como fallback. Uma bateria de 12 cores trava o comportamento, incluindo os extremos
  (quase-preto precisa clarear, quase-branco precisa escurecer).

  Afeta só marca **custom** (hex): os 8 temas curados usam `ColorRef`, não passam por `brandTones`,
  e seguem byte-idênticos — `validate:themes` reproduz 8/8 diff-clean.

- 899f0e8: fix(pack): publica a pasta `taxonomy` — o subpath `@rojaostudio/ds/taxonomy` estava quebrado.

  O `exports` mapeia `./taxonomy` desde que o subpath existe, mas `files` nunca listou a pasta: o
  tarball ia sem ela em **todas** as versões publicadas. O import resolvia pelo package.json e
  estourava em disco. Ficou invisível porque o único consumidor era o `ds-www` via `workspace:*`,
  que resolve pela pasta real e mascara o defeito — apareceu no primeiro consumidor de fora.

  Um teste passa a travar a coerência: todo diretório alvo de `exports` precisa estar em `files` e
  existir em disco.

## 0.30.1

### Patch Changes

- 3e977d7: perf: remove CSS morto do PhoneInput e declara `sideEffects` (#63).

  O `PhoneInput` importava `react-international-phone/style.css` desde que foi escrito, com um
  comentário afirmando que as bandeiras dependiam dele. Não dependiam: o componente descartou o
  dropdown da lib e usa o `Combobox` do DS, então nenhum dos seletores do arquivo é renderizado; e o
  `FlagImage` aplica `width`/`height` inline e busca a bandeira por URL do twemoji, não por sprite.
  Eram 8 KB de CSS render-blocking em toda rota que toca o componente, inclusive o checkout da
  vitrine do um produto consumidor.

  O pacote passa a declarar `sideEffects` em forma de array (`["**/*.css", "./styles/**"]`), o que
  libera o bundler do consumidor a remover módulos do grafo. Em array, e não `false`: o
  `ImageCropModal` importa `ReactCrop.css` de verdade, e `false` autorizaria o bundler a dropar esse
  import, quebrando o estilo em produção sem quebrar em dev. Um teste trava as duas coisas.

## 0.30.0

### Minor Changes

- 89347ae: uma marca: tema migrado de brasa para navy. Navy + laranja + branco, LIGHT-first, Inter + Bricolage. Dark profundo (#0E1626) e accent laranja cheio (flare-700), alinhado à identidade Rojão da home do um consumidor. Afeta os consumidores do tema `uma marca` (um consumidor e site uma marca).

## 0.29.0

### Minor Changes

- f09caf3: Motor de cor: fill da marca LITERAL (não reancora) + affordance opt-in

  - `--brand-primary` (e o par no dark) agora é emitido LITERAL: a cor da marca é intenção
    do consumidor e nunca é reancorada pra contrastar com a superfície (preto fica preto). O
    contraste continua garantido onde pertence — no `--brand-on-primary` (texto sobre o fill,
    derivado por WCAG) e no `--brand-text` (marca usada como texto). Reverte o guarda DS-1 que
    empurrava a própria cor da marca.
  - Novo token `--brand-primary-border`: hairline de affordance emitido SÓ quando o fill da
    marca quase encosta na superfície (contraste < 2). O `Button` filled/primary consome
    `border-[var(--brand-primary-border,transparent)]` — zero mudança nos botões que já
    contrastam; nos que sumiriam, um contorno translúcido (on-primary a 60%) sem tocar na cor.

## 0.28.0

### Minor Changes

- bc0700c: Motor de cor: escala de marca, resolveTheme e derivação harmônica (épico um produto consumidor#523)

  - **#27** — escala de marca canônica `--brand-primary-50..900` emitida pelo motor (hex → buildScale; ref de paleta → `--color-<paleta>-<step>`). Aditiva: consumidores param de reimplementar a paleta.
  - **#28** — `resolveTheme(recipe, { mode }) → { tokens, isDark }`: contrato único de derivação + modo (funde light+dark), tirando as cópias de fusão dos consumidores. A política de modo continua no consumidor.
  - **#29** — derivação harmônica de `secondary`/`accent` quando ausentes: a partir da `primary` hex, pela roda de cor (análoga + split-complementar) com clamp de saturação/luminância. Temas curados (3 papéis) passam intactos.

## 0.27.0

### Minor Changes

- theme: guarda de contraste INCONDICIONAL no override de marca (#26). Quando a marca do modo escuro vem como hex cru (override de leigo via consumidor), o motor reancora por surfaceSafeHex e deriva hover/on por WCAG — o override não fura mais o guarda, e o CTA nunca fica invisível no dark. Marca curada (ref de paleta) segue respeitada. Preserva o hue (identidade).

## 0.26.1

### Patch Changes

- toast: duração default segue o Material Design (Snackbar) — 1500ms (LENGTH_SHORT) para confirmações curtas e 2750ms (LENGTH_LONG) quando há ação ou em erros (mensagem precisa ser lida). Reduz o tempo em tela. O valor é só um FALLBACK: cada toast pode sobrescrever com `toast.x(msg, { duration })` sem republicar o DS. Target native alinhado (default único 2750).

## 0.26.0

### Minor Changes

- d085da6: Migrate the design system into the rojao monorepo (Turborepo + pnpm workspaces). Now published from `rojaostudio/rojao` instead of the archived `rojaostudio/rojao-ds`. No public API changes — consumers keep importing `@rojaostudio/ds`.
