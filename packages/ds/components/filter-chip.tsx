'use client';

import { useState, type ComponentPropsWithRef, type HTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { blockWhenDisabled } from './internal/button';

export interface FilterChipProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** The filter's name (Figma: `label`): Todos, Entradas, Saídas. With `asChild`, the link goes here with it. */
  children: ReactNode;
  /** How many items the filter leaves, after the label (Figma: `hasCount` + `count`). */
  count?: ReactNode;
  /** An icon before the label, in the label's colour (Figma: `showIcon` + `icon`). Decorative. */
  icon?: ReactNode;
  /** Controlled: the filter is on (Figma: `pressed`), as the Toggle. */
  pressed?: boolean;
  /** Uncontrolled: on at first. */
  defaultPressed?: boolean;
  /** Called with the new state when the chip is pressed (a button, not a link). */
  onPressedChange?: (pressed: boolean) => void;
  /** @deprecated Use `pressed` (2.0.0-next). */
  active?: boolean;
  /** @deprecated Use `defaultPressed` (2.0.0-next). */
  defaultActive?: boolean;
  /** @deprecated Use `onPressedChange` (2.0.0-next). */
  onActiveChange?: (active: boolean) => void;
  /** Rendered as aria-disabled="true": stays in the tab order and takes focus, but does not turn on or navigate. */
  disabled?: boolean;
  /**
   * Render the single child element (an `<a>`, a framework `Link`) with the chip's classes, for a filter that
   * lives in the URL and should survive back/forward. The link gets aria-current when pressed.
   */
  asChild?: boolean;
}

/**
 * FilterChip — Figma [RDS] Forms/FilterChip. A pill that turns a cut of the list on (Todos, Entradas, Saídas).
 * A button with aria-pressed, or, with `asChild`, a link with aria-current. Off: card fill, hairline; on: the
 * brand tint, brand border and label. Up to 5 in a FilterChipGroup; more than that, the Select. A value that can
 * be removed is the Chip. Styles: filter-chip.css.
 */
export function FilterChip({
  children,
  count,
  icon,
  pressed: pressedProp,
  defaultPressed,
  onPressedChange,
  active,
  defaultActive,
  onActiveChange,
  disabled,
  asChild,
  type = 'button',
  className,
  onClick,
  ...rest
}: FilterChipProps) {
  const pressed = pressedProp ?? active;
  const [own, setOwn] = useState(defaultPressed ?? defaultActive ?? false);
  const on = pressed ?? own;
  const Root = asChild ? Slot : 'button';

  function click(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented || asChild) return;
    if (pressed === undefined) setOwn(!on);
    (onPressedChange ?? onActiveChange)?.(!on);
  }

  return (
    <Root
      {...rest}
      type={asChild ? undefined : type}
      className={['rds-filter-chip', on && 'rds-filter-chip--pressed', className].filter(Boolean).join(' ')}
      aria-pressed={asChild ? undefined : on}
      aria-current={asChild && on ? 'true' : undefined}
      aria-disabled={disabled || undefined}
      onClick={blockWhenDisabled(disabled, click)}
    >
      {icon && (
        <span className="rds-filter-chip__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <Slottable>{asChild ? children : <span className="rds-filter-chip__label">{children}</span>}</Slottable>
      {count !== undefined && count !== null && count !== '' && <span className="rds-filter-chip__count">{count}</span>}
    </Root>
  );
}

export interface FilterChipGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Required: what the filters cut, such as "Filtrar por tipo". Several groups on a page must be told apart. */
  'aria-label': string;
  /** The FilterChips, up to 5. */
  children: ReactNode;
}

/** The row of FilterChips: a named group, 8 apart, wrapping on a narrow screen. */
export function FilterChipGroup({ className, children, ...rest }: FilterChipGroupProps) {
  return (
    <div role="group" {...rest} className={['rds-filter-chip-group', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
