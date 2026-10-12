---
"@rojaostudio/ds": minor
---

Combobox, ChipInput and TimePicker lists in a floating layer (ds#157): portaled over everything, so a Card's overflow never cuts them and a sticky bar (SavingBar, FormActions) never covers them. Below the field when it fits, above when it doesn't, and shrinking to the room there is (scrolling inside) when neither side has it; the BottomBar counts as the foot of the useful area. The page never grows nor scrolls because of the list. Inside a modal, the layer goes above it.
