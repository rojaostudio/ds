---
'@rojaostudio/ds': minor
---

Dialog e AlertDialog viram sheet ancorado embaixo no compacto (abaixo de 1024), com a mesma API (#45). Figma [RDS] 06/10: pelo modo viewport, sem variante.

- **Dialog**: encosta embaixo, com a largura da tela até 560 em qualquer `size`; ganha a alça (arrastar para baixo fecha), sobe acima do teclado da tela e respeita a área segura. O Cancelar padrão sai (fecham a alça, o véu, o Escape e o ×) e a ação ocupa a largura. Um `footer` próprio empilha em largura cheia, o último (a ação principal) em cima.
- **AlertDialog**: também vira sheet, sem alça e sem fechar no véu; as duas ações ficam, em largura cheia, a de confirmar em cima. O foco continua abrindo no Cancelar.
- **Drawer**: o rodapé passa a respeitar a área segura (`env(safe-area-inset-bottom)`).
- Token novo `--dialog-handle`.
