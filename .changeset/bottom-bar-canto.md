---
"@rojaostudio/ds": minor
---

Barra do pé floating no canto, X e desfazer de volta no compacto, e Toast embaixo no centro, como no Figma [RDS] publicado (Histórico 04/10/2026, revisão de `.bottom-bar`, FormActions, SavingBar e Toast).

**Floating no canto inferior direito.** De 1024 para cima, o `placement="floating"` do FormActions e da SavingBar abraça o conteúdo (`width: fit-content`, nunca mais largo que o contêiner menos as margens) e fica no canto inferior direito do contêiner que rola, a 24 do fundo e da direita. Saem os 768 de largura máxima e a centralização. A folga fica menor: `bottom-bar/floating/padding-y` (8) e `bottom-bar/floating/padding-x` (12), mais os 2 do expandido, para 64 de altura. Continua `position: sticky` (não `fixed`): fica dentro do contêiner da página, então não cobre a sidebar ao lado, e o espaço que ocupa no fim do conteúdo é a folga que o conteúdo precisa. A SavingBar floating tem no mínimo 320 de largura. Abaixo de 1024, igual ao docked.

**FormActions compacto com o X.** Abaixo de 1024, o primeiro filho (o Cancelar) volta como `IconButton` neutral ghost md com o ícone X e `aria-label` igual ao rótulo dele (o texto do filho, ou o `aria-label` que ele tiver), com o mesmo `onClick` e o mesmo `disabled`. Ordem: leading, X, primário, 8 entre os botões. A saída deixou de ser o X da topbar. Com mais de dois filhos, os do meio continuam fora do compacto.

**SavingBar compacta com o desfazer.** Abaixo de 1024, o Descartar volta como `IconButton` neutral ghost md com o ícone undo-2, `aria-label` = `discardLabel`, chamando `onDiscard` e desabilitado no `saving`. Com o `leading` e o desfazer a 390, a mensagem padrão ocupa as 2 linhas e a barra fica com 68, como o quadro compacto do Figma.

**Toast: padrão bottom-center.** O `Toaster` empilha embaixo e no centro em todo tamanho de tela (antes, no canto inferior direito), sem troca por breakpoint; no celular, a largura da tela menos 16 de cada lado. Com FormActions ou SavingBar na tela, a pilha sobe acima da barra: a barra preenche `--toast-offset-bottom` no `:root` enquanto está montada e visível (altura dela, mais a margem no floating, mais 16), e a variável volta ao padrão (16) quando a barra sai ou quando o teclado do celular a esconde. Não há prop de posição no `Toaster`; quem precisar de outra distância pode definir `--toast-offset-bottom` no `:root`.

**Tokens.** Entram `bottom-bar/floating/padding-y` (→ `space/8`) e `bottom-bar/floating/padding-x` (→ `space/12`), `--bottom-bar-floating-padding-y` e `--bottom-bar-floating-padding-x`. Sai `bottom-bar/floating/max-width` (`--bottom-bar-floating-max-width`).

**Atenção.** Quem lia `--bottom-bar-floating-max-width` deixa de tê-lo. Telas que contavam com a barra floating centralizada passam a vê-la no canto direito, e os toasts saem do canto para o centro.
