---
"@rojaostudio/ds": minor
---

SavingBar na chapa da marca e com o botão de detalhes; Drawer com teto de 85% e rolagem por dentro, como no Figma [RDS] (03/10).

- **Muda aparência.** A SavingBar agora é a chapa (`.ds-plate` no elemento da barra, em todas as marcas): `savingbar/background` passou a `surface/page` e `savingbar/text` a `text/body`, lidos no modo brand. Sobre página clara ou escura a barra sai igual. Os botões deixam o `tone="inverse"`: Salvar é `tone="action"` (fill) e Descartar `tone="neutral" variant="ghost"`, lidos na chapa. Numa marca clara (um ciano, por exemplo) o texto e os botões seguem o contraste da chapa, em vez do branco fixo do inverse.
- **Novo:** `onDetails`, `detailsLabel` (padrão "Ver o que falta"), `detailsExpanded` e `detailsControls` (o `showDetails` do Figma). Com `onDetails` em `status="unsaved"`, no arranjo compacto (abaixo de 1024) a mensagem vira um botão com chevron para cima que abre o painel do que falta (um Drawer); o nome acessível é a mensagem seguida de `detailsLabel`, com `aria-expanded` e `aria-controls`. Hover sublinha, o foco desenha o anel `savingbar/focus/ring` (novo token, `focus/ring` na chapa), e a área de toque tem 44 de altura sem mudar o desenho. No expandido a mensagem continua texto.
- **Drawer:** a altura vem do conteúdo até 85% da tela (`85dvh`, antes `100dvh - 48`); passou disso, só o conteúdo rola por dentro (`overscroll-behavior: contain`), e alça, título e rodapé ficam parados.
- **Dialog, Sheet e Drawer controlados sem `trigger`:** ao fechar, o foco volta para o elemento que tinha o foco quando abriram (o botão de detalhes da SavingBar, por exemplo). Antes ia para o `body`.
