---
'@rojaostudio/ds': minor
---

Sidebar `header="logo"`: o cabeçalho tem 64 (8 em cima e embaixo) e o `logo` mantém a proporção dele, até 48 de altura e nunca mais largo que o cabeçalho (`max-height: 48px; max-width: 100%`; a largura fica com o produto, ex. `<img width={100}>`); logo muito horizontal fica limitado pela largura e sai mais baixo. No Figma [RDS] de 07/10 o logo virou slot.
