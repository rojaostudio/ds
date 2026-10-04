---
"@rojaostudio/ds": patch
---

FormActions ganha `showHelper`, como no Figma [RDS] (Histórico 03/10, "helper × detalhes"). Aditivo: o padrão é `true`, e quem não passa nada vê o mesmo de antes.

- **Novo:** `showHelper?: boolean` (padrão `true`) controla só o texto estático da frase de apoio: no expandido aparece com `showHelper && helper`, no compacto com `showHelper && helper && !onDetails`. Sem `onDetails`, `showHelper={false}` tira a frase de vez, em qualquer layout.
- **Muda:** no `layout="bar"` com `onDetails`, o compacto (abaixo de 1024) mostra sempre o botão de detalhes com o texto de `helper` e o chevron, mesmo com `showHelper={false}`. É o pé da criação: `<FormActions layout="bar" helper="Falta preço e prazo" showHelper={false} onDetails={…}>` fica só Cancelar + primário em 1280 (o checklist está na coluna da direita) e "Falta preço e prazo ˄" + primário em 390.
- **Acessibilidade:** o `role="status"` continua anunciando as mudanças da frase também quando ela não está na tela: com `showHelper={false}` e `onDetails`, uma cópia visualmente oculta dentro do mesmo status responde no expandido, e no compacto quem responde é o botão. Só uma das formas fica na árvore de acessibilidade por vez, então a mudança é dita uma vez.
