---
'@rojaostudio/ds': minor
---

Stat ganha `inverse` e Delta ganha `tone="inverse"`, como no Figma [RDS] de 10/10.

- **Stat** `<Stat framed inverse>` (só com `framed`, `tone="neutral"` e sem `muted`; fora disso é ignorado, com aviso no console): fundo `stat/inverse/background` (surface/inverse), valor em `stat/inverse/value` (text/on-inverse), rótulo e legenda em `stat/inverse/label` (text/on-inverse-subtle). O Delta dentro dele vira inverse sozinho, qualquer que seja o tom. Legível (≥ 4,5:1) no claro, no escuro e na impressão.
- **Delta** `tone="inverse"`: seta e valor em `delta/inverse` (text/on-inverse), para um fundo escuro.
- Tokens novos: `--stat-inverse-background`, `--stat-inverse-value`, `--stat-inverse-label` e `--delta-inverse`.
