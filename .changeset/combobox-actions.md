---
"@rojaostudio/ds": minor
---

Combobox `actions` (ds#181): actions at the foot of the list, for when the search does not find the item ("Criar novo", "Lançar item livre"). They are fixed under the options that scroll, as options of a named group (`actionsLabel`, default "Ações") at the end of the listbox. The arrows reach them after the last option, Enter chooses (`onSelect` gets the typed text) and the list closes, with no Tab; Left and Right stay in the text. They show also with the field empty and when nothing matches, after the empty message, with the first one already active. The create option (`creatable`) now sits first in the same fixed group, with the same look. In Figma, the Listbox gains `showActions` and the `actions` slot, and the Combobox exposes its listbox.
