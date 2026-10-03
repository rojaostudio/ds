---
"@rojaostudio/ds": patch
---

DataTableHeader e SavingBar: o arranjo compacto volta a seguir a largura da tela (abaixo de 1024), como o modo viewport do Figma (`layout/compact`). Na next.18 ele seguia a largura da própria barra, e uma lista com Sidebar numa tela de 1280 caía no compacto no desktop.
