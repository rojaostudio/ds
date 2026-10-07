---
'@rojaostudio/ds': minor
---

`Timeline`, `TimelineDay` e `TimelineItem`: o histórico de um registro, quem fez o quê e quando, agrupado por dia (item 3 da #42). Figma [RDS] 07/10: Content/Timeline.

- Cada dia é uma `<ol>` nomeada pelo rótulo ("Hoje", "06/10"); cada hora é um `<time dateTime>`.
- O item: Avatar sm e a linha até o próximo (some no último do dia), ator em medium, ação, hora em caption e a mudança opcional ("Aberto → Em produção").
- Tokens novos `--timeline-line`, `--timeline-actor`, `--timeline-action` e `--timeline-meta`.
