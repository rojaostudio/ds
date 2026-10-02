'use client';

import {
  createContext,
  useContext,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { warnIfUnlabelled } from './internal/field';
import { OptionContent } from './internal/option-content';

interface ListboxContextValue {
  selected: string | undefined;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  choose: (value: string) => void;
}

const ListboxContext = createContext<ListboxContextValue | null>(null);

export interface ListboxProps extends Omit<ComponentPropsWithRef<'ul'>, 'children' | 'defaultValue' | 'onChange'> {
  /** The ListboxOptions (Figma: the slot `options`). */
  children: ReactNode;
  /** Controlled: the chosen option's value. */
  value?: string;
  /** Uncontrolled: the option chosen at first. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

/**
 * Listbox — Figma [RDS] Forms/Listbox. A list of options always on screen, one choice, marked with a check
 * (role listbox). The list takes the focus: the arrows move the active option past disabled ones, Home and End
 * go to the ends, Enter or Space choose. It is the list the Select and the Combobox open; on its own, for a
 * short list that should stay visible (a panel, a sidebar filter). Name it with aria-label or aria-labelledby.
 * Styles: internal/listbox.css.
 */
export function Listbox({ children, value, defaultValue, onValueChange, className, onKeyDown, onFocus, ref, ...rest }: ListboxProps) {
  warnIfUnlabelled('Listbox', undefined, rest['aria-label'], rest['aria-labelledby']);
  const [own, setOwn] = useState(defaultValue);
  const selected = value !== undefined ? value : own;
  const [activeId, setActiveId] = useState<string | null>(null);
  const list = useRef<HTMLUListElement | null>(null);

  const options = () =>
    Array.from(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []).filter(
      (o) => o.getAttribute('aria-disabled') !== 'true',
    );

  function choose(next: string) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  function activate(option: HTMLElement | undefined) {
    if (!option) return;
    setActiveId(option.id);
    option.scrollIntoView({ block: 'nearest' });
  }

  function keyDown(event: KeyboardEvent<HTMLUListElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const all = options();
    const index = all.findIndex((o) => o.id === activeId);
    const moves: Record<string, () => HTMLElement | undefined> = {
      ArrowDown: () => all[Math.min(index + 1, all.length - 1)],
      ArrowUp: () => all[Math.max(index - 1, 0)],
      Home: () => all[0],
      End: () => all[all.length - 1],
    };
    if (moves[event.key]) {
      event.preventDefault();
      activate(moves[event.key]());
    } else if ((event.key === 'Enter' || event.key === ' ') && index >= 0) {
      event.preventDefault();
      choose(all[index].dataset.value ?? '');
    }
  }

  function setRef(node: HTMLUListElement | null) {
    list.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }

  return (
    <ListboxContext.Provider value={{ selected, activeId, setActiveId, choose }}>
      <ul
        tabIndex={0}
        {...rest}
        ref={setRef}
        role="listbox"
        aria-activedescendant={activeId ?? undefined}
        className={['rds-listbox', className].filter(Boolean).join(' ')}
        onKeyDown={keyDown}
        onFocus={(event) => {
          onFocus?.(event);
          // Entering the list, the active option is the chosen one, or the first.
          if (activeId && document.getElementById(activeId)) return;
          const all = options();
          activate(all.find((o) => o.dataset.value === selected) ?? all[0]);
        }}
      >
        {children}
      </ul>
    </ListboxContext.Provider>
  );
}

export interface ListboxOptionProps {
  /** The value it stands for. */
  value: string;
  /** The option text (Figma: `text`). */
  children: ReactNode;
  /** An icon before the text (Figma: `showIcon` + `icon`). Decorative. */
  icon?: ReactNode;
  /** Cannot be chosen now: skipped by the arrows, read as unavailable. */
  disabled?: boolean;
}

/** One option of the Listbox (Figma: .listbox/option). The chosen one gets the tint and the check. */
export function ListboxOption({ value, children, icon, disabled }: ListboxOptionProps) {
  const context = useContext(ListboxContext);
  const id = useId();
  if (!context) throw new Error('[@rojaostudio/ds] ListboxOption goes inside a Listbox.');
  const selected = context.selected === value;
  return (
    <li
      id={id}
      role="option"
      data-value={value}
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      data-active={context.activeId === id ? '' : undefined}
      className="rds-listbox__option"
      // mousemove, not mouseenter: a list that appears under a still cursor must not move the active option.
      onMouseMove={() => !disabled && context.activeId !== id && context.setActiveId(id)}
      onClick={() => {
        if (disabled) return;
        context.setActiveId(id);
        context.choose(value);
      }}
    >
      <OptionContent icon={icon} selected={selected}>
        {children}
      </OptionContent>
    </li>
  );
}
