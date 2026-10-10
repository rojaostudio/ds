---
"@rojaostudio/ds": minor
---

DropdownMenuRadioItem segue o `.menu/radio-item` do Figma (#53): o check vai para uma coluna de 20 antes do rótulo, reservada em todas as opções, e os rótulos ficam alinhados com e sem o check (os idiomas de um UserMenu, um filtro). Antes o check vinha à direita e só existia na opção marcada. `DropdownMenuRadioGroup` e `DropdownMenuRadioItem` continuam públicos, com `role="menuitemradio"` e `aria-checked` pelo primitivo do Radix.
