const FOCUSABLE =
  'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]';

/**
 * focusFirstInvalid — the "send it empty" rule (ds#145): after validating on submit, every required field shows its
 * error at once and the focus goes to the FIRST one. Looks inside `root` (the form) for the first element with
 * aria-invalid="true", in page order: a field takes the focus itself; a group (RadioGroup, ChoiceCardGroup,
 * ToggleGroup) hands it to its chosen item, else to the one in the tab order, else to the first; an Empty with
 * `errorMessage` takes it on itself. Returns the element focused, or null when nothing is invalid.
 */
export function focusFirstInvalid(root: ParentNode = document): HTMLElement | null {
  const invalid = root.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (!invalid) return null;
  const target = invalid.matches(FOCUSABLE) ? invalid : pickInside(invalid);
  target.focus();
  return target;
}

function pickInside(group: HTMLElement): HTMLElement {
  return (
    group.querySelector<HTMLElement>('input:checked:not([disabled])') ??
    group.querySelector<HTMLElement>('[tabindex="0"]') ??
    group.querySelector<HTMLElement>(FOCUSABLE.replace(', [tabindex]', ', [tabindex]:not([tabindex="-1"])')) ??
    group
  );
}
