---
"@rojaostudio/ds": minor
"@rojaostudio/ds-codemod": patch
---

**PageHeader:** `back` e `help`, como no Figma de 04/10/2026 (`showBack` e `showHelp`).

- `back?: { href; label }`: o caminho de volta à página-mãe. É um link (nunca `history.back`), um IconButton neutral ghost com seta para a esquerda, `aria-label` "Voltar para {label}" e Tooltip com o nome da mãe. Fica numa faixa da altura da linha do título (`type/heading/line`, 30), centrado nela mesmo com descrição, a 8 do título, e não muda de lugar no celular. Use da segunda tela em diante, nunca na primeira. Não depende do Breadcrumb.
- `help?: { label; onClick?; href? }`: a ajuda da tela. É um IconButton neutral ghost com ponto de interrogação (`circle-question-mark`) e Tooltip (`label`, ex.: "Como funciona"), ao lado do título, com `aria-label` "{label}: {título}". Com `onClick` é um botão (abre a ajuda, ex.: um Sheet); com `href`, um link.
- **Muda aparência:** o cabeçalho vira uma linha (voltar e texto). A linha do título passa a ter a altura de `type/heading/line`, com `align-items: center`, e nem o voltar nem a ajuda acrescentam altura (o botão de 44 transborda por igual). Sem `back` e sem `help`, nada muda na tela, mas o título e a descrição passam a ficar dentro de `.rds-page-header__text` e `.rds-page-header__title-row`: quem estiliza por classe precisa rever os seletores.
- Tipos novos no barril: `PageHeaderBack` e `PageHeaderHelp`. O codemod passa a reconhecer os dois como nomes do 2.0.
