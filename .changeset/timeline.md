---
'@rojaostudio/ds': minor
---

`Timeline`, `TimelineDay` e `TimelineItem`: o histórico de um registro, quem fez o quê e quando, agrupado por dia (item 3 da #42). Figma [RDS] 07/10: Content/Timeline.

- Cada dia é uma `<ol>` nomeada pelo rótulo, que é um `<h3>` ("Hoje", "06/10") em peso de subtítulo, com 24 de respiro em cima; cada hora é um `<time dateTime>`.
- O item: Avatar sm com anel e a linha até o próximo (some no último do dia), ator em medium e ação na mesma linha, a hora numa coluna de 48 à direita (caption) e a mudança opcional ("Aberto → Em produção").
- Tokens novos `--timeline-line`, `--timeline-actor`, `--timeline-action`, `--timeline-meta`, `--timeline-day` e `--timeline-avatar-border`.
