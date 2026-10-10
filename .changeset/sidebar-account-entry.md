---
"@rojaostudio/ds": patch
---

Sidebar: o item do bloco account já é do produto, pelo `footer` (#53). A documentação do `footer` passa a dizer isso: SidebarItems com ícone, rótulo, `href` e `current` próprios ("Plano e consumo" em /billing, "Sair"), cujo `href` conta para o `currentPath` como o de qualquer item e que no trilho guardam o nome no Tooltip. Testes novos cobrem a rota marcando o item do rodapé como página atual, o `current` dele e o trilho.
