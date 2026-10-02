---
"@rojaostudio/ds": minor
---

Button e IconButton ganham `size` (`sm` 36, `md` 44, `lg` 52; padrão `md`), e o Button ganha `iconPosition` (`start` | `end`; padrão `end`), como no Figma [RDS].

- As medidas saem dos 24 tokens novos `--button-size-<sm|md|lg>-*` (coleção Actions).
- A área de toque é 44 × 44 em todos os tamanhos: no `sm`, uma camada invisível estende o toque em `@media (pointer: coarse)`, sem mexer no layout nem no anel de foco.
- Sem mudança de aparência para quem não passa `size`: o padrão `md` é o botão de antes.
