---
'@rojaostudio/ds': minor
---

DateRangePicker e Calendar em intervalo, como no Figma [RDS] de 10/10 (#42, item 4).

- **Calendar** ganha `mode="single" | "range"` (single é o padrão; tipos `CalendarSingleProps`, `CalendarRangeProps` e `DateRange`). No range, a primeira escolha é o início e a segunda o fim (um dia anterior troca os dois; a terceira recomeça), e `onValueChange` recebe `{ from, to }`. O dia em range é start, middle ou end: start e end são a chapa de selecionado, middle é só a faixa contínua, sem cantos. Todos os dias do intervalo ficam `aria-selected` e as pontas dizem isso no nome ("1 de outubro de 2026, início do período").
- **DateRangePicker** novo: `value={{ from, to }}`, `onValueChange` (só com o intervalo inteiro) e `presets` (padrão Hoje, Últimos 7 dias, Este mês e Mês passado, de `dateRangePresets(today)`; aceita presets próprios `{ label, range }`). O campo mostra o intervalo; o painel abre com os presets à esquerda (escolha única, com o check, como o DropdownMenuRadioItem) e o Calendar em range. No compacto (abaixo de 1024) o painel vira o sheet do Dialog, com os presets como FilterChips no topo e o Calendar embaixo.
- Teclado: os presets são um listbox (setas movem, Enter ou Espaço escolhem), Tab leva ao calendário, Escape fecha sem mudar. O intervalo escolhido é anunciado ("Período escolhido: de … a …") e fica na descrição do campo; o início escolhido no calendário é anunciado dentro do painel.
- Token novo: `--calendar-day-background-range` (surface/tint/default).
