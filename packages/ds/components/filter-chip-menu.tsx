'use client';

import { useState, type ComponentPropsWithRef } from 'react';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuSeparator } from './dropdown-menu';
import { filterChipClassName } from './filter-chip';
import { blockWhenDisabled } from './internal/button';
import { ChevronDownIcon } from './internal/icons';

export interface FilterChipMenuOption {
  value: string;
  /** What the option is called, in the menu and on the pill ("Laser"). */
  label: string;
  /** How many items it holds, on the right of the option (Figma: `showCount` + `count`). */
  count?: number;
  disabled?: boolean;
}

export interface FilterChipMenuProps
  extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'value' | 'defaultValue' | 'onChange'> {
  /** The category ("Processo"): the pill reads "Processo: Todos", "Processo: Laser" or "Processo · 2". */
  label: string;
  /** The options, one ticked item each in the menu. Their values are unique. */
  options: FilterChipMenuOption[];
  /** Controlled: the ticked values. */
  value?: string[];
  /** Uncontrolled: ticked at first. */
  defaultValue?: string[];
  /** Called with the ticked values, in the order of `options`. */
  onValueChange?: (value: string[]) => void;
  /** The pill's value with nothing ticked. */
  allLabel?: string;
  /** The last item, which unticks everything and closes. */
  clearLabel?: string;
  /** Rendered as aria-disabled="true", as the FilterChip: stays in the tab order, does not open. */
  disabled?: boolean;
  /** Where the menu lines up with the pill. */
  align?: 'start' | 'end';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** How many ticked names the accessible name spells out before "e mais N". */
const NAMED = 3;

/**
 * FilterChipMenu — Figma [RDS] Forms/FilterChipMenu. A filter on a category with many options, in a list's bar (the
 * DataTableHeader's quickFilters): a pill drawn as the FilterChip, with a chevron, that opens a menu of ticked options
 * (DropdownMenu, menuitemcheckbox) with their counts and Limpar at the end. Closed it reads the value ("Processo:
 * Todos", "Processo: Laser", "Processo · 2") and is on while something is ticked. Ticking keeps the menu open; Limpar
 * unticks everything, closes and gives the focus back to the pill. The button carries aria-haspopup="menu" and
 * aria-expanded (no aria-pressed: on is drawn, and the value is in its name). Styles: filter-chip.css,
 * filter-chip-menu.css and internal/menu.css.
 */
export function FilterChipMenu({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  allLabel = 'Todos',
  clearLabel = 'Limpar',
  disabled,
  align = 'start',
  open,
  defaultOpen,
  onOpenChange,
  className,
  onClick,
  type = 'button',
  ...rest
}: FilterChipMenuProps) {
  const [own, setOwn] = useState<string[]>(defaultValue ?? []);
  const current = value ?? own;
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  const isOpen = open ?? ownOpen;

  const known = new Set(options.map((o) => o.value));
  const ticked = options.filter((o) => current.includes(o.value));
  const on = ticked.length > 0;

  const emit = (next: string[]) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };
  const toggle = (option: string, checked: boolean) => {
    const set = new Set(current);
    if (checked) set.add(option);
    else set.delete(option);
    // The known ones in the order of the options, then the unknown kept as they came (the options may be loading).
    emit([...options.map((o) => o.value).filter((v) => set.has(v)), ...current.filter((v) => !known.has(v) && set.has(v))]);
  };
  const setOpen = (next: boolean) => {
    if (next && disabled) return;
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };

  const text =
    ticked.length === 0 ? `${label}: ${allLabel}` : ticked.length === 1 ? `${label}: ${ticked[0].label}` : `${label} · ${ticked.length}`;
  const names = ticked.map((o) => o.label);
  const spelled = names.length > NAMED ? `${names.slice(0, NAMED).join(', ')} e mais ${names.length - NAMED}` : names.join(', ');
  // With two or more, the pill shows only the number: the name starts with what is seen and adds who.
  const name = ticked.length > 1 ? `${text}: ${spelled}` : undefined;

  return (
    <DropdownMenu
      aria-label={label}
      align={align}
      open={isOpen}
      onOpenChange={setOpen}
      trigger={
        <button
          {...rest}
          type={type}
          className={filterChipClassName(on, ['rds-filter-chip-menu', className].filter(Boolean).join(' '))}
          aria-label={name}
          aria-disabled={disabled || undefined}
          onClick={blockWhenDisabled(disabled, onClick)}
          onKeyDown={(event) => {
            rest.onKeyDown?.(event);
            // Radix opens on Enter, Space and ArrowDown before the click: hold them while disabled.
            if (disabled && ['Enter', ' ', 'ArrowDown'].includes(event.key)) event.preventDefault();
          }}
          onPointerDown={(event) => {
            rest.onPointerDown?.(event);
            if (disabled) event.preventDefault();
          }}
        >
          <span className="rds-filter-chip__label">{text}</span>
          <span className="rds-filter-chip-menu__chevron" aria-hidden="true">
            <ChevronDownIcon />
          </span>
        </button>
      }
    >
      {options.map((o) => (
        <DropdownMenuCheckboxItem
          key={o.value}
          checked={current.includes(o.value)}
          onCheckedChange={(checked) => toggle(o.value, checked)}
          count={o.count}
          disabled={o.disabled}
          textValue={o.label}
        >
          {o.label}
        </DropdownMenuCheckboxItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => emit([])} disabled={current.length === 0}>
        {clearLabel}
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
