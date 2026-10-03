---
"@rojaostudio/ds": minor
---

Toast com ação não some mais sozinho (WCAG 2.2.1, Timing Adjustable). Antes ficava 6 s; agora, com `action` e sem `duration`, fica na tela até a pessoa usar a ação ou o ×. Sem ação, continua 5 s. Uma `duration` explícita ainda vale, também com ação; dê uma só quando a ação puder ser feita por outro caminho.

O `Toaster` ganha `closeLabel`, o nome acessível (e o Tooltip) do × de todos os toasts. Padrão "Fechar", que antes era fixo.

**Breaking:** quem contava com o toast de ação fechando sozinho em 6 s passa a ver o toast até fechá-lo; para o comportamento antigo, passe `duration: 6000`.
