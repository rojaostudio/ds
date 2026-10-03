---
"@rojaostudio/ds": patch
---

SavingBar volta para a cor primária da marca (sai da chapa), como no Figma [RDS] (03/10).

- **Muda aparência.** A barra não leva mais `.ds-plate`: `savingbar/background` é `colors/primary/default` e `savingbar/text` é `text/on/primary` (texto, alerta de erro, chevron e loader), no tema claro e no escuro, em todas as marcas. O anel de foco `savingbar/focus/ring` passa a `text/on/primary`.
- **Botões:** continuam o mesmo Button, Salvar `tone="action"` (fill) e Descartar `tone="neutral" variant="ghost"`, com as cores da barra pelos tokens novos `savingbar/button/fill/background` (`text/on/primary`), `savingbar/button/fill/label` (`colors/primary/default`) e `savingbar/button/ghost/label` (`text/on/primary`). Hover do Salvar: o fundo a 85% sobre a barra; hover do Descartar: a cor do rótulo a 15%; desabilitado (`status="saving"`): 40% sobre a barra. Numa marca de primário claro (um ciano, por exemplo) o `text/on/primary` escolhido por contraste vale para o texto e para o fundo do Salvar.
