'use client';

import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import { announce } from './internal/announce';
import { CloseIcon } from './internal/icons';

export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The chosen value (Figma: `label`): an applied filter, a recipient, a typed tag. */
  children: ReactNode;
  /** Icon before the label (Figma: `showIcon` + `iconName`). Decorative, rendered with aria-hidden. */
  icon?: ReactNode;
  /**
   * Shows the × (Figma: `showRemove`) and is called when it is pressed. Only the × removes: the chip
   * itself is not a button. After the removal, focus goes to the next chip's × in the same list (or the
   * previous one).
   */
  onRemove?: () => void;
  /** The ×'s accessible name. By default "Remover <label>", which needs a text label. */
  removeLabel?: string;
  /** Said to screen readers after the removal. By default "<label> removido". */
  removedMessage?: string;
  /** Rendered as aria-disabled="true": the × stays in the tab order, but pressing it does nothing. */
  disabled?: boolean;
}

/**
 * Chip — Figma [RDS] Actions/Chip. A chosen value that can be taken away. Not for choosing options
 * (Toggle, ToggleGroup) and not for labelling without an action (Badge). Styles: chip.css.
 */
export function Chip({
  children,
  icon,
  onRemove,
  removeLabel,
  removedMessage,
  disabled,
  className,
  ...rest
}: ChipProps) {
  const text = typeof children === 'string' || typeof children === 'number' ? String(children) : undefined;

  function remove(event: MouseEvent<HTMLButtonElement>) {
    if (disabled || !onRemove) return;
    const next = neighbourRemove(event.currentTarget);
    onRemove();
    const message = removedMessage ?? (text ? `${text} removido` : undefined);
    if (message) announce(message);
    // After React takes the chip out, focus the neighbour's × so the keyboard does not fall back to the page.
    requestAnimationFrame(() => next?.focus());
  }

  return (
    <span
      {...rest}
      // Disabled, the chip is an inactive group: assistive tech hears it as disabled, not just the ×,
      // and the lighter label is exempt from text contrast (WCAG 1.4.3).
      role={disabled ? 'group' : rest.role}
      aria-disabled={disabled || undefined}
      className={['rds-chip', onRemove && 'rds-chip--removable', disabled && 'rds-chip--disabled', className]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && (
        <span className="rds-chip__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="rds-chip__label">{children}</span>
      {onRemove && (
        <button
          type="button"
          className="rds-chip__remove"
          aria-label={removeLabel ?? `Remover ${text ?? ''}`.trim()}
          aria-disabled={disabled || undefined}
          onClick={remove}
        >
          <span className="rds-chip__remove-icon" aria-hidden="true">
            <CloseIcon />
          </span>
        </button>
      )}
    </span>
  );
}

/** The × to focus after this one goes: the next removable chip in the same list, or the previous one. */
function neighbourRemove(own: HTMLButtonElement): HTMLButtonElement | null {
  const chip = own.closest('.rds-chip');
  const list = chip?.closest('ul, ol, [role="list"]') ?? chip?.parentElement;
  if (!list) return null;
  const all = Array.from(list.querySelectorAll<HTMLButtonElement>('.rds-chip__remove:not([aria-disabled="true"])'));
  const index = all.indexOf(own);
  if (index === -1) return all[0] ?? null;
  return all[index + 1] ?? all[index - 1] ?? null;
}
