---
"@rojaostudio/ds": minor
---

**BREAKING.** FormActions e SavingBar passam a montar sobre a mesma casca, o componente interno `BottomBar` (`.rds-bottom-bar`, não exportado), como no Figma [RDS] (Histórico 04/10/2026, "rumo novo do pé das telas"). As duas barras ficam na cor da marca (`bottom-bar/background` → `colors/primary/default`), 64 + área segura no compacto e 68 no expandido, 24 dos lados, `position: sticky` no pé do contêiner que rola, e saem do caminho do teclado do celular.

**FormActions vira só ações.** Os filhos são as ações, em ordem de leitura; o último é o primário. No expandido (de 1024 para cima) aparecem todos, à direita; no compacto, só o primário (os outros ficam com `display: none`, e o Cancelar vai para o X da topbar). O fundo neutro e o fio em cima saíram.

**SavingBar sem detalhes.** O botão de detalhes, o chevron e o anel saíram: o que falta é coisa do projeto e, se precisar de um controle, ele vai no `leading`. Ficam o status, o Descartar e as mensagens.

**Novo nas duas:**
- `placement="docked" | "floating"` (padrão `docked`). O `floating` só vale de 1024 para cima: 24 de margem, até 768 de largura, centralizado, `radius/container` e sombra `elevation/overlay`. Abaixo de 1024 ele é idêntico ao `docked`.
- `leading?: ReactNode`: um controle de ~44 à esquerda, nunca texto corrido. Presente (mesmo `null` enquanto o controle está escondido), reserva 44 de largura para o resto não pular. Quem ocupa o slot anuncia as próprias mudanças.

**Mapa de migração**

| Sai | Entra / equivalente |
| --- | --- |
| `<FormActions layout="bar">` | `<FormActions>` (`placement="docked"`, o padrão) |
| `<FormActions layout="inline">` (cartão solto) | no pé da tela: `<FormActions placement="floating">`; no fim de card ou diálogo: Buttons soltos ou `ButtonGroup` |
| `<FormActions layout="stacked">` | no pé da tela: `<FormActions>` (no compacto só o primário; o Cancelar vai para o X da topbar); fora do pé: `ButtonGroup` |
| `FormActions` `helper`, `showHelper` | sem equivalente na barra: a frase vai para a tela (perto do campo ou na coluna do checklist); um controle de ~44 pode ir em `leading` |
| `FormActions` / `SavingBar` `onDetails`, `detailsLabel`, `detailsExpanded`, `detailsControls` | `leading={<Button …>}` que abre o Drawer do projeto, com o próprio `aria-expanded`/`aria-controls` |
| tipo `FormActionsLayout` | tipo `FormActionsPlacement` (`'docked' \| 'floating'`); novo `SavingBarPlacement` |
| ordem invertida do `stacked` (primário primeiro) | ordem de leitura sempre: Cancelar primeiro, primário por último |
| classes `.rds-form-actions--inline\|--stacked\|--bar\|--keyboard`, `.rds-form-actions__helper\|__text\|__details\|__icon\|__quiet` | `.rds-bottom-bar`, `.rds-bottom-bar--docked\|--floating\|--keyboard`, `.rds-bottom-bar__leading`; ficam `.rds-form-actions` e `.rds-form-actions__actions` |
| classes `.rds-savingbar__row`, `.rds-savingbar__details`, `.rds-savingbar__message--details`, `.rds-savingbar--keyboard` | `.rds-bottom-bar…` como acima; ficam `.rds-savingbar`, `__message`, `__text`, `__icon`, `__actions`, `__discard` |
| tokens `--savingbar-background`, `-text`, `-focus-ring`, `-button-fill-background`, `-button-fill-label`, `-button-ghost-label` | `--bottom-bar-background`, `-text`, `-focus-ring`, `-button-fill-background`, `-button-fill-label`, `-button-ghost-label` (mesmos valores) |
| tokens `--form-actions-background`, `-border`, `-text`, `-bar-background`, `-focus-ring` | apagados; a barra usa `--bottom-bar-*` |
| — | novos: `--bottom-bar-padding-x`, `-padding-y`, `-gap`, `-leading-min-width`, `-floating-radius`, `-floating-margin`, `-floating-max-width` |

Continua valendo: o conteúdo precisa de folga embaixo igual à altura da barra (`scroll-padding-bottom` e `padding-bottom`, mais a margem no `floating`, mais `env(safe-area-inset-bottom)`), e o primário nunca fica desabilitado.
