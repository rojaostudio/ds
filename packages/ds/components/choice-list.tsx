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

interface ChoiceListContextValue {
  selected: string | undefined;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  choose: (value: string) => void;
}

const ChoiceListContext = createContext<ChoiceListContextValue | null>(null);

export interface ChoiceListProps extends Omit<ComponentPropsWithRef<'ul'>, 'children' | 'defaultValue' | 'onChange'> {
  /** The ChoiceListItems (Figma: the slot `items`). */
  children: ReactNode;
  /** Controlled: the chosen row's value. */
  value?: string;
  /** Uncontrolled: the row chosen at first. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

/**
 * ChoiceList — Figma [RDS] Content/ChoiceList. A dense list to choose one thing from: a client, a product, an
 * order. Each row is media, a title, a muted description and a trailing value; a line under each row, dozens on
 * screen. One chosen at a time, marked by the tint and a bar on the left (role listbox, aria-selected). The list
 * takes the focus: the arrows move the active row past disabled ones, Home and End go to the ends, Enter or Space
 * choose, a click chooses. Name it with aria-label or aria-labelledby. Styles: choice-list.css.
 *
 * Not for 2 to 4 options that need an explanation (ChoiceCard), nor for a list that only shows (Item).
 */
export function ChoiceList({ children, value, defaultValue, onValueChange, className, onKeyDown, onFocus, ref, ...rest }: ChoiceListProps) {
  warnIfUnlabelled('ChoiceList', undefined, rest['aria-label'], rest['aria-labelledby']);
  const [own, setOwn] = useState(defaultValue);
  const selected = value !== undefined ? value : own;
  const [activeId, setActiveId] = useState<string | null>(null);
  const list = useRef<HTMLUListElement | null>(null);

  const rows = () =>
    Array.from(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []).filter(
      (o) => o.getAttribute('aria-disabled') !== 'true',
    );

  function choose(next: string) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  function activate(row: HTMLElement | undefined) {
    if (!row) return;
    setActiveId(row.id);
    row.scrollIntoView({ block: 'nearest' });
  }

  function keyDown(event: KeyboardEvent<HTMLUListElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const all = rows();
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
    <ChoiceListContext.Provider value={{ selected, activeId, setActiveId, choose }}>
      <ul
        tabIndex={0}
        {...rest}
        ref={setRef}
        role="listbox"
        aria-activedescendant={activeId ?? undefined}
        className={['rds-choice-list', className].filter(Boolean).join(' ')}
        onKeyDown={keyDown}
        onFocus={(event) => {
          onFocus?.(event);
          // Entering the list, the active row is the chosen one, or the first.
          if (activeId && document.getElementById(activeId)) return;
          const all = rows();
          activate(all.find((o) => o.dataset.value === selected) ?? all[0]);
        }}
      >
        {children}
      </ul>
    </ChoiceListContext.Provider>
  );
}

export interface ChoiceListItemProps {
  /** The value it stands for. */
  value: string;
  /** The name, one line (Figma: `title`). It is the row's accessible name. */
  title: ReactNode;
  /** One muted line under the title (Figma: `showDescription` + `description`). */
  description?: ReactNode;
  /** An Avatar for a person, a Tile for a thing, 32 (Figma: `showMedia` + `media`). Decorative: hidden from screen readers. */
  media?: ReactNode;
  /** A value or a date on the right (Figma: `showTrailing` + `trailing`). */
  trailing?: ReactNode;
  /** Cannot be chosen now: skipped by the arrows, read as unavailable. */
  disabled?: boolean;
}

/** One row of the ChoiceList (Figma: .choice-list/item). The whole row is the target. */
export function ChoiceListItem({ value, title, description, media, trailing, disabled }: ChoiceListItemProps) {
  const context = useContext(ChoiceListContext);
  const id = useId();
  if (!context) throw new Error('[@rojaostudio/ds] ChoiceListItem goes inside a ChoiceList.');
  const selected = context.selected === value;
  const describedBy = [description != null && `${id}-description`, trailing != null && `${id}-trailing`].filter(Boolean).join(' ');
  return (
    <li
      id={id}
      role="option"
      data-value={value}
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      aria-labelledby={`${id}-title`}
      aria-describedby={describedBy || undefined}
      data-active={context.activeId === id ? '' : undefined}
      className="rds-choice-list__item"
      onClick={() => {
        if (disabled) return;
        context.setActiveId(id);
        context.choose(value);
      }}
    >
      {media != null && (
        <span className="rds-choice-list__media" aria-hidden="true">
          {media}
        </span>
      )}
      <span className="rds-choice-list__content">
        <span id={`${id}-title`} className="rds-choice-list__title">
          {title}
        </span>
        {description != null && (
          <span id={`${id}-description`} className="rds-choice-list__description">
            {description}
          </span>
        )}
      </span>
      {trailing != null && (
        <span id={`${id}-trailing`} className="rds-choice-list__trailing">
          {trailing}
        </span>
      )}
    </li>
  );
}
