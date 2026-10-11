---
'@rojaostudio/ds': patch
---

ChipInput, NumberInput and the multiple Combobox: the box keeps its own padding and gap again. The shared field rule (same specificity, later in the stylesheet) overrode them, so the ChipInput's Chips touched the border (padding 0 instead of 4 on top, 8 on the left; rows 8 apart instead of 4).
