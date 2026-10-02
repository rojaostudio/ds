// The listbox behind a field that keeps the focus (Combobox): which option is active, the arrows that move it
// past disabled options, Enter that chooses it, and the ids for aria-activedescendant. Not exported.
// Selection is a list of values, so the same logic serves one choice or many (aria-multiselectable).
import { useId, useState, type KeyboardEvent } from 'react';

export interface ListboxItem {
  value: string;
  disabled?: boolean;
}

export interface UseListboxOptions<T extends ListboxItem> {
  /** The options on screen, in order (already filtered). */
  items: T[];
  /** Whether the list is showing: Enter chooses only then. */
  showing: boolean;
  /** The chosen values. One choice is a list of one. */
  selected: string[];
  /** Many choices at once: the list gets aria-multiselectable. */
  multiple?: boolean;
  /** The arrows open the list. */
  onOpen: () => void;
  /** Enter or a click on an enabled option. */
  onChoose: (item: T) => void;
}

/** Adds the value when absent, removes it when present: the toggle of a multiple listbox. */
export function toggleValue(selected: string[], value: string) {
  return selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
}

export function useListbox<T extends ListboxItem>({ items, showing, selected, multiple, onOpen, onChoose }: UseListboxOptions<T>) {
  const listId = useId();
  const [active, setActive] = useState(-1);
  const optionId = (index: number) => `${listId}-${index}`;
  const isSelected = (value: string) => selected.includes(value);

  const choose = (item: T) => {
    if (item.disabled) return;
    onChoose(item);
  };

  const move = (step: 1 | -1) => {
    if (!items.length) return;
    // From no active option, Down starts at the first and Up at the last.
    let next = active < 0 && step < 0 ? items.length : active;
    for (let i = 0; i < items.length; i++) {
      next = (next + step + items.length) % items.length;
      if (!items[next].disabled) break;
    }
    onOpen();
    setActive(next);
    document.getElementById(optionId(next))?.scrollIntoView({ block: 'nearest' });
  };

  /** Handles ArrowDown, ArrowUp and Enter; returns false for any other key, for the field to handle. */
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Enter' && showing && active >= 0 && items[active]) {
      event.preventDefault();
      choose(items[active]);
    } else {
      return false;
    }
    return true;
  };

  /** Props for the element that keeps the focus (the combobox input). */
  const controlProps = {
    'aria-expanded': showing,
    'aria-controls': showing ? listId : undefined,
    'aria-activedescendant': showing && active >= 0 ? optionId(active) : undefined,
  };

  const listProps = {
    id: listId,
    role: 'listbox' as const,
    'aria-multiselectable': multiple || undefined,
  };

  const optionProps = (item: T, index: number) => ({
    id: optionId(index),
    role: 'option' as const,
    'aria-selected': isSelected(item.value),
    'aria-disabled': item.disabled || undefined,
    'data-active': index === active ? '' : undefined,
    // The focus stays in the field: pressing an option must not blur it.
    onMouseDown: (event: { preventDefault: () => void }) => event.preventDefault(),
    // mousemove, not mouseenter: a list that opens under a still cursor must not move the active option.
    onMouseMove: () => !item.disabled && index !== active && setActive(index),
    onClick: () => choose(item),
  });

  return { listId, active, setActive, move, choose, isSelected, onKeyDown, controlProps, listProps, optionProps };
}
