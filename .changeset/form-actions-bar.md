---
"@rojaostudio/ds": minor
---

FormActions ganha `layout="bar"`, o pé da criação, como no Figma [RDS] (03/10). Aditivo: `inline` e `stacked` seguem iguais.

- **Novo:** `layout="bar"`, o mesmo esqueleto da SavingBar, mas neutro: fundo `form-actions/bar/background` (`surface/page`) com a linha fina `form-actions/border` em cima, nunca a cor da marca (essa é sinal da SavingBar, na edição). A partir de 1024 é uma faixa de 68 (12 24), a frase de apoio à esquerda e Cancelar + primário à direita. Abaixo de 1024 (pela largura da tela, o mesmo corte da SavingBar) é uma linha de 64 mais a área segura: a frase (até 2 linhas) à esquerda e só o primário (o último filho) à direita. No celular o Cancelar sai do pé: a saída é o voltar ou X da topbar, com "Sair sem criar?" se houver algo digitado, e ele pode ir também no rodapé do Drawer.
- **Novo:** `onDetails`, `detailsLabel` (padrão "Ver o que falta"), `detailsExpanded` e `detailsControls` (o `showDetails` do Figma), como na SavingBar. Com `onDetails` no `bar` compacto, a frase vira um botão com chevron para cima que abre o que falta (um Drawer); o nome acessível é a frase seguida de `detailsLabel`, com `aria-expanded` e `aria-controls`. Hover sublinha, o foco desenha o anel `form-actions/focus/ring` (novo token, `focus/ring`), e a área de toque tem 44 de altura.
- **Muda:** a frase de apoio (`helper`) passa a ser `<p role="status">` em todos os layouts: quando muda, é anunciada sem mover o foco.
- **Tokens novos:** `form-actions/bar/background` e `form-actions/focus/ring`.
