---
"@rojaostudio/ds": minor
"@rojaostudio/ds-core": patch
"@rojaostudio/ds-codemod": patch
---

**Sidebar (BREAKING), como no Figma de 04/10/2026:** grupos com ícone num accordion exclusivo, tipografia por nível, um só item atual, trilho com um ícone por grupo e gaveta no celular.

**Mapa de migração:**

| Sai | Entra |
| --- | --- |
| `SidebarSection` (`label`, `count`, `open`, `defaultOpen`, `onOpenChange`) e `SidebarSectionProps` | `SidebarGroup` (`label`, `icon`, `id?`) e `SidebarGroupProps`. O grupo não leva número, e quem abre e fecha é a Sidebar (accordion exclusivo). |
| `SidebarSeparator` | — (a separação é o espaço de 16 acima do grupo) |
| `current` em cada item para marcar a página | `currentPath` na `Sidebar` (o pathname). O `current` do item continua aceito, mas só um item fica com `aria-current`: vence o `href` mais longo. |
| `SidebarItem` `icon` obrigatório | `icon` opcional: só o nível 1 desenha ícone. No nível 2 (dentro de um grupo) é só texto. |
| Tokens `--sidebar-section-label`, `--sidebar-item-indicator`, `--sidebar-item-count` | `--sidebar-count-neutral` (o antigo `item-count`), `--sidebar-count-danger`, `--sidebar-dot-neutral`, `--sidebar-dot-danger` e `--sidebar-item-label-strong` |
| Classes `.rds-sidebar__section*`, `.rds-sidebar__separator`, o `::before` do item atual | `.rds-sidebar__group*`, `.rds-sidebar__item--level-1/2`, `.rds-sidebar__count--*`, `.rds-sidebar__dot--*` |

**Novo:**

- `SidebarItem` ganha `countTone` (`neutral` | `danger`) e `countLabel` (o que o número conta, dito no nome acessível: "Contas a pagar, 3 vencidos").
- **Nível pela posição, nunca por ter filhos.** Nível 1 (item solto e cabeçalho do grupo): 44 de altura, 12 por dentro, ícone de 20, 14/20 peso 500. Nível 2 (item dentro do grupo): 40 de altura, recuo de 44, só texto, 14/20 peso 400.
- **Atual.** A página atual tem a pílula (`--sidebar-item-background-active`) e o rótulo semibold em `--sidebar-item-label-active`. O grupo com a rota atual fica em `--sidebar-item-label-strong`, semibold, sem pílula, e abre sozinho. O botão do grupo aberto também o fecha.
- **Trilho** (`collapsed`, a partir de 1024): os itens soltos e um ícone por grupo. O grupo leva um ponto de 8 no canto do ícone, na cor do pior estado entre os filhos (`--sidebar-dot-danger` vence `--sidebar-dot-neutral`), e o nome acessível com o número ("Financeiro, 3 vencidos"). O flyout com os subitens (a casca do DropdownMenu, 240 de largura) abre ao clicar ou ao receber foco, sem mover o foco. Enter, Espaço e → entram nele, ↑ e ↓ andam, e Esc e ← fecham e devolvem o foco. O item solto com número também vira ponto.
- **Gaveta** (abaixo de 1024, o `layout/nav-button/visible` do Figma): a Sidebar sai da tela e fica `inert` enquanto fechada. `drawerOpen` e `onDrawerOpenChange` a controlam, e `SidebarTrigger` é o botão (IconButton neutral ghost com Tooltip, `aria-controls` e `aria-expanded`, escondido a partir de 1024). Ao abrir, o foco entra no item atual. Esc, o véu (`--drawer-scrim`) e um item que navega a fecham, e o foco volta ao botão. O `collapsed` não vale na gaveta: ela abre inteira.

**Muda aparência:** saem o marcador de 3 × 20 do item atual, a linha separadora e a legenda 11/14 em caixa alta dos grupos. Abaixo de 1024, a Sidebar deixa de aparecer na página até a gaveta abrir.

**ds-core:** na chapa do tema gerado, `colors/state/neutral-strong` (o ponto neutral da Sidebar e o ícone da Toast neutral) anda na rampa até 3:1 sobre o painel e o card. `RDS_NON_TEXT_PAIRS` passa a medir esse par. A tabela da Rojão não muda.

**codemod:** os nomes novos (`SidebarGroup`, `SidebarTrigger`, `SidebarCountTone`, `SwitchSize`, `SwitchLabelPosition` e os `*Props`) entram na detecção de código que já está no 2.0.
