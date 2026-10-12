---
"@rojaostudio/ds": minor
---

Error for choice groups and required lists (ds#145, ds#146), for the "send it empty" rule:
- `ChoiceCardGroup`: `required`, `error`, `errorMessage`. The unchosen cards take the error border; one message under the group, tied by aria-describedby; aria-invalid on the fieldset.
- `ToggleGroup`: `error`, `errorMessage`. The items that are not on take the error border (ghost included); the message follows the group.
- `Empty`: `errorMessage`, for a required list left empty. The Tile turns danger; the Empty gets aria-invalid and tabindex -1.
- New `focusFirstInvalid(form)`: focuses the first element with aria-invalid, handing a group's focus to its chosen item.
- Component tokens: `choice-card/container/border/error`, `choice-card/group/required`, `choice-card/group/error-message`, `toggle/border/error`, `toggle-group/error-message`, `empty/error-message`, `empty/error-ring`.
