---
"@rojaostudio/ds": minor
---

FieldGroup e FieldGroupSeparator (ds#147): campos curtos que formam um valor só (largura × altura, de – até) num `<fieldset>` com uma legend e um erro. O erro do grupo pinta todos os campos (menos o que receber `error={false}`), a mensagem sai uma vez embaixo do conjunto e vai por `aria-describedby` a cada campo em erro; dentro do grupo o campo nunca desenha mensagem própria. `focusFirstInvalid` cai no primeiro campo errado do grupo.
