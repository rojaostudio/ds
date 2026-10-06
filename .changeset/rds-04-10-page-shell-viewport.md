---
"@rojaostudio/ds": minor
"@rojaostudio/ds-codemod": patch
---

**BREAKING.** **PageShell:** as margens e a largura vêm do modo viewport do Figma [RDS] de 04/10/2026 (coleções `breakpoint` e `viewport` do Base Tokens).

- `maxWidth` fica com `narrow` (768, `layout/form/max-width`, para formulário e leitura) e `wide` (1536). **Sai `default` (1280); o padrão passa a ser `wide`.** O codemod marca `maxWidth="default"` como manual.
- **Muda aparência:** sem `maxWidth`, a página vai até 1536 (antes 1280). A margem acima e abaixo segue `layout/content/padding-y` (16 no celular, 24 a partir de 640, 32 a partir de 1024; antes era 24 fixo) e a lateral segue `layout/content/padding-x` (16, 24 a partir de 640, 32 a partir de 1024 e 48 a partir de 1536).
- Tokens novos em `foundation.css`: `--layout-content-padding-x`, `--layout-content-padding-y` e `--layout-form-max-width`, com uma media query por breakpoint. O build só emite os `layout/*` que alguma folha de estilo lê.
- A extração do Figma passa a gravar `ds-core/figma/viewport.txt` (breakpoints e o valor de cada variável por modo).
