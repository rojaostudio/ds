---
"@rojaostudio/ds": patch
---

FormActions e SavingBar saem do caminho do teclado do celular, como o Figma [RDS] pede nas duas specs ("Com o teclado do celular aberto (foco num campo), o pé some; volta no blur"). A promessa já estava no JSDoc do FormActions, mas não havia implementação.
- Novo hook interno `useOnScreenKeyboard` (`components/internal/`), sem dependência nova: só no compacto (`max-width: 1023px`), com um campo editável em foco (texto, textarea ou contenteditable; checkbox, rádio e afins não contam) e a área visível (`visualViewport`, corrigida pelo zoom) abaixo de 75% da `innerHeight`. Mede um quadro depois de `resize` do visualViewport, `focusin`/`focusout` e da troca de faixa da tela. No servidor e sem `visualViewport` a barra fica.
- FormActions `bar` e `stacked` (o pé da tela) e a SavingBar ganham `rds-form-actions--keyboard` / `rds-savingbar--keyboard`: descem (`translateY(100%)`) e ficam `visibility: hidden` ao fim da descida, fora da ordem de Tab e da árvore de acessibilidade; voltam quando o teclado fecha ou no blur. O foco nunca é movido. `inline` não muda.
- A transição (`motion/duration/base`, saída `motion/easing/exit`, volta `motion/easing/enter`) só existe com `prefers-reduced-motion: no-preference`; com `reduce` a barra some e volta sem animação.
- FormActions passa a ser `'use client'` (usa o hook).
