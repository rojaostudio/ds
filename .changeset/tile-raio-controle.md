---
"@rojaostudio/ds": patch
---

Tile deixa de ser círculo no tema padrão e segue o raio dos controles da marca: o token novo `tile/radius` aponta para `radius/control` (8 no tema rojao; antes era `radius/full` fixo). O mesmo vale para a chapa de ícone do FileInput dropzone (o ícone de upload e o clipe do arquivo escolhido), com o token novo `file-input/area/icon-radius` → `radius/control`. Uma marca com outro `radius/control` muda os cantos dos dois. O Avatar de pessoa continua círculo.
