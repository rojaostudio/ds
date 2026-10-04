# @rojaostudio/ds

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
